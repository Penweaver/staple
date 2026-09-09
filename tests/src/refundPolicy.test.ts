import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GroupBuyStatus,
  RefundReason,
} from '@staple/shared';

// Evaluates refund eligibility strictly according to §4.1 Refund Policy Matrix
export function evaluateRefundEligibility(params: {
  productType: 'regular_group_buy' | 'festive_basket_plan';
  currentStatus: GroupBuyStatus | 'active' | 'season_cancelled';
  cancellationType: 'user_initiated' | 'mvfq_not_met' | 'fulfilment_failed' | 'staple_season_cancelled';
}): { eligible: boolean; refundReason?: RefundReason; error?: string } {
  const { productType, currentStatus, cancellationType } = params;

  // 1. Regular Group Buy
  if (productType === 'regular_group_buy') {
    if (cancellationType === 'user_initiated') {
      if (currentStatus === GroupBuyStatus.LIVE) {
        return { eligible: true, refundReason: RefundReason.USER_CANCELLED };
      }
      if (
        currentStatus === GroupBuyStatus.TARGET_REACHED ||
        currentStatus === GroupBuyStatus.DELIVERY_FULFILMENT
      ) {
        return {
          eligible: false,
          error: 'No refund permitted after TARGET_REACHED or during DELIVERY_FULFILMENT (procurement locked in).',
        };
      }
    }

    if (cancellationType === 'mvfq_not_met') {
      if (currentStatus === GroupBuyStatus.CLOSED) {
        return { eligible: true, refundReason: RefundReason.MVFQ_NOT_MET };
      }
    }

    if (cancellationType === 'fulfilment_failed') {
      return { eligible: true, refundReason: RefundReason.FULFILMENT_FAILED };
    }
  }

  // 2. Festive Basket Plan
  if (productType === 'festive_basket_plan') {
    if (cancellationType === 'user_initiated') {
      return {
        eligible: false,
        error: 'Festive Basket Plans are strictly NO REFUND for user cancellations (§35).',
      };
    }

    if (cancellationType === 'staple_season_cancelled') {
      return { eligible: true, refundReason: RefundReason.FESTIVE_SEASON_CANCELLED };
    }
  }

  return { eligible: false, error: 'Invalid refund request.' };
}

test('Refund Policy Matrix (§4.1) — LIVE user cancellation qualifies for full refund', () => {
  const result = evaluateRefundEligibility({
    productType: 'regular_group_buy',
    currentStatus: GroupBuyStatus.LIVE,
    cancellationType: 'user_initiated',
  });

  assert.equal(result.eligible, true);
  assert.equal(result.refundReason, RefundReason.USER_CANCELLED);
});

test('Refund Policy Matrix (§4.1) — TARGET_REACHED cancellation is rejected', () => {
  const result = evaluateRefundEligibility({
    productType: 'regular_group_buy',
    currentStatus: GroupBuyStatus.TARGET_REACHED,
    cancellationType: 'user_initiated',
  });

  assert.equal(result.eligible, false);
  assert.match(result.error ?? '', /procurement locked in/i);
});

test('Refund Policy Matrix (§4.1) — MVFQ not met closure qualifies for automatic refund', () => {
  const result = evaluateRefundEligibility({
    productType: 'regular_group_buy',
    currentStatus: GroupBuyStatus.CLOSED,
    cancellationType: 'mvfq_not_met',
  });

  assert.equal(result.eligible, true);
  assert.equal(result.refundReason, RefundReason.MVFQ_NOT_MET);
});

test('Refund Policy Matrix (§4.1) — Festive Plan user cancellation is rejected (no-refund rule §35)', () => {
  const result = evaluateRefundEligibility({
    productType: 'festive_basket_plan',
    currentStatus: 'active',
    cancellationType: 'user_initiated',
  });

  assert.equal(result.eligible, false);
  assert.match(result.error ?? '', /NO REFUND/i);
});

test('Refund Policy Matrix (§4.1) — STAPLE Festive Season cancellation qualifies for full refund (Addendum A2)', () => {
  const result = evaluateRefundEligibility({
    productType: 'festive_basket_plan',
    currentStatus: 'season_cancelled',
    cancellationType: 'staple_season_cancelled',
  });

  assert.equal(result.eligible, true);
  assert.equal(result.refundReason, RefundReason.FESTIVE_SEASON_CANCELLED);
});
