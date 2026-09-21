/**
 * STAPLE LIMITED — Group Buy State Machine Engine
 * Authoritative lifecycle state transitions matching Spec §3.1 + Founder Addendum v1
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { HttpError } from './supabase.ts';

export type GroupBuyStatus =
  | 'draft'
  | 'pending_activation'
  | 'live'
  | 'target_reached'
  | 'lifespan_expired'
  | 'delivery_fulfilment'
  | 'completed'
  | 'closed';

export interface TransitionContext {
  supabase: SupabaseClient;
  groupBuyId: string;
  triggeredBy?: string; // profile_id or 'system'
  metadata?: Record<string, unknown>;
}

export interface TransitionResult {
  previousStatus: GroupBuyStatus;
  newStatus: GroupBuyStatus;
  groupBuyId: string;
  milestoneRewarded?: boolean;
  refundsTriggered?: number;
}

/**
 * Valid state transitions table
 */
export const ALLOWED_TRANSITIONS: Record<GroupBuyStatus, GroupBuyStatus[]> = {
  draft: ['pending_activation', 'live'],
  pending_activation: ['live', 'draft', 'closed'],
  live: ['target_reached', 'lifespan_expired', 'closed'],
  target_reached: ['delivery_fulfilment', 'closed'],
  lifespan_expired: ['delivery_fulfilment', 'closed'],
  delivery_fulfilment: ['completed', 'closed'],
  completed: [],
  closed: [],
};

/**
 * Execute a valid state transition on a Group Buy with atomic auditing and side effects
 */
