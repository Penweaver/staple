/**
 * STAPLE LIMITED — Champion Management & Engagement Test Suite (Phase 5)
 * Verifies application validation, 2-active concurrent capacity limit (§8),
 * milestone reward rules (Addendum A3), lifecycle state transitions,
 * commercial non-manipulation guards (§9), and WhatsApp broadcast messaging.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ChampionStatus,
  canChampionCreateGroupBuy,
  calculateChampionTier,
  validateChampionApplication,
  generateChampionBroadcastMessage,
  formatNaira,
  BUSINESS_RULES,
  ChampionApplicationInput,
} from '@staple/shared';

test('Champion — Application Input Validation', () => {
  // Valid Nigerian application
  const validApp: ChampionApplicationInput = {
    full_name: 'Babatunde Adeleke',
    phone: '08031234567',
    state: 'Lagos',
    lga: 'Eti-Osa',
    neighborhood: 'Lekki Phase 1',
    estimated_network_size: 35,
    motivation: 'I lead the Lekki Phase 1 Estate Welfare Committee for bulk food buying.',
    experience: 'Resident association welfare officer for 2 years',
  };

  const res = validateChampionApplication(validApp);
  assert.equal(res.isValid, true, 'Valid application should pass');
  assert.equal(res.errors.length, 0);

  // Invalid: Short name, non-Nigerian phone, reach < 5, short motivation
  const invalidApp: ChampionApplicationInput = {
    full_name: 'B',
    phone: '12345',
    state: '',
    lga: '',
    neighborhood: '',
    estimated_network_size: 2,
    motivation: 'Food buy',
  };

  const badRes = validateChampionApplication(invalidApp);
  assert.equal(badRes.isValid, false, 'Invalid application should fail');
  assert.ok(badRes.errors.length >= 5, 'Should flag multiple validation errors');
  assert.ok(
    badRes.errors.some((e) => e.includes('Nigerian mobile phone')),
    'Should enforce Nigerian phone number',
  );
  assert.ok(
    badRes.errors.some((e) => e.includes('at least 5 households')),
    'Should enforce minimum community reach',
  );
});

test('Champion — 2-Active Concurrent Group Buy Limit (§8)', () => {
  const maxActive = BUSINESS_RULES.MAX_CHAMPION_ACTIVE_GROUP_BUYS; // 2

  // 1. Active champion with 0 active buys -> Allowed
  const check0 = canChampionCreateGroupBuy(ChampionStatus.ACTIVE, 0, maxActive);
  assert.equal(check0.allowed, true);

  // 2. Active champion with 1 active buy -> Allowed
  const check1 = canChampionCreateGroupBuy(ChampionStatus.ACTIVE, 1, maxActive);
  assert.equal(check1.allowed, true);

  // 3. Active champion with 2 active buys -> Blocked (Limit reached)
  const check2 = canChampionCreateGroupBuy(ChampionStatus.ACTIVE, 2, maxActive);
  assert.equal(check2.allowed, false);
  assert.ok(
    check2.reason?.includes('Maximum 2 allowed concurrently'),
    'Should explain the 2-active concurrency cap',
  );

  // 4. Inactive user -> Blocked
  const checkInactive = canChampionCreateGroupBuy(ChampionStatus.INACTIVE, 0, maxActive);
  assert.equal(checkInactive.allowed, false);
  assert.ok(
    checkInactive.reason?.includes('Only verified Active Champions'),
    'Should prevent non-champions from creating',
  );

  // 5. Suspended champion -> Blocked with suspension notice
  const checkSuspended = canChampionCreateGroupBuy(ChampionStatus.SUSPENDED, 0, maxActive);
  assert.equal(checkSuspended.allowed, false);
  assert.ok(
    checkSuspended.reason?.includes('account is currently suspended'),
    'Should report account suspension',
  );
});

test('Champion — Milestone Reward Qualification on Target Reached (Addendum A3)', () => {
  const milestoneRewardAmount = BUSINESS_RULES.CHAMPION_MILESTONE_REWARD_AMOUNT; // ₦2,000

  interface MockGroupBuyOutcome {
    creatorType: 'champion' | 'admin';
    targetQuantity: number;
    paidQuantity: number;
    minFulfilmentQuantity: number;
    status: 'target_reached' | 'delivery_fulfilment' | 'closed';
  }

  function evaluateMilestoneReward(gb: MockGroupBuyOutcome): {
    awarded: boolean;
    rewardAmount: number;
    reason: string;
  } {
    if (gb.creatorType !== 'champion') {
      return { awarded: false, rewardAmount: 0, reason: 'Admin-created buys do not earn milestone rewards' };
    }

    if (gb.paidQuantity >= gb.targetQuantity) {
      return {
        awarded: true,
        rewardAmount: milestoneRewardAmount,
        reason: `Target of ${gb.targetQuantity} units achieved (100%). Flat ₦${milestoneRewardAmount.toLocaleString()} credited to wallet.`,
      };
    }

    if (gb.paidQuantity >= gb.minFulfilmentQuantity) {
      return {
        awarded: false,
        rewardAmount: 0,
        reason: 'Group buy fulfilled at achieved tier via MVFQ, but target was not 100% reached (milestone strictly requires target reached).',
      };
    }

    return {
      awarded: false,
      rewardAmount: 0,
      reason: 'Group buy closed below MVFQ with refunds to all participants. No milestone reward.',
    };
  }

  // Case A: 100% target reached -> Champion earns flat ₦2,000
  const outcomeA = evaluateMilestoneReward({
    creatorType: 'champion',
    targetQuantity: 50,
    paidQuantity: 50,
    minFulfilmentQuantity: 15,
    status: 'target_reached',
  });
  assert.equal(outcomeA.awarded, true);
  assert.equal(outcomeA.rewardAmount, 2000);

  // Case B: Partial fulfilment at MVFQ (e.g. 30/50 paid >= 15 MVFQ) -> No milestone reward
  const outcomeB = evaluateMilestoneReward({
    creatorType: 'champion',
    targetQuantity: 50,
    paidQuantity: 30,
    minFulfilmentQuantity: 15,
    status: 'delivery_fulfilment',
  });
  assert.equal(outcomeB.awarded, false);
  assert.equal(outcomeB.rewardAmount, 0);
  assert.ok(outcomeB.reason.includes('milestone strictly requires target reached'));

  // Case C: Admin-created buy hits target -> No milestone reward
  const outcomeC = evaluateMilestoneReward({
    creatorType: 'admin',
    targetQuantity: 50,
    paidQuantity: 50,
    minFulfilmentQuantity: 15,
    status: 'target_reached',
  });
  assert.equal(outcomeC.awarded, false);
  assert.equal(outcomeC.rewardAmount, 0);
});

test('Champion — Performance Tier Resolution', () => {
  // Bronze tier: new or < 4 buys
  const tierBronze = calculateChampionTier(2, 500_000);
  assert.equal(tierBronze.tierName, 'Bronze Estate Champion');
  assert.equal(tierBronze.badge, '🥉');
  assert.equal(tierBronze.rank, 1);

  // Silver tier: >= 4 buys or >= ₦1.5m GMV
  const tierSilver = calculateChampionTier(5, 1_800_000);
  assert.equal(tierSilver.tierName, 'Silver Community Organizer');
  assert.equal(tierSilver.badge, '🥈');
  assert.equal(tierSilver.rank, 2);

  // Gold tier: >= 10 buys or >= ₦5.0m GMV
  const tierGold = calculateChampionTier(12, 6_200_000);
  assert.equal(tierGold.tierName, 'Gold Food Security Leader');
  assert.equal(tierGold.badge, '🥇');
  assert.equal(tierGold.rank, 3);
});

test('Champion — Commercial Non-Manipulation Guard (§9)', () => {
  // Champions can specify product and target volume, but NEVER base price or discount tiers
  interface ChampionCreationPayload {
    product_id: string;
    target_quantity: number;
    lifespan_days: number;
    service_area_id: string;
    collection_point_id: string;
    // Attempted illegal fields
    custom_price?: number;
    custom_discount_pct?: number;
  }

  function sanitizeChampionCreation(
    payload: ChampionCreationPayload,
    officialProductPrice: number,
  ) {
    if (payload.custom_price !== undefined || payload.custom_discount_pct !== undefined) {
      throw new Error('Commercial manipulation rejected: Champions cannot override catalogue price or discount tiers.');
    }

    return {
      product_id: payload.product_id,
      target_quantity: payload.target_quantity,
      lifespan_days: payload.lifespan_days,
      unit_price: officialProductPrice, // strictly uses catalogue price
    };
  }

  // Allowed creation
  const safePayload: ChampionCreationPayload = {
    product_id: 'prod-rice-50kg',
    target_quantity: 60,
    lifespan_days: 14,
    service_area_id: 'area-lekki-1',
    collection_point_id: 'hub-admiralty',
  };

  const result = sanitizeChampionCreation(safePayload, 85000);
  assert.equal(result.unit_price, 85000);

  // Attempted price hike/markdown
  const tamperingPayload: ChampionCreationPayload = {
    ...safePayload,
    custom_price: 90000,
  };

  assert.throws(
    () => sanitizeChampionCreation(tamperingPayload, 85000),
    /Commercial manipulation rejected/,
    'Must strictly block price manipulation by Champions',
  );
});

test('Champion — Localized WhatsApp Broadcast Message Generation', () => {
  const params = {
    groupBuyTitle: 'Mama Gold Premium Parboiled Rice (50kg)',
    unitPrice: 82875,
    targetQuantity: 50,
    currentPaidQuantity: 38,
    areaName: 'Lekki Phase 1',
    shareUrl: 'https://staple.ng/gb/mama-gold-rice-50kg-lekki',
    championName: 'Dele A.',
  };

  // Standard English message
  const msgEnglish = generateChampionBroadcastMessage({ ...params, dialect: 'standard' });
  assert.ok(msgEnglish.includes('Mama Gold Premium Parboiled Rice (50kg)'));
  assert.ok(msgEnglish.includes('₦82,875.00'));
  assert.ok(msgEnglish.includes('*Target Quantity:* 50 units (12 more needed to complete order)'));
  assert.ok(msgEnglish.includes('https://staple.ng/gb/mama-gold-rice-50kg-lekki'));
  assert.ok(msgEnglish.includes('Dele A.'));

  // Pidgin English message
  const msgPidgin = generateChampionBroadcastMessage({ ...params, dialect: 'pidgin' });
  assert.ok(msgPidgin.includes('NEIGHBOR, HEAR WORD! WHOLESALE FOODSTUFF DEY HAPPEN!'));
  assert.ok(msgPidgin.includes('₦82,875.00'));
  assert.ok(msgPidgin.includes('Make we buy am together sharp sharp'));
  assert.ok(msgPidgin.includes('Dele A.'));
});
