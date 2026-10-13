/**
 * STAPLE LIMITED — Festive & Seasonal Planning Domain Utilities (Phase 7)
 * Spec §31–§40, §74, and Founder Addendum v1 (B5, A2).
 */
export interface OwambeValidationResult {
    isValid: boolean;
    error?: string;
    daysDifference: number;
}
export interface GeneratedInstalment {
    instalmentNumber: number;
    amount: number;
    dueDate: string;
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
 * Validates Owambe/Party delivery planning window (Spec §39 & §74)
 * Owambe plans must be planned between 42 days (6 weeks) and 100 days (~14 weeks)
 * ahead of the targeted event delivery date.
 */
export declare function validateOwambeDeliveryDate(deliveryDate: Date | string, planCreationDate?: Date | string): OwambeValidationResult;
/**
 * Generates an exact instalment schedule for a festive/seasonal plan
 * - Guarantees exact sum matching: sum(instalments.amount) === totalAmount
 * - Final instalment cut-off is placed at least 7 days before delivery date
 *   so STAPLE can procure and package goods before the collection window.
 */
export declare function generateInstalmentSchedule(totalAmount: number, numberOfInstalments: number, planStartDate: (Date | string) | undefined, targetDeliveryDate: Date | string): GeneratedInstalment[];
/**
 * Evaluates the overdue status of an instalment against the 7-day grace period
 * Spec §35 and Founder Addendum B5.
 */
export declare function evaluateInstalmentOverdue(dueDate: Date | string, currentDate?: Date | string): InstalmentOverdueStatus;
/**
 * Calculates current progress, remaining amount, and completion status of a Festive Plan
 */
export declare function calculateFestivePlanProgress(totalAmount: number, paidAmount: number): FestivePlanProgress;
/**
 * Comprehensive validation helper for festive plan enrollment
 */
export declare function validateFestivePlanEnrollment(params: {
    totalAmount: number;
    paymentType: 'outright' | 'instalment';
    category: 'christmas' | 'ileya' | 'owambe_party';
    deliveryDate: Date | string;
    noRefundAcknowledged: boolean;
    planCreationDate?: Date | string;
    numberOfInstalments?: number;
}): {
    isValid: boolean;
    errors: string[];
};
//# sourceMappingURL=festive.d.ts.map