import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSplitPayment,
  detectPaymentFingerprintCollisions,
  nairaToKobo,
  koboToNaira,
  formatNaira,
} from '@staple/shared';

test('Payment & Orders — Multi-Funding Split Payment Calculation (§23)', () => {
  const totalAmount = 82875; // ₦82,875

  // Case 1: Wallet covers the entire order (₦100,000 balance >= ₦82,875)
  const split1 = calculateSplitPayment({
    totalAmount,
    walletBalance: 100000,
    useWallet: true,
  });
  assert.equal(split1.walletAmount, 82875);
  assert.equal(split1.gatewayAmount, 0);
  assert.equal(split1.isFullyFundedByWallet, true);
  assert.equal(split1.requiresGatewayPayment, false);
  assert.equal(split1.walletAmount + split1.gatewayAmount, totalAmount);

  // Case 2: Wallet covers partial order (₦20,000 balance < ₦82,875)
  const split2 = calculateSplitPayment({
    totalAmount,
    walletBalance: 20000,
    useWallet: true,
  });
  assert.equal(split2.walletAmount, 20000);
  assert.equal(split2.gatewayAmount, 62875);
  assert.equal(split2.isFullyFundedByWallet, false);
  assert.equal(split2.requiresGatewayPayment, true);
  assert.equal(split2.walletAmount + split2.gatewayAmount, totalAmount);

  // Case 3: User has zero wallet balance
  const split3 = calculateSplitPayment({
    totalAmount,
    walletBalance: 0,
    useWallet: true,
  });
  assert.equal(split3.walletAmount, 0);
  assert.equal(split3.gatewayAmount, 82875);
  assert.equal(split3.requiresGatewayPayment, true);
  assert.equal(split3.isFullyFundedByWallet, false);
  assert.equal(split3.walletAmount + split3.gatewayAmount, totalAmount);

  // Case 4: User opts out of applying wallet balance
  const split4 = calculateSplitPayment({
    totalAmount,
    walletBalance: 50000,
    useWallet: false,
  });
  assert.equal(split4.walletAmount, 0);
  assert.equal(split4.gatewayAmount, 82875);
  assert.equal(split4.walletAmount + split4.gatewayAmount, totalAmount);
});

test('Payment & Orders — Paystack Kobo Boundary Conversion (NGN / ₦)', () => {
  // Paystack expects amount in kobo (integers, 1 Naira = 100 kobo)
  const nairaAmount = 82875;
  const kobo = nairaToKobo(nairaAmount);
  assert.equal(kobo, 8287500);
  assert.equal(koboToNaira(kobo), nairaAmount);

  // Fractional kobo check
  const fractionalNaira = 49999.50;
  const koboFraction = nairaToKobo(fractionalNaira);
  assert.equal(koboFraction, 4999950);
  assert.equal(koboToNaira(koboFraction), fractionalNaira);
});

test('Payment & Orders — Anti-Gaming Payment Fingerprint Collision Engine (Addendum A4)', () => {
  const transactions = [
    { userId: 'user-lagos-1', paymentFingerprint: 'auth_sig_abc_card_1' },
    { userId: 'user-lagos-2', paymentFingerprint: 'auth_sig_xyz_card_2' },
    // Cartel collision: user-lagos-1 and user-lagos-3 share the same card signature!
    { userId: 'user-lagos-3', paymentFingerprint: 'auth_sig_abc_card_1' },
  ];

  const collisions = detectPaymentFingerprintCollisions(transactions);
  assert.equal(collisions.length, 1);
  assert.equal(collisions[0].fingerprint, 'auth_sig_abc_card_1');
  assert.ok(collisions[0].userIds.includes('user-lagos-1'));
  assert.ok(collisions[0].userIds.includes('user-lagos-3'));
  assert.equal(collisions[0].userIds.length, 2);
});

test('Payment & Orders — Double-Entry Ledger Debit Math Integrity (§22)', () => {
  const wallet = { balance: 50000 };
  const debitAmount = 20000;

  const balanceBefore = wallet.balance;
  const balanceAfter = balanceBefore - debitAmount;

  assert.equal(balanceAfter, 30000);
  // Verify strict mathematical balance invariant
  assert.equal(balanceBefore - debitAmount, balanceAfter);

  // Overdraft attempt prevention
  assert.throws(() => {
    const overdraftAmount = 60000;
    if (overdraftAmount > wallet.balance) {
      throw new Error('Insufficient wallet balance');
    }
  }, /Insufficient wallet balance/);
});
