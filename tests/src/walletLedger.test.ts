import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  WalletEntrySide,
  WalletTransactionType,
} from '@staple/shared';

// Pure double-entry balance calculator and split allocation engine
export function applyWalletTransaction(params: {
  currentBalance: number;
  entrySide: WalletEntrySide;
  amount: number;
  type: WalletTransactionType;
}): { newBalance: number; isValid: boolean; error?: string } {
  const { currentBalance, entrySide, amount } = params;

  if (amount <= 0) {
    return { newBalance: currentBalance, isValid: false, error: 'Amount must be positive' };
  }

  if (entrySide === WalletEntrySide.CREDIT) {
    const newBalance = currentBalance + amount;
    return { newBalance, isValid: true };
  }

  if (entrySide === WalletEntrySide.DEBIT) {
    if (currentBalance < amount) {
      return {
        newBalance: currentBalance,
        isValid: false,
        error: `Insufficient balance: requested debit ₦${amount}, available ₦${currentBalance}`,
      };
    }
    const newBalance = currentBalance - amount;
    return { newBalance, isValid: true };
  }

  return { newBalance: currentBalance, isValid: false, error: 'Invalid entry side' };
}

export function calculateCheckoutSplit(params: {
  orderTotal: number;
  availableWalletBalance: number;
}): { walletAmount: number; gatewayAmount: number; total: number } {
  const { orderTotal, availableWalletBalance } = params;
  const walletAmount = Math.min(orderTotal, Math.max(0, availableWalletBalance));
  const gatewayAmount = orderTotal - walletAmount;

  return {
    walletAmount,
    gatewayAmount,
    total: walletAmount + gatewayAmount,
  };
}

test('Wallet Ledger — Credit transaction updates balance correctly', () => {
  const result = applyWalletTransaction({
    currentBalance: 5000,
    entrySide: WalletEntrySide.CREDIT,
    amount: 2500,
    type: WalletTransactionType.CREDIT_PRICE_ADJUSTMENT,
  });

  assert.equal(result.isValid, true);
  assert.equal(result.newBalance, 7500);
});

test('Wallet Ledger — Debit transaction prevents negative balance', () => {
  const result = applyWalletTransaction({
    currentBalance: 3000,
    entrySide: WalletEntrySide.DEBIT,
    amount: 5000, // Exceeds balance
    type: WalletTransactionType.DEBIT_PURCHASE,
  });

  assert.equal(result.isValid, false);
  assert.match(result.error ?? '', /Insufficient balance/i);
});

test('Wallet Ledger — Checkout Split applies available wallet first, remainder to gateway (§23)', () => {
  // Case 1: Partial wallet + gateway
  const split1 = calculateCheckoutSplit({
    orderTotal: 100000,
    availableWalletBalance: 35000,
  });
  assert.equal(split1.walletAmount, 35000);
  assert.equal(split1.gatewayAmount, 65000);
  assert.equal(split1.total, 100000);

  // Case 2: Wallet exceeds total order
  const split2 = calculateCheckoutSplit({
    orderTotal: 45000,
    availableWalletBalance: 50000,
  });
  assert.equal(split2.walletAmount, 45000);
  assert.equal(split2.gatewayAmount, 0);
  assert.equal(split2.total, 45000);

  // Case 3: Zero wallet balance
  const split3 = calculateCheckoutSplit({
    orderTotal: 85000,
    availableWalletBalance: 0,
  });
  assert.equal(split3.walletAmount, 0);
  assert.equal(split3.gatewayAmount, 85000);
  assert.equal(split3.total, 85000);
});
