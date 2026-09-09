import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GroupBuyStatus,
  GroupBuyCreatorType,
  RefundReason,
} from '@staple/shared';

// Pure state machine transition evaluator matching DB constraints and Edge Functions
export function evaluateGroupBuyTransition(params: {
  currentStatus: GroupBuyStatus;
  creatorType: GroupBuyCreatorType;
  action: 'submit' | 'payment_verified' | 'expiry_tick' | 'order_paid' | 'fulfilment_done';
  targetQuantity: number;
  paidQuantity: number;
  minFulfilmentQuantity: number; // MVFQ (Addendum A1)
  expiresAt: Date;
  now: Date;
}): { nextStatus: GroupBuyStatus; triggerAutoRefund?: boolean; refundReason?: RefundReason } {
  const {
    currentStatus,
    creatorType,
    action,
    targetQuantity,
    paidQuantity,
    minFulfilmentQuantity,
    expiresAt,
    now,
  } = params;

  // 1. DRAFT transitions
  if (currentStatus === GroupBuyStatus.DRAFT && action === 'submit') {
    if (creatorType === GroupBuyCreatorType.ADMIN) {
      return { nextStatus: GroupBuyStatus.LIVE };
    }
    if (creatorType === GroupBuyCreatorType.CHAMPION) {
      return { nextStatus: GroupBuyStatus.PENDING_ACTIVATION };
    }
  }

  // 2. PENDING_ACTIVATION transitions (Champion payment verified)
  if (currentStatus === GroupBuyStatus.PENDING_ACTIVATION && action === 'payment_verified') {
    return { nextStatus: GroupBuyStatus.LIVE };
  }

  // 3. LIVE transitions (Target reached)
  if (currentStatus === GroupBuyStatus.LIVE && action === 'order_paid') {
    if (paidQuantity >= targetQuantity) {
      return { nextStatus: GroupBuyStatus.TARGET_REACHED };
    }
    return { nextStatus: GroupBuyStatus.LIVE };
  }

  // 4. LIVE transitions (14-day Lifespan Expiry)
  if (currentStatus === GroupBuyStatus.LIVE && action === 'expiry_tick' && now >= expiresAt) {
    // Check MVFQ threshold (Addendum A1)
    if (paidQuantity >= minFulfilmentQuantity) {
      return { nextStatus: GroupBuyStatus.DELIVERY_FULFILMENT };
    } else {
      // Below MVFQ -> Closes with full auto-refund to all participants (Addendum A2)
      return {
        nextStatus: GroupBuyStatus.CLOSED,
        triggerAutoRefund: true,
        refundReason: RefundReason.MVFQ_NOT_MET,
      };
    }
  }

  // 5. DELIVERY_FULFILMENT -> COMPLETED
  if (currentStatus === GroupBuyStatus.DELIVERY_FULFILMENT && action === 'fulfilment_done') {
    return { nextStatus: GroupBuyStatus.COMPLETED };
  }

  return { nextStatus: currentStatus };
}

test('Group Buy State Machine — Admin-created bypasses activation to LIVE', () => {
  const result = evaluateGroupBuyTransition({
    currentStatus: GroupBuyStatus.DRAFT,
    creatorType: GroupBuyCreatorType.ADMIN,
    action: 'submit',
    targetQuantity: 100,
    paidQuantity: 0,
    minFulfilmentQuantity: 20,
    expiresAt: new Date(Date.now() + 14 * 86400000),
    now: new Date(),
  });

  assert.equal(result.nextStatus, GroupBuyStatus.LIVE);
});

test('Group Buy State Machine — Champion-created requires activation payment', () => {
  // Step 1: Draft -> Pending Activation
  const step1 = evaluateGroupBuyTransition({
    currentStatus: GroupBuyStatus.DRAFT,
    creatorType: GroupBuyCreatorType.CHAMPION,
    action: 'submit',
    targetQuantity: 100,
    paidQuantity: 0,
    minFulfilmentQuantity: 20,
    expiresAt: new Date(Date.now() + 14 * 86400000),
    now: new Date(),
  });
  assert.equal(step1.nextStatus, GroupBuyStatus.PENDING_ACTIVATION);

  // Step 2: Payment verified -> LIVE
  const step2 = evaluateGroupBuyTransition({
    currentStatus: GroupBuyStatus.PENDING_ACTIVATION,
    creatorType: GroupBuyCreatorType.CHAMPION,
    action: 'payment_verified',
    targetQuantity: 100,
    paidQuantity: 5, // Champion bought 5 units
    minFulfilmentQuantity: 20,
    expiresAt: new Date(Date.now() + 14 * 86400000),
    now: new Date(),
  });
  assert.equal(step2.nextStatus, GroupBuyStatus.LIVE);
});

test('Group Buy State Machine — Target reached transitions to TARGET_REACHED', () => {
  const result = evaluateGroupBuyTransition({
    currentStatus: GroupBuyStatus.LIVE,
    creatorType: GroupBuyCreatorType.CHAMPION,
    action: 'order_paid',
    targetQuantity: 100,
    paidQuantity: 100,
    minFulfilmentQuantity: 20,
    expiresAt: new Date(Date.now() + 10 * 86400000),
    now: new Date(),
  });

  assert.equal(result.nextStatus, GroupBuyStatus.TARGET_REACHED);
});

test('Group Buy State Machine (MVFQ Addendum A1) — Expiry with paid_quantity >= MVFQ proceeds to DELIVERY_FULFILMENT', () => {
  const pastExpiry = new Date(Date.now() - 1000);
  const now = new Date();

  const result = evaluateGroupBuyTransition({
    currentStatus: GroupBuyStatus.LIVE,
    creatorType: GroupBuyCreatorType.CHAMPION,
    action: 'expiry_tick',
    targetQuantity: 100,
    paidQuantity: 25, // Above MVFQ (20), below Target (100)
    minFulfilmentQuantity: 20,
    expiresAt: pastExpiry,
    now: now,
  });

  assert.equal(result.nextStatus, GroupBuyStatus.DELIVERY_FULFILMENT);
  assert.equal(result.triggerAutoRefund, undefined);
});

test('Group Buy State Machine (MVFQ Addendum A1 & A2) — Expiry with paid_quantity < MVFQ transitions to CLOSED and triggers auto-refund', () => {
  const pastExpiry = new Date(Date.now() - 1000);
  const now = new Date();

  const result = evaluateGroupBuyTransition({
    currentStatus: GroupBuyStatus.LIVE,
    creatorType: GroupBuyCreatorType.CHAMPION,
    action: 'expiry_tick',
    targetQuantity: 100,
    paidQuantity: 3, // Champion only, below MVFQ (20)
    minFulfilmentQuantity: 20,
    expiresAt: pastExpiry,
    now: now,
  });

  assert.equal(result.nextStatus, GroupBuyStatus.CLOSED);
  assert.equal(result.triggerAutoRefund, true);
  assert.equal(result.refundReason, RefundReason.MVFQ_NOT_MET);
});
