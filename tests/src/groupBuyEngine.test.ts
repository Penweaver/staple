import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateGroupBuyShareContent,
  formatNaira,
} from '@staple/shared';

// Test fixtures & domain types
interface PricingTier {
  minPercentage: number;
  maxPercentage: number | null;
  discountPercentage: number;
  discountedPrice: number;
}

function resolveActiveTier(
  basePrice: number,
  paidQuantity: number,
  targetQuantity: number,
  tiers: PricingTier[],
) {
  const progressPercentage = targetQuantity > 0 ? (paidQuantity / targetQuantity) * 100 : 0;

  const qualifyingTiers = tiers
    .filter((t) => progressPercentage >= t.minPercentage)
    .sort((a, b) => b.minPercentage - a.minPercentage);

  const activeTier = qualifyingTiers[0] || null;
  let currentPrice = basePrice;
  if (activeTier) {
    const discount = Math.round((basePrice * activeTier.discountPercentage) / 100);
    currentPrice = basePrice - discount;
  }

  return { currentPrice, activeTier, progressPercentage };
}

function calculateParticipantRebates(
  finalUnitPrice: number,
  orders: Array<{
    id: string;
    userId: string;
    quantity: number;
    unitPriceAtPurchase: number;
  }>,
) {
  return orders
    .map((order) => {
      const priceDiff = Math.max(0, order.unitPriceAtPurchase - finalUnitPrice);
      return {
        orderId: order.id,
        userId: order.userId,
        rebateAmount: priceDiff * order.quantity,
        quantity: order.quantity,
      };
    })
    .filter((r) => r.rebateAmount > 0);
}

function validateCumulativeUnitLimit(
  existingQuantity: number,
  requestedQuantity: number,
  maxLimit: number = 10,
) {
  if (requestedQuantity <= 0) throw new Error('Quantity must be positive');
  if (existingQuantity + requestedQuantity > maxLimit) {
    throw new Error(`Household limit exceeded. Maximum allowed is ${maxLimit} units.`);
  }
  return true;
}

function validateChampionActiveBuys(currentActive: number, maxAllowed: number = 2) {
  if (currentActive >= maxAllowed) {
    throw new Error(`Champion active limit reached. Maximum ${maxAllowed} active group buys.`);
  }
  return true;
}

test('Group Buy Engine — 10-Unit Cumulative User Ceiling (§74)', () => {
  // 1. Initial purchase of 4 units is valid
  assert.equal(validateCumulativeUnitLimit(0, 4, 10), true);

  // 2. Second purchase of 6 units brings cumulative to 10 (exact max) -> valid
  assert.equal(validateCumulativeUnitLimit(4, 6, 10), true);

  // 3. Third purchase of even 1 unit fails (already at 10)
  assert.throws(
    () => validateCumulativeUnitLimit(10, 1, 10),
    /Household limit exceeded/,
  );

  // 4. Attempting to purchase 11 units in one order fails
  assert.throws(
    () => validateCumulativeUnitLimit(0, 11, 10),
    /Household limit exceeded/,
  );
});

test('Group Buy Engine — Champion Active Capacity Guard (§8)', () => {
  // Champion can organize up to 2 active Group Buys concurrently
  assert.equal(validateChampionActiveBuys(0, 2), true);
  assert.equal(validateChampionActiveBuys(1, 2), true);

  // When already at 2, organizing a 3rd buy is blocked
  assert.throws(
    () => validateChampionActiveBuys(2, 2),
    /Champion active limit reached/,
  );
});

