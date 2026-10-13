/**
 * STAPLE LIMITED — Payment & Split Funding Utilities (Spec §23)
 * Wallet deduction allocation, Paystack kobo conversions, and anti-gaming fingerprint helpers
 */
/**
 * Calculate multi-funding split between user's STAPLE Wallet balance and external gateway (§23)
 */
export function calculateSplitPayment(params) {
    const { totalAmount, walletBalance, useWallet = true } = params;
    if (totalAmount <= 0) {
        throw new Error('Total amount must be greater than zero');
    }
    let walletAmount = 0;
    if (useWallet && walletBalance > 0) {
        walletAmount = Math.min(walletBalance, totalAmount);
    }
    const gatewayAmount = totalAmount - walletAmount;
    return {
        totalAmount,
        walletAmount,
        gatewayAmount,
        requiresGatewayPayment: gatewayAmount > 0,
        isFullyFundedByWallet: gatewayAmount === 0,
    };
}
/**
 * Detect payment fingerprint collisions across multiple user profiles (Addendum A4)
 */
export function detectPaymentFingerprintCollisions(transactions) {
    const map = new Map();
    for (const tx of transactions) {
        if (!tx.paymentFingerprint)
            continue;
        if (!map.has(tx.paymentFingerprint)) {
            map.set(tx.paymentFingerprint, new Set());
        }
        map.get(tx.paymentFingerprint).add(tx.userId);
    }
    const collisions = [];
    for (const [fingerprint, users] of map.entries()) {
        if (users.size > 1) {
            collisions.push({ fingerprint, userIds: Array.from(users) });
        }
    }
    return collisions;
}
//# sourceMappingURL=payment.js.map