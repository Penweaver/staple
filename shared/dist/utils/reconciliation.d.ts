/**
 * STAPLE LIMITED — Financial Reconciliation & System Hardening Utilities (Phase 9)
 * Double-entry ledger verification, system liability aggregation, MVFQ auto-resolution, and delayed rebate eligibility.
 */
/**
 * Verifies that a user's materialized wallet balance strictly matches
 * the sum of credits minus the sum of debits in their transaction ledger.
 *
 * @param currentBalance Current materialized balance in wallets table
 * @param transactions Array of ledger transactions for this wallet
 * @returns Object with balance status, computed ledger balance, and discrepancy amount
 */
export declare function verifyWalletLedgerIntegrity(currentBalance: number, transactions: Array<{
    entry_side: 'credit' | 'debit';
    amount: number;
}>): {
    isBalanced: boolean;
    discrepancy: number;
    ledgerBalance: number;
};
/**
 * Calculates total system liability across all active wallets in Nigerian Naira (₦).
 * This represents the exact liquid funds STAPLE holds on behalf of customers.
 */
export declare function calculateSystemWalletLiability(wallets: Array<{
    balance: number;
    is_active?: boolean;
}>): number;
/**
 * Evaluates whether an expired group buy should proceed to delivery fulfilment
 * or be closed with 100% wallet refunds based on Minimum Viable Fulfilment Quantity (MVFQ).
 * (Specification Addendum A1 & A2)
 */
export declare function evaluateExpiredGroupBuyResolution(groupBuy: {
    paid_quantity: number;
    min_fulfilment_quantity: number;
    target_quantity?: number;
}): 'fulfil' | 'refund';
/**
 * Checks whether a retroactive tier price drop credit is ready to be disbursed
 * to buyer wallets after the mandatory anti-arbitrage hold period (default: 48 hours).
 * (Specification Addendum A4)
 *
 * @param fulfilmentDate ISO string or Date when the group buy transitioned to fulfilment
 * @param hoursDelay Mandatory hold period in hours (default: 48)
 * @param referenceDate Reference timestamp (defaults to current time)
 */
export declare function isTierRebateReadyForDisbursement(fulfilmentDate: string | Date, hoursDelay?: number, referenceDate?: string | Date): boolean;
/**
 * Aggregates a fleet of wallets and their calculated ledger balances
 * into an executive reconciliation report.
 */
export declare function calculateWalletReconciliationSummary(walletsWithLedger: Array<{
    walletId: string;
    currentBalance: number;
    ledgerBalance: number;
}>): {
    totalWallets: number;
    balancedWallets: number;
    discrepantWallets: number;
    totalLiability: number;
    discrepantIds: string[];
};
/**
 * Humanizes audit log action identifiers into clean, readable labels.
 */
export declare function formatAuditActionLabel(action: string): string;
//# sourceMappingURL=reconciliation.d.ts.map