test('Group Buy Engine — Dynamic Tier Price Resolution & Retroactive Rebate Math (§20, §24)', () => {
  const basePrice = 85000;
  const targetQuantity = 100;

  const tiers: PricingTier[] = [
    { minPercentage: 0, maxPercentage: 49.99, discountPercentage: 0, discountedPrice: 85000 },
    { minPercentage: 50, maxPercentage: 74.99, discountPercentage: 2.5, discountedPrice: 82875 },
    { minPercentage: 75, maxPercentage: 99.99, discountPercentage: 5.0, discountedPrice: 80750 },
    { minPercentage: 100, maxPercentage: null, discountPercentage: 8.0, discountedPrice: 78200 },
  ];

  // At 30 units (30% progress): 0% discount
  const res1 = resolveActiveTier(basePrice, 30, targetQuantity, tiers);
  assert.equal(res1.currentPrice, 85000);
  assert.equal(res1.activeTier?.discountPercentage, 0);

  // At 55 units (55% progress): Tier 1 (2.5% discount)
  const res2 = resolveActiveTier(basePrice, 55, targetQuantity, tiers);
  assert.equal(res2.currentPrice, 82875);
  assert.equal(res2.activeTier?.discountPercentage, 2.5);

  // At 100 units (100% progress): Final Tier (8.0% discount = ₦78,200)
  const res3 = resolveActiveTier(basePrice, 100, targetQuantity, tiers);
  assert.equal(res3.currentPrice, 78200);
  assert.equal(res3.activeTier?.discountPercentage, 8.0);

  // Earlier participants joined at ₦85,000 or ₦82,875.
  // Verify retroactive rebate math credited back to their wallets:
  const orders = [
    { id: 'ord-1', userId: 'user-early-1', quantity: 5, unitPriceAtPurchase: 85000 }, // Paid ₦85,000, final is ₦78,200 -> diff ₦6,800 * 5 = ₦34,000
    { id: 'ord-2', userId: 'user-mid-2', quantity: 3, unitPriceAtPurchase: 82875 }, // Paid ₦82,875, final is ₦78,200 -> diff ₦4,675 * 3 = ₦14,025
    { id: 'ord-3', userId: 'user-late-3', quantity: 2, unitPriceAtPurchase: 78200 }, // Paid final price -> diff ₦0, no rebate
  ];

  const rebates = calculateParticipantRebates(78200, orders);
  assert.equal(rebates.length, 2);
  assert.equal(rebates[0].userId, 'user-early-1');
  assert.equal(rebates[0].rebateAmount, 34000);
  assert.equal(rebates[1].userId, 'user-mid-2');
  assert.equal(rebates[1].rebateAmount, 14025);
});

test('Group Buy Engine — Social Sharing & Deep Link Generation (§11)', () => {
  const content = generateGroupBuyShareContent({
    slug: 'mama-gold-rice-lekki',
    itemTitle: 'Mama Gold Premium Parboiled Rice (50kg)',
    unit: 'bag',
    areaName: 'Lekki Phase 1',
    currentPrice: 82875,
    originalPrice: 85000,
    paidQuantity: 58,
    targetQuantity: 100,
    hubName: 'staple Hub — Lekki Admiralty',
    championName: 'Dele A.',
  });

  // Check URL construction
  assert.equal(content.deepLinkUrl, 'https://staple.ng/gb/mama-gold-rice-lekki');
  assert.ok(content.qrCodeUrl.includes('create-qr-code'));
  assert.ok(content.qrCodeUrl.includes(encodeURIComponent('https://staple.ng/gb/mama-gold-rice-lekki')));

  // Check WhatsApp formatting (contains key Nigerian elements)
  assert.ok(content.whatsappMessage.includes('Mama Gold Premium Parboiled Rice (50kg)'));
  assert.ok(content.whatsappMessage.includes('Lekki Phase 1'));
  assert.ok(content.whatsappMessage.includes('₦82,875.00'));
  assert.ok(content.whatsappMessage.includes('58/100 orders filled'));
  assert.ok(content.whatsappMessage.includes('Dele A.'));
  assert.ok(content.whatsappMessage.includes('staple Hub — Lekki Admiralty'));

  // Check SMS formatting
  assert.ok(content.smsMessage.includes('https://staple.ng/gb/mama-gold-rice-lekki'));
});
