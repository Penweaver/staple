/**
 * STAPLE LIMITED — Festive & Seasonal Planning Domain Utilities (Phase 7)
 * Spec §31–§40, §74, and Founder Addendum v1 (B5, A2).
 */

import { BUSINESS_RULES } from '../constants/businessRules.js';

export interface OwambeValidationResult {
  isValid: boolean;
  error?: string;
  daysDifference: number;
}

export interface GeneratedInstalment {
  instalmentNumber: number;
  amount: number;
  dueDate: string; // ISO format: YYYY-MM-DD
}

export interface InstalmentOverdueStatus {
  isOverdue: boolean;
  daysOverdue: number;
  isBeyondGracePeriod: boolean;
  daysRemainingInGrace: number;
}

export interface FestivePlanProgress {
  progressPercentage: number;
  remainingAmount: number;
  isFullyPaid: boolean;
}

/**
 * Normalizes a date to UTC midnight for exact calendar day math
 */
function normalizeDate(d: Date | string): Date {
  const dateObj = typeof d === 'string' ? new Date(d) : new Date(d.getTime());
  return new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()));
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
function formatDate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates Owambe/Party delivery planning window (Spec §39 & §74)
 * Owambe plans must be planned between 42 days (6 weeks) and 100 days (~14 weeks)
 * ahead of the targeted event delivery date.
 */
export function validateOwambeDeliveryDate(
  deliveryDate: Date | string,
  planCreationDate: Date | string = new Date()
): OwambeValidationResult {
  const delivery = normalizeDate(deliveryDate);
  const creation = normalizeDate(planCreationDate);

  const diffMs = delivery.getTime() - creation.getTime();
  const daysDifference = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (daysDifference < BUSINESS_RULES.OWAMBE_MIN_PLANNING_DAYS) {
    return {
      isValid: false,
      error: `Owambe party delivery date must be at least ${BUSINESS_RULES.OWAMBE_MIN_PLANNING_DAYS} days (6 weeks) ahead to allow group farm-gate aggregation. Selected date is ${daysDifference} days away.`,
      daysDifference,
    };
  }

  if (daysDifference > BUSINESS_RULES.OWAMBE_MAX_PLANNING_DAYS) {
    return {
      isValid: false,
      error: `Owambe party delivery date cannot exceed ${BUSINESS_RULES.OWAMBE_MAX_PLANNING_DAYS} days (~14 weeks) into the future to protect against foodstuff inflation. Selected date is ${daysDifference} days away.`,
      daysDifference,
    };
  }

  return {
    isValid: true,
    daysDifference,
  };
}

/**
 * Generates an exact instalment schedule for a festive/seasonal plan
 * - Guarantees exact sum matching: sum(instalments.amount) === totalAmount
 * - Final instalment cut-off is placed at least 7 days before delivery date
 *   so STAPLE can procure and package goods before the collection window.
 */
export function generateInstalmentSchedule(
  totalAmount: number,
  numberOfInstalments: number,
  planStartDate: Date | string = new Date(),
  targetDeliveryDate: Date | string
): GeneratedInstalment[] {
  if (totalAmount <= 0) {
    throw new Error('Total plan amount must be greater than zero');
  }

  const start = normalizeDate(planStartDate);
  const delivery = normalizeDate(targetDeliveryDate);

  if (delivery.getTime() <= start.getTime()) {
    throw new Error('Target delivery date must be strictly after the plan start date');
  }

  const clampedInstalments = Math.max(1, Math.min(numberOfInstalments, 12));

  // If 1 instalment (outright payment), due on the start date
  if (clampedInstalments === 1) {
    return [
      {
        instalmentNumber: 1,
        amount: totalAmount,
        dueDate: formatDate(start),
      },
    ];
  }

  // Procurement cutoff: 7 days before delivery
  const cutoffTime = delivery.getTime() - 7 * 24 * 60 * 60 * 1000;
  const effectiveCutoff = cutoffTime > start.getTime() ? cutoffTime : delivery.getTime();

  // Distribute amounts: base amount per instalment + remainder on the final instalment
  const baseAmount = Math.floor(totalAmount / clampedInstalments);
  const remainder = totalAmount - baseAmount * clampedInstalments;

  const totalWindowMs = effectiveCutoff - start.getTime();
  const intervalMs = totalWindowMs / (clampedInstalments - 1);

  const schedule: GeneratedInstalment[] = [];

  for (let i = 0; i < clampedInstalments; i++) {
    const isLast = i === clampedInstalments - 1;
    const instalmentDueDate = isLast
      ? new Date(effectiveCutoff)
      : new Date(start.getTime() + i * intervalMs);

    const amount = isLast ? baseAmount + remainder : baseAmount;

    schedule.push({
      instalmentNumber: i + 1,
      amount,
      dueDate: formatDate(instalmentDueDate),
    });
  }

  return schedule;
}

