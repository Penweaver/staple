/**
 * STAPLE LIMITED — Payment & Split Funding Utilities (Spec §23)
 * Wallet deduction allocation, Paystack kobo conversions, and anti-gaming fingerprint helpers
 */
export interface SplitPaymentResult {
    totalAmount: number;
    walletAmount: number;
    gatewayAmount: number;
    requiresGatewayPayment: boolean;
    isFullyFundedByWallet: boolean;
}
/**
 * Calculate multi-funding split between user's STAPLE Wallet balance and external gateway (§23)
 */
export declare function calculateSplitPayment(params: {
    totalAmount: number;
    walletBalance: number;
    useWallet?: boolean;
}): SplitPaymentResult;
/**
 * Detect payment fingerprint collisions across multiple user profiles (Addendum A4)
 */
export declare function detectPaymentFingerprintCollisions(transactions: Array<{
    userId: string;
    paymentFingerprint: string | null;
}>): Array<{
    fingerprint: string;
    userIds: string[];
}>;
//# sourceMappingURL=payment.d.ts.map