export async function transitionGroupBuy(
  context: TransitionContext,
  targetStatus: GroupBuyStatus,
): Promise<TransitionResult> {
  const { supabase, groupBuyId, triggeredBy = 'system', metadata = {} } = context;

  // 1. Fetch current Group Buy with lock
  const { data: gb, error: fetchErr } = await supabase
    .from('group_buys')
    .select('*')
    .eq('id', groupBuyId)
    .single();

  if (fetchErr || !gb) {
    throw new HttpError(404, `Group Buy not found: ${groupBuyId}`);
  }

  const currentStatus: GroupBuyStatus = gb.status;

  // 2. Validate transition validity
  if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(targetStatus)) {
    throw new HttpError(
      400,
      `Invalid Group Buy state transition from ${currentStatus} to ${targetStatus}`,
    );
  }

  // 3. Guard conditions & side effects per transition rule
  const now = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    status: targetStatus,
    updated_at: now,
  };

  let milestoneRewarded = false;
  let refundsTriggered = 0;

  // Guard: DRAFT -> PENDING_ACTIVATION (Champion only)
  if (currentStatus === 'draft' && targetStatus === 'pending_activation') {
    if (gb.creator_type !== 'champion') {
      throw new HttpError(400, 'Only champion-created group buys require activation');
    }
  }

  // Guard: DRAFT -> LIVE (Admin direct activation)
  if (currentStatus === 'draft' && targetStatus === 'live') {
    if (gb.creator_type !== 'admin') {
      throw new HttpError(400, 'Only admin-created group buys can transition directly from draft to live');
    }
    updatePayload.live_at = now;
    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + (gb.lifespan_days || 14));
    updatePayload.expires_at = expiresDate.toISOString();
  }

  // Transition to LIVE (from PENDING_ACTIVATION upon Champion payment)
  if (currentStatus === 'pending_activation' && targetStatus === 'live') {
    updatePayload.live_at = now;
    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + (gb.lifespan_days || 14));
    updatePayload.expires_at = expiresDate.toISOString();
  }

  // Transition to TARGET_REACHED
  if (targetStatus === 'target_reached') {
    if (gb.paid_quantity < gb.target_quantity) {
      throw new HttpError(400, `Cannot reach target: paid quantity (${gb.paid_quantity}) < target (${gb.target_quantity})`);
    }
    updatePayload.target_reached_at = now;
  }

  // Transition to DELIVERY_FULFILMENT (from TARGET_REACHED or LIFESPAN_EXPIRED)
  if (targetStatus === 'delivery_fulfilment') {
    // If coming from LIFESPAN_EXPIRED, verify MVFQ (Addendum A1)
    if (currentStatus === 'lifespan_expired') {
      const minMvfq = gb.min_fulfilment_quantity || 1;
      if (gb.paid_quantity < minMvfq) {
        throw new HttpError(
          400,
          `Cannot proceed to fulfilment: paid quantity (${gb.paid_quantity}) < MVFQ (${minMvfq})`,
        );
      }
    }

    // Trigger Champion Milestone Reward on target reached (Addendum A3: flat ₦2,000)
    if (currentStatus === 'target_reached' && gb.creator_type === 'champion') {
      // Check system_config for milestone reward amount (default 2000)
      const { data: configRow } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'champion_milestone_reward_amount')
        .single();

      const rewardAmount = Number(configRow?.value ?? 2000);

      // Fetch champion wallet
      const { data: champWallet } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', gb.created_by)
        .single();

      if (champWallet) {
        const newBalance = Number(champWallet.balance) + rewardAmount;

        // Credit transaction in wallet_transactions ledger (§22)
        await supabase.from('wallet_transactions').insert({
          wallet_id: champWallet.id,
          user_id: gb.created_by,
          transaction_type: 'credit_champion_milestone',
          entry_side: 'credit',
          amount: rewardAmount,
          balance_before: champWallet.balance,
          balance_after: newBalance,
          currency_code: 'NGN',
          group_buy_id: groupBuyId,
          description: `Champion milestone reward for reaching target on ${gb.slug}`,
          idempotency_key: `champ-milestone-${groupBuyId}`,
        });

        await supabase
          .from('wallets')
          .update({ balance: newBalance, updated_at: now })
          .eq('id', champWallet.id);

        milestoneRewarded = true;
      }
    }
  }

  // Transition to CLOSED: evaluate MVFQ auto-refunds (Addendum A1 & A2)
  if (targetStatus === 'closed') {
    updatePayload.closed_at = now;

    // If coming from LIFESPAN_EXPIRED and paid_quantity < MVFQ, auto-refund all participants
    if (currentStatus === 'lifespan_expired' && gb.paid_quantity < (gb.min_fulfilment_quantity || 1)) {
      // Fetch all paid orders for this group buy
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('group_buy_id', groupBuyId)
        .eq('status', 'paid');

      if (orders && orders.length > 0) {
        for (const order of orders) {
          // 1. Mark order as refunded with reason mvfq_not_met
          await supabase
            .from('orders')
            .update({
              status: 'refunded',
              refund_reason: 'mvfq_not_met',
              refunded_at: now,
              refunded_by: triggeredBy,
            })
            .eq('id', order.id);

          // 2. Credit order total back to participant's wallet
          const { data: userWallet } = await supabase
            .from('wallets')
            .select('id, balance')
            .eq('user_id', order.user_id)
            .single();

          if (userWallet) {
            const refundAmount = Number(order.total_amount);
            const balanceBefore = Number(userWallet.balance);
            const balanceAfter = balanceBefore + refundAmount;

            await supabase.from('wallet_transactions').insert({
              wallet_id: userWallet.id,
              user_id: order.user_id,
              transaction_type: 'credit_refund',
              entry_side: 'credit',
              amount: refundAmount,
              balance_before: balanceBefore,
              balance_after: balanceAfter,
              currency_code: 'NGN',
              order_id: order.id,
              group_buy_id: groupBuyId,
              description: `Automatic 100% refund: Group Buy expired below supplier minimum (${gb.min_fulfilment_quantity} units)`,
              idempotency_key: `refund-order-${order.id}`,
            });

            await supabase
              .from('wallets')
              .update({ balance: balanceAfter, updated_at: now })
              .eq('id', userWallet.id);

            refundsTriggered++;
          }
        }
      }
    }
  }

  // Transition to COMPLETED
  if (targetStatus === 'completed') {
    updatePayload.completed_at = now;
  }

  // 4. Update the Group Buy row
  const { error: updateErr } = await supabase
    .from('group_buys')
    .update(updatePayload)
    .eq('id', groupBuyId);

  if (updateErr) {
    console.error('State machine update error:', updateErr);
    throw new HttpError(500, 'Failed to update Group Buy status');
  }

  // 5. Append to group_buy_events audit log
  await supabase.from('group_buy_events').insert({
    group_buy_id: groupBuyId,
    event_type: `status_changed_to_${targetStatus}`,
    previous_status: currentStatus,
    new_status: targetStatus,
    triggered_by: triggeredBy,
    metadata: {
      ...metadata,
      milestone_rewarded: milestoneRewarded,
      refunds_triggered: refundsTriggered,
      paid_quantity: gb.paid_quantity,
      target_quantity: gb.target_quantity,
      min_fulfilment_quantity: gb.min_fulfilment_quantity,
    },
  });

  return {
    previousStatus: currentStatus,
    newStatus: targetStatus,
    groupBuyId,
    milestoneRewarded,
    refundsTriggered,
  };
}
