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
export function verifyWalletLedgerIntegrity(
  currentBalance: number,
  transactions: Array<{ entry_side: 'credit' | 'debit'; amount: number }>
): { isBalanced: boolean; discrepancy: number; ledgerBalance: number } {
  const sum = transactions.reduce((acc, tx) => {
    const amt = typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount) || '0');
    if (tx.entry_side === 'credit') {
      return acc + amt;
    } else if (tx.entry_side === 'debit') {
      return acc - amt;
    }
    return acc;
  }, 0);

  const roundedLedger = Math.round(sum * 100) / 100;
  const roundedCurrent = Math.round(currentBalance * 100) / 100;
  const discrepancy = Math.round((roundedCurrent - roundedLedger) * 100) / 100;

  return {
    isBalanced: Math.abs(discrepancy) < 0.001,
    discrepancy,
    ledgerBalance: roundedLedger,
  };
}

/**
 * Calculates total system liability across all active wallets in Nigerian Naira (₦).
 * This represents the exact liquid funds STAPLE holds on behalf of customers.
 */
export function calculateSystemWalletLiability(
  wallets: Array<{ balance: number; is_active?: boolean }>
): number {
  const total = wallets.reduce((acc, w) => {
    if (w.is_active === false) return acc;
    const bal = typeof w.balance === 'number' ? w.balance : parseFloat(String(w.balance) || '0');
    return acc + Math.max(0, bal);
  }, 0);

  return Math.round(total * 100) / 100;
}

/**
 * Evaluates whether an expired group buy should proceed to delivery fulfilment
 * or be closed with 100% wallet refunds based on Minimum Viable Fulfilment Quantity (MVFQ).
 * (Specification Addendum A1 & A2)
 */
export function evaluateExpiredGroupBuyResolution(groupBuy: {
  paid_quantity: number;
  min_fulfilment_quantity: number;
  target_quantity?: number;
}): 'fulfil' | 'refund' {
  if (groupBuy.paid_quantity >= groupBuy.min_fulfilment_quantity) {
    return 'fulfil';
  }
  return 'refund';
}

/**
 * Checks whether a retroactive tier price drop credit is ready to be disbursed
 * to buyer wallets after the mandatory anti-arbitrage hold period (default: 48 hours).
 * (Specification Addendum A4)
 *
 * @param fulfilmentDate ISO string or Date when the group buy transitioned to fulfilment
 * @param hoursDelay Mandatory hold period in hours (default: 48)
 * @param referenceDate Reference timestamp (defaults to current time)
 */
export function isTierRebateReadyForDisbursement(
  fulfilmentDate: string | Date,
  hoursDelay = 48,
  referenceDate: string | Date = new Date()
): boolean {
  const fDate = typeof fulfilmentDate === 'string' ? new Date(fulfilmentDate) : fulfilmentDate;
  const rDate = typeof referenceDate === 'string' ? new Date(referenceDate) : referenceDate;

  if (isNaN(fDate.getTime()) || isNaN(rDate.getTime())) {
    return false;
  }

  const requiredWaitMs = hoursDelay * 60 * 60 * 1000;
  return rDate.getTime() - fDate.getTime() >= requiredWaitMs;
}

/**
 * Aggregates a fleet of wallets and their calculated ledger balances
 * into an executive reconciliation report.
 */
export function calculateWalletReconciliationSummary(
  walletsWithLedger: Array<{
    walletId: string;
    currentBalance: number;
    ledgerBalance: number;
  }>
): {
  totalWallets: number;
  balancedWallets: number;
  discrepantWallets: number;
  totalLiability: number;
  discrepantIds: string[];
} {
  let balanced = 0;
  let discrepant = 0;
  let totalLiability = 0;
  const discrepantIds: string[] = [];

  for (const w of walletsWithLedger) {
    totalLiability += Math.max(0, w.currentBalance);
    const diff = Math.abs(Math.round((w.currentBalance - w.ledgerBalance) * 100) / 100);
    if (diff < 0.001) {
      balanced++;
    } else {
      discrepant++;
      discrepantIds.push(w.walletId);
    }
  }

  return {
    totalWallets: walletsWithLedger.length,
    balancedWallets: balanced,
    discrepantWallets: discrepant,
    totalLiability: Math.round(totalLiability * 100) / 100,
    discrepantIds,
  };
}

/**
 * Humanizes audit log action identifiers into clean, readable labels.
 */
export function formatAuditActionLabel(action: string): string {
  if (!action) return 'Unknown Action';
  return action
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
