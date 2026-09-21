import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyWalletLedgerIntegrity,
  calculateSystemWalletLiability,
  evaluateExpiredGroupBuyResolution,
  isTierRebateReadyForDisbursement,
  calculateWalletReconciliationSummary,
  formatAuditActionLabel,
} from '@staple/shared';

test('Hardening — verifyWalletLedgerIntegrity validates balanced wallet correctly', () => {
  const transactions: Array<{ entry_side: 'credit' | 'debit'; amount: number }> = [
    { entry_side: 'credit', amount: 50000 },
    { entry_side: 'debit', amount: 12500 },
    { entry_side: 'credit', amount: 2500 }, // price adjustment rebate
    { entry_side: 'debit', amount: 5000 },
  ];
  // Expected: 50000 - 12500 + 2500 - 5000 = 35000

  const result = verifyWalletLedgerIntegrity(35000, transactions);
  assert.equal(result.isBalanced, true);
  assert.equal(result.ledgerBalance, 35000);
  assert.equal(result.discrepancy, 0);
});

test('Hardening — verifyWalletLedgerIntegrity flags discrepancy when balance differs from ledger', () => {
  const transactions: Array<{ entry_side: 'credit' | 'debit'; amount: number }> = [
    { entry_side: 'credit', amount: 10000 },
    { entry_side: 'debit', amount: 3000 },
  ];
  // Ledger balance = 7000, but materialized wallet is 8500
  const result = verifyWalletLedgerIntegrity(8500, transactions);
  assert.equal(result.isBalanced, false);
  assert.equal(result.ledgerBalance, 7000);
  assert.equal(result.discrepancy, 1500);
});

test('Hardening — calculateSystemWalletLiability aggregates active wallets in Naira', () => {
  const wallets = [
    { balance: 25000, is_active: true },
    { balance: 45500.5, is_active: true },
    { balance: 10000, is_active: false }, // Should be excluded
    { balance: 500.25, is_active: true },
  ];

  const liability = calculateSystemWalletLiability(wallets);
  // 25000 + 45500.5 + 500.25 = 71000.75
  assert.equal(liability, 71000.75);
});

test('Hardening — evaluateExpiredGroupBuyResolution enforces MVFQ threshold (§Addendum A1 & A2)', () => {
  // Case 1: Reached MVFQ exactly (10/10) -> Fulfil
  assert.equal(
    evaluateExpiredGroupBuyResolution({
      paid_quantity: 10,
      min_fulfilment_quantity: 10,
      target_quantity: 20,
    }),
    'fulfil'
  );

  // Case 2: Exceeded MVFQ (15/10) -> Fulfil
  assert.equal(
    evaluateExpiredGroupBuyResolution({
      paid_quantity: 15,
      min_fulfilment_quantity: 10,
      target_quantity: 20,
    }),
    'fulfil'
  );

  // Case 3: Failed MVFQ (9/10) -> 100% Refund
  assert.equal(
    evaluateExpiredGroupBuyResolution({
      paid_quantity: 9,
      min_fulfilment_quantity: 10,
      target_quantity: 20,
    }),
    'refund'
  );

  // Case 4: Zero sales (0/10) -> Refund
  assert.equal(
    evaluateExpiredGroupBuyResolution({
      paid_quantity: 0,
      min_fulfilment_quantity: 10,
    }),
    'refund'
  );
});

test('Hardening — isTierRebateReadyForDisbursement enforces 48-hour hold window (§Addendum A4)', () => {
  const fulfilmentTime = new Date('2026-09-01T10:00:00Z');

  // Case 1: Only 24 hours elapsed -> Not ready
  const check24h = new Date('2026-09-02T10:00:00Z');
  assert.equal(isTierRebateReadyForDisbursement(fulfilmentTime, 48, check24h), false);

  // Case 2: Exactly 48 hours elapsed -> Ready
  const check48h = new Date('2026-09-03T10:00:00Z');
  assert.equal(isTierRebateReadyForDisbursement(fulfilmentTime, 48, check48h), true);

  // Case 3: 72 hours elapsed -> Ready
  const check72h = new Date('2026-09-04T10:00:00Z');
  assert.equal(isTierRebateReadyForDisbursement(fulfilmentTime, 48, check72h), true);

  // Case 4: Invalid date input -> false
  assert.equal(isTierRebateReadyForDisbursement('invalid-date', 48, check72h), false);
});

test('Hardening — calculateWalletReconciliationSummary provides accurate ledger overview', () => {
  const wallets = [
    { walletId: 'w1', currentBalance: 1000, ledgerBalance: 1000 },
    { walletId: 'w2', currentBalance: 2500, ledgerBalance: 2500 },
    { walletId: 'w3', currentBalance: 3000, ledgerBalance: 2800 }, // Discrepant
  ];

  const summary = calculateWalletReconciliationSummary(wallets);
  assert.equal(summary.totalWallets, 3);
  assert.equal(summary.balancedWallets, 2);
  assert.equal(summary.discrepantWallets, 1);
  assert.equal(summary.totalLiability, 6500);
  assert.deepEqual(summary.discrepantIds, ['w3']);
});

test('Hardening — formatAuditActionLabel converts database keys to readable labels', () => {
  assert.equal(
    formatAuditActionLabel('wallet_reconciliation_audit'),
    'Wallet Reconciliation Audit'
  );
  assert.equal(
    formatAuditActionLabel('group_buy_auto_transition_fulfilment'),
    'Group Buy Auto Transition Fulfilment'
  );
  assert.equal(formatAuditActionLabel(''), 'Unknown Action');
});