/**
 * Evaluates the overdue status of an instalment against the 7-day grace period
 * Spec §35 and Founder Addendum B5.
 */
export function evaluateInstalmentOverdue(
  dueDate: Date | string,
  currentDate: Date | string = new Date()
): InstalmentOverdueStatus {
  const due = normalizeDate(dueDate);
  const current = normalizeDate(currentDate);

  const diffMs = current.getTime() - due.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const isOverdue = diffDays > 0;
  const daysOverdue = Math.max(0, diffDays);

  const isBeyondGracePeriod = daysOverdue > BUSINESS_RULES.INSTALMENT_GRACE_PERIOD_DAYS;
  const daysRemainingInGrace = isOverdue
    ? Math.max(0, BUSINESS_RULES.INSTALMENT_GRACE_PERIOD_DAYS - daysOverdue)
    : BUSINESS_RULES.INSTALMENT_GRACE_PERIOD_DAYS;

  return {
    isOverdue,
    daysOverdue,
    isBeyondGracePeriod,
    daysRemainingInGrace,
  };
}

/**
 * Calculates current progress, remaining amount, and completion status of a Festive Plan
 */
export function calculateFestivePlanProgress(
  totalAmount: number,
  paidAmount: number
): FestivePlanProgress {
  const clampedPaid = Math.max(0, Math.min(paidAmount, totalAmount));
  const remainingAmount = Math.max(0, totalAmount - clampedPaid);
  const progressPercentage =
    totalAmount > 0 ? Math.min(100, Math.round((clampedPaid / totalAmount) * 100)) : 0;
  const isFullyPaid = clampedPaid >= totalAmount;

  return {
    progressPercentage,
    remainingAmount,
    isFullyPaid,
  };
}

/**
 * Comprehensive validation helper for festive plan enrollment
 */
export function validateFestivePlanEnrollment(params: {
  totalAmount: number;
  paymentType: 'outright' | 'instalment';
  category: 'christmas' | 'ileya' | 'owambe_party';
  deliveryDate: Date | string;
  noRefundAcknowledged: boolean;
  planCreationDate?: Date | string;
  numberOfInstalments?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (params.totalAmount <= 0) {
    errors.push('Plan total amount must be greater than zero');
  }

  if (!params.noRefundAcknowledged) {
    errors.push(
      'You must acknowledge and accept the non-refundable instalment default policy (§35) to create a festive plan.'
    );
  }

  if (params.category === 'owambe_party') {
    const owambeCheck = validateOwambeDeliveryDate(
      params.deliveryDate,
      params.planCreationDate
    );
    if (!owambeCheck.isValid && owambeCheck.error) {
      errors.push(owambeCheck.error);
    }
  }

  if (params.paymentType === 'instalment') {
    const count = params.numberOfInstalments ?? 0;
    if (count < 2 || count > 6) {
      errors.push('Instalment plans must have between 2 and 6 scheduled payments.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
