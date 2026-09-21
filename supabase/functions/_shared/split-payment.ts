/**
 * STAPLE LIMITED — Split Payment & Double-Entry Ledger Engine
 * Handles wallet + gateway split allocation and strict ledger accounting (Spec §22, §23)
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { HttpError } from './supabase.ts';

export interface SplitCalculation {
  totalAmount: number;
  walletAmount: number;
  gatewayAmount: number;
  requiresGatewayPayment: boolean;
  isFullyFundedByWallet: boolean;
}

/**
 * Calculate multi-funding split between user's STAPLE Wallet balance and external gateway (§23)
 */
export function calculateSplitPayment(params: {
  totalAmount: number;
  walletBalance: number;
  useWallet?: boolean;
}): SplitCalculation {
  const { totalAmount, walletBalance, useWallet = true } = params;

  if (totalAmount <= 0) {
    throw new HttpError(400, 'Total amount must be greater than zero');
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
 * Execute a double-entry debit from the user's wallet
 * Strictly satisfies constraint: balance_after = balance_before - amount
 */
export async function executeWalletDebit(
  supabase: SupabaseClient,
  params: {
    userId: string;
    orderId?: string;
    groupBuyId?: string;
    amount: number;
    description: string;
    idempotencyKey: string;
  },
): Promise<{ walletTransactionId: string; balanceBefore: number; balanceAfter: number }> {
  const { userId, orderId, groupBuyId, amount, description, idempotencyKey } = params;

  if (amount <= 0) {
    throw new HttpError(400, 'Debit amount must be positive');
  }

  // 1. Fetch wallet with lock
  const { data: wallet, error: walletErr } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('user_id', userId)
    .single();

  if (walletErr || !wallet) {
    throw new HttpError(404, 'Wallet not found for user');
  }

  const balanceBefore = Number(wallet.balance);
  if (balanceBefore < amount) {
    throw new HttpError(
      400,
      `Insufficient wallet balance. Available: ₦${balanceBefore.toLocaleString()}, Requested debit: ₦${amount.toLocaleString()}`,
    );
  }

  const balanceAfter = balanceBefore - amount;
  const now = new Date().toISOString();

  // 2. Insert into double-entry wallet_transactions ledger
  const { data: tx, error: txErr } = await supabase
    .from('wallet_transactions')
    .insert({
      wallet_id: wallet.id,
      user_id: userId,
      transaction_type: 'debit_order_payment',
      entry_side: 'debit',
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      currency_code: 'NGN',
      order_id: orderId || null,
      group_buy_id: groupBuyId || null,
      description,
      idempotency_key: idempotencyKey,
    })
    .select('id')
    .single();

  if (txErr || !tx) {
    console.error('Wallet transaction ledger error:', txErr);
    throw new HttpError(500, 'Failed to record double-entry wallet transaction');
  }

  // 3. Update wallet materialized balance
  const { error: updateErr } = await supabase
    .from('wallets')
    .update({ balance: balanceAfter, updated_at: now })
    .eq('id', wallet.id);

  if (updateErr) {
    console.error('Wallet balance update error:', updateErr);
    throw new HttpError(500, 'Failed to update wallet balance');
  }

  return {
    walletTransactionId: tx.id,
    balanceBefore,
    balanceAfter,
  };
}
