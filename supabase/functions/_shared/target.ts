/**
 * STAPLE LIMITED — Target Tracking & Concurrency Engine
 * Guards cumulative unit caps, Champion capacity limits, and atomic target reservations (Spec §8, §74)
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { HttpError } from './supabase.ts';

export const MAX_UNITS_PER_USER_DEFAULT = 10;
export const MAX_CHAMPION_ACTIVE_BUYS_DEFAULT = 2;

/**
 * Validate that a user has not exceeded the 10-unit cumulative ceiling for a Group Buy
 */
export async function validateUserUnitLimit(
  supabase: SupabaseClient,
  userId: string,
  groupBuyId: string,
  requestedQuantity: number,
  maxAllowed = MAX_UNITS_PER_USER_DEFAULT,
): Promise<{ currentTotal: number; remainingAllowed: number }> {
  if (requestedQuantity <= 0) {
    throw new HttpError(400, 'Quantity must be at least 1 unit');
  }

  // Calculate current paid or in-flight quantity for this user in this group buy
  const { data: existingOrders, error } = await supabase
    .from('orders')
    .select('quantity')
    .eq('user_id', userId)
    .eq('group_buy_id', groupBuyId)
    .in('status', ['pending', 'payment_processing', 'paid', 'fulfilment_ready', 'in_fulfilment', 'fulfilled', 'collected']);

  if (error) {
    console.error('Error fetching user existing orders:', error);
    throw new HttpError(500, 'Failed to verify user purchase quota');
  }

  const currentTotal = (existingOrders || []).reduce(
    (acc: number, order: { quantity: number }) => acc + order.quantity,
    0,
  );

  const remainingAllowed = maxAllowed - currentTotal;

  if (requestedQuantity > remainingAllowed) {
    throw new HttpError(
      400,
      `Cannot purchase ${requestedQuantity} unit(s). You have already ordered ${currentTotal} unit(s). Maximum limit is ${maxAllowed} units per household.`,
    );
  }

  return { currentTotal, remainingAllowed };
}

/**
 * Validate Champion active Group Buy concurrency limit (Max 2 active concurrent buys per Spec §8)
 */
export async function validateChampionActiveCapacity(
  supabase: SupabaseClient,
  championId: string,
  maxActive = MAX_CHAMPION_ACTIVE_BUYS_DEFAULT,
): Promise<number> {
  const { count, error } = await supabase
    .from('group_buys')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', championId)
    .in('status', ['pending_activation', 'live', 'target_reached']);

  if (error) {
    console.error('Error checking champion active count:', error);
    throw new HttpError(500, 'Failed to verify Champion capacity');
  }

  const activeCount = count || 0;
  if (activeCount >= maxActive) {
    throw new HttpError(
      400,
      `Champion limit reached: You currently have ${activeCount} active Group Buy(s). Champions may organize a maximum of ${maxActive} active Group Buys concurrently.`,
    );
  }

  return activeCount;
}

/**
 * Reserve units atomically against Group Buy target
 * Prevents oversubscription when allow_oversubscription is FALSE
 */
export async function atomicReserveUnits(
  supabase: SupabaseClient,
  groupBuyId: string,
  quantity: number,
): Promise<{ newPaidQuantity: number; targetReached: boolean }> {
  // Use RPC or atomic UPDATE query
  const { data: gb, error: fetchErr } = await supabase
    .from('group_buys')
    .select('id, target_quantity, paid_quantity, allow_oversubscription, status')
    .eq('id', groupBuyId)
    .single();

  if (fetchErr || !gb) {
    throw new HttpError(404, 'Group Buy not found');
  }

  if (gb.status !== 'live' && gb.status !== 'pending_activation') {
    throw new HttpError(400, `Cannot join Group Buy in ${gb.status} status`);
  }

  const potentialQuantity = gb.paid_quantity + quantity;

  if (!gb.allow_oversubscription && potentialQuantity > gb.target_quantity) {
    const spaceLeft = Math.max(0, gb.target_quantity - gb.paid_quantity);
    throw new HttpError(
      400,
      `Cannot join: Only ${spaceLeft} unit(s) remaining before target is reached.`,
    );
  }

  const { data: updated, error: updateErr } = await supabase
    .from('group_buys')
    .update({
      paid_quantity: potentialQuantity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', groupBuyId)
    .select('paid_quantity, target_quantity')
    .single();

  if (updateErr || !updated) {
    throw new HttpError(500, 'Failed to reserve units on Group Buy');
  }

  const targetReached = updated.paid_quantity >= updated.target_quantity;
  return {
    newPaidQuantity: updated.paid_quantity,
    targetReached,
  };
}
