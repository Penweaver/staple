/**
 * STAPLE LIMITED — Festive & Seasonal Planning Test Suite (Phase 7)
 * Tests Owambe 42–100 day planning window (Spec §39),
 * instalment schedule generation & mathematical integrity (sum === total),
 * 7-day grace period and default evaluation (Addendum B5, Spec §35),
 * plan progress calculation, and 100% season cancellation refund policy (Addendum A2).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateOwambeDeliveryDate,
  generateInstalmentSchedule,
  evaluateInstalmentOverdue,
  calculateFestivePlanProgress,
  validateFestivePlanEnrollment,
  BUSINESS_RULES,
} from '@staple/shared';

test('Festive — Owambe 42–100 Day Delivery Planning Window (Spec §39 & §74)', () => {
  const creationDate = new Date('2026-10-01T00:00:00Z');

  // Case 1: Too soon (10 days) -> Rejected
  const tooSoon = new Date('2026-10-11T00:00:00Z');
  const resTooSoon = validateOwambeDeliveryDate(tooSoon, creationDate);
  assert.equal(resTooSoon.isValid, false);
  assert.equal(resTooSoon.daysDifference, 10);
  assert.match(resTooSoon.error ?? '', /at least 42 days/);

  // Case 2: Boundary below 42 (41 days) -> Rejected
  const boundaryBelow = new Date('2026-11-11T00:00:00Z');
  const resBelow = validateOwambeDeliveryDate(boundaryBelow, creationDate);
  assert.equal(resBelow.isValid, false);
  assert.equal(resBelow.daysDifference, 41);

  // Case 3: Exact lower boundary (42 days) -> Accepted
  const exactLower = new Date('2026-11-12T00:00:00Z');
  const resLower = validateOwambeDeliveryDate(exactLower, creationDate);
  assert.equal(resLower.isValid, true);
  assert.equal(resLower.daysDifference, 42);

  // Case 4: Mid-range (60 days) -> Accepted
  const midRange = new Date('2026-11-30T00:00:00Z');
  const resMid = validateOwambeDeliveryDate(midRange, creationDate);
  assert.equal(resMid.isValid, true);
  assert.equal(resMid.daysDifference, 60);

  // Case 5: Exact upper boundary (100 days) -> Accepted
  const exactUpper = new Date('2027-01-09T00:00:00Z');
  const resUpper = validateOwambeDeliveryDate(exactUpper, creationDate);
  assert.equal(resUpper.isValid, true);
  assert.equal(resUpper.daysDifference, 100);

  // Case 6: Boundary above 100 (101 days) -> Rejected
  const boundaryAbove = new Date('2027-01-10T00:00:00Z');
  const resAbove = validateOwambeDeliveryDate(boundaryAbove, creationDate);
  assert.equal(resAbove.isValid, false);
  assert.equal(resAbove.daysDifference, 101);
  assert.match(resAbove.error ?? '', /cannot exceed 100 days/);

  // Case 7: Far future (180 days) -> Rejected
  const farFuture = new Date('2027-03-30T00:00:00Z');
  const resFar = validateOwambeDeliveryDate(farFuture, creationDate);
  assert.equal(resFar.isValid, false);
});

test('Festive — Instalment Schedule Mathematical Integrity (Exact Sum Matching)', () => {
  const startDate = new Date('2026-09-01T00:00:00Z');
  const deliveryDate = new Date('2026-11-15T00:00:00Z'); // 75 days ahead

  // Case 1: Outright 1 payment of ₦180,000
  const outright = generateInstalmentSchedule(180000, 1, startDate, deliveryDate);
  assert.equal(outright.length, 1);
  assert.equal(outright[0].amount, 180000);
  assert.equal(outright[0].instalmentNumber, 1);

  // Case 2: 3 instalments of ₦100,000 (uneven division: 33,333.33 -> 33,333 + 33,333 + 33,334)
  const threeInstalments = generateInstalmentSchedule(100000, 3, startDate, deliveryDate);
  assert.equal(threeInstalments.length, 3);
  const sumThree = threeInstalments.reduce((sum, item) => sum + item.amount, 0);
  assert.equal(sumThree, 100000, 'Sum of instalments must exactly equal total amount');
  assert.equal(threeInstalments[0].amount, 33333);
  assert.equal(threeInstalments[1].amount, 33333);
  assert.equal(threeInstalments[2].amount, 33334, 'Remainder must be allocated to final instalment');

  // Case 3: Due dates must be monotonically increasing and prior to delivery cutoff (7 days before delivery)
  const cutoffDate = new Date('2026-11-08T00:00:00Z');
  for (let i = 0; i < threeInstalments.length; i++) {
    const due = new Date(threeInstalments[i].dueDate);
    assert.ok(due <= cutoffDate, `Instalment ${i + 1} due date ${threeInstalments[i].dueDate} must be on or before procurement cutoff 2026-11-08`);
    if (i > 0) {
      const prevDue = new Date(threeInstalments[i - 1].dueDate);
      assert.ok(due > prevDue, `Instalment ${i + 1} must be scheduled after instalment ${i}`);
    }
  }

  // Case 4: 4 instalments of ₦250,000
  const fourInstalments = generateInstalmentSchedule(250000, 4, startDate, deliveryDate);
  assert.equal(fourInstalments.length, 4);
  const sumFour = fourInstalments.reduce((sum, item) => sum + item.amount, 0);
  assert.equal(sumFour, 250000);
});

test('Festive — 7-Day Grace Period & Instalment Default Evaluator (Addendum B5, Spec §35)', () => {
  const currentDate = new Date('2026-10-15T00:00:00Z');

  // Case 1: Due date in the future (2026-10-20) -> Not overdue
  const futureDue = new Date('2026-10-20T00:00:00Z');
  const statusFuture = evaluateInstalmentOverdue(futureDue, currentDate);
  assert.equal(statusFuture.isOverdue, false);
  assert.equal(statusFuture.daysOverdue, 0);
  assert.equal(statusFuture.isBeyondGracePeriod, false);
  assert.equal(statusFuture.daysRemainingInGrace, 7);

  // Case 2: Due today (2026-10-15) -> Not overdue
  const todayDue = new Date('2026-10-15T00:00:00Z');
  const statusToday = evaluateInstalmentOverdue(todayDue, currentDate);
  assert.equal(statusToday.isOverdue, false);
  assert.equal(statusToday.daysOverdue, 0);

  // Case 3: Due 3 days ago (2026-10-12) -> Overdue, within 7-day grace period
  const due3DaysAgo = new Date('2026-10-12T00:00:00Z');
  const status3Days = evaluateInstalmentOverdue(due3DaysAgo, currentDate);
  assert.equal(status3Days.isOverdue, true);
  assert.equal(status3Days.daysOverdue, 3);
  assert.equal(status3Days.isBeyondGracePeriod, false, '3 days overdue is within 7-day grace');
  assert.equal(status3Days.daysRemainingInGrace, 4);

  // Case 4: Due exactly 7 days ago (2026-10-08) -> Last day of grace period
  const due7DaysAgo = new Date('2026-10-08T00:00:00Z');
  const status7Days = evaluateInstalmentOverdue(due7DaysAgo, currentDate);
  assert.equal(status7Days.isOverdue, true);
  assert.equal(status7Days.daysOverdue, 7);
  assert.equal(status7Days.isBeyondGracePeriod, false);
  assert.equal(status7Days.daysRemainingInGrace, 0);

  // Case 5: Due 8 days ago (2026-10-07) -> Exceeded grace period! Default / Forfeiture eligible
  const due8DaysAgo = new Date('2026-10-07T00:00:00Z');
  const status8Days = evaluateInstalmentOverdue(due8DaysAgo, currentDate);
  assert.equal(status8Days.isOverdue, true);
  assert.equal(status8Days.daysOverdue, 8);
  assert.equal(status8Days.isBeyondGracePeriod, true, '8 days overdue exceeds 7-day grace period');
  assert.equal(status8Days.daysRemainingInGrace, 0);
});

test('Festive — Plan Progress & Completion Tracking', () => {
  // Case 1: Fresh plan, 0 paid
  const p1 = calculateFestivePlanProgress(150000, 0);
  assert.equal(p1.progressPercentage, 0);
  assert.equal(p1.remainingAmount, 150000);
  assert.equal(p1.isFullyPaid, false);

  // Case 2: Partial payment
  const p2 = calculateFestivePlanProgress(150000, 50000);
  assert.equal(p2.progressPercentage, 33);
  assert.equal(p2.remainingAmount, 100000);
  assert.equal(p2.isFullyPaid, false);

  // Case 3: Fully paid
  const p3 = calculateFestivePlanProgress(150000, 150000);
  assert.equal(p3.progressPercentage, 100);
  assert.equal(p3.remainingAmount, 0);
  assert.equal(p3.isFullyPaid, true);
});

test('Festive — Enrollment Validation & Mandatory No-Refund Acknowledgement', () => {
  // Case 1: Missing no-refund acknowledgement -> Rejected
  const noAck = validateFestivePlanEnrollment({
    totalAmount: 120000,
    paymentType: 'instalment',
    category: 'christmas',
    deliveryDate: '2026-12-20',
    noRefundAcknowledged: false,
    numberOfInstalments: 3,
  });
  assert.equal(noAck.isValid, false);
  assert.match(noAck.errors[0], /non-refundable instalment default policy/);

  // Case 2: Owambe event outside 42-100 day window -> Rejected
  const invalidOwambe = validateFestivePlanEnrollment({
    totalAmount: 200000,
    paymentType: 'instalment',
    category: 'owambe_party',
    planCreationDate: new Date('2026-05-01'),
    deliveryDate: new Date('2026-05-15'), // Only 14 days away!
    noRefundAcknowledged: true,
    numberOfInstalments: 3,
  });
  assert.equal(invalidOwambe.isValid, false);
  assert.match(invalidOwambe.errors[0], /at least 42 days/);

  // Case 3: Valid Owambe enrollment -> Accepted
  const validOwambe = validateFestivePlanEnrollment({
    totalAmount: 200000,
    paymentType: 'instalment',
    category: 'owambe_party',
    planCreationDate: new Date('2026-05-01'),
    deliveryDate: new Date('2026-07-01'), // 61 days away
    noRefundAcknowledged: true,
    numberOfInstalments: 3,
  });
  assert.equal(validOwambe.isValid, true);
  assert.equal(validOwambe.errors.length, 0);
});
