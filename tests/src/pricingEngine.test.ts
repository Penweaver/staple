import { test } from 'node:test';
import assert from 'node:assert/strict';

export interface PricingTier {
  minPercentage: number;
  maxPercentage: number | null;
  discountPercentage: number;
}

export function calculateEffectiveUnitPrice(params: {
  basePrice: number;
  targetQuantity: number;
  paidQuantity: number;
  tiers: PricingTier[];
}): { unitPrice: number; activeTier: PricingTier | null } {
  const { basePrice, targetQuantity, paidQuantity, tiers } = params;
  const progressPct = (paidQuantity / targetQuantity) * 100;

  // Find the highest qualifying tier (inclusive boundary, e.g. 50.00%)
  const activeTier = tiers
    .filter((tier) => progressPct >= tier.minPercentage)
    .sort((a, b) => b.minPercentage - a.minPercentage)[0] || null;

  if (!activeTier) {
    return { unitPrice: basePrice, activeTier: null };
  }

  const discountAmount = Math.round((basePrice * activeTier.discountPercentage) / 100);
  const unitPrice = basePrice - discountAmount;

  return { unitPrice, activeTier };
}

export function detectPaymentFingerprintCollisions(transactions: Array<{
  userId: string;
  paymentFingerprint: string | null;
}>): Array<{ fingerprint: string; userIds: string[] }> {
  const map = new Map<string, Set<string>>();

  for (const tx of transactions) {
    if (!tx.paymentFingerprint) continue;
    if (!map.has(tx.paymentFingerprint)) {
      map.set(tx.paymentFingerprint, new Set());
    }
    map.get(tx.paymentFingerprint)!.add(tx.userId);
  }

  const collisions: Array<{ fingerprint: string; userIds: string[] }> = [];
  for (const [fingerprint, users] of map.entries()) {
    if (users.size > 1) {
      collisions.push({ fingerprint, userIds: Array.from(users) });
    }
  }

  return collisions;
}

test('Pricing Engine — Calculates dynamic tier discount accurately (§20)', () => {
  const tiers: PricingTier[] = [
    { minPercentage: 0, maxPercentage: 49, discountPercentage: 0 },
    { minPercentage: 50, maxPercentage: 74, discountPercentage: 2.5 },
    { minPercentage: 75, maxPercentage: 100, discountPercentage: 5.0 },
  ];

  const basePrice = 100000;
  const target = 100;

  // 1. Below 50% target
  const p1 = calculateEffectiveUnitPrice({ basePrice, targetQuantity: target, paidQuantity: 40, tiers });
  assert.equal(p1.unitPrice, 100000);

  // 2. Exactly 50% target (inclusive boundary)
  const p2 = calculateEffectiveUnitPrice({ basePrice, targetQuantity: target, paidQuantity: 50, tiers });
  assert.equal(p2.unitPrice, 97500);

  // 3. At 75% target
  const p3 = calculateEffectiveUnitPrice({ basePrice, targetQuantity: target, paidQuantity: 75, tiers });
  assert.equal(p3.unitPrice, 95000);

  // 4. Above 75% target
  const p4 = calculateEffectiveUnitPrice({ basePrice, targetQuantity: target, paidQuantity: 95, tiers });
  assert.equal(p4.unitPrice, 95000);
});

test('Anti-Gaming (Addendum A4) — Detects payment fingerprint reuse across profiles', () => {
  const transactions = [
    { userId: 'user-alpha', paymentFingerprint: 'auth_sig_abc123' },
    { userId: 'user-beta', paymentFingerprint: 'auth_sig_abc123' }, // Collision!
    { userId: 'user-gamma', paymentFingerprint: 'auth_sig_xyz999' },
  ];

  const collisions = detectPaymentFingerprintCollisions(transactions);
  assert.equal(collisions.length, 1);
  assert.equal(collisions[0].fingerprint, 'auth_sig_abc123');
  assert.deepEqual(collisions[0].userIds, ['user-alpha', 'user-beta']);
});
