/**
 * STAPLE LIMITED — Orders API Edge Function (Phase 4)
 * Routes: POST /, GET /, GET /:id, POST /:id/cancel
 *
 * Supabase Edge Function entry point (Deno runtime).
 * Handles order creation with split wallet payment, idempotency,
 * order history, and policy-compliant cancellation refunds (§4.1).
 */

import {
  createUserClient,
  createServiceClient,
  getAuthenticatedUserId,
  HttpError,
  jsonResponse,
  errorResponse,
  corsHeaders,
} from '../_shared/supabase.ts';
import { withIdempotency } from '../_shared/idempotency.ts';
import { calculateSplitPayment, executeWalletDebit } from '../_shared/split-payment.ts';
import { validateUserUnitLimit, atomicReserveUnits } from '../_shared/target.ts';
import { resolveActiveTier } from '../_shared/pricing.ts';
import { transitionGroupBuy } from '../_shared/state-machine.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return corsHeaders();
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    // Patterns:
    // /orders
    // /orders/:id
    // /orders/:id/cancel
    const lastSegment = pathSegments[pathSegments.length - 1];
    const secondLastSegment = pathSegments.length > 1 ? pathSegments[pathSegments.length - 2] : null;

    if (secondLastSegment && lastSegment === 'cancel') {
      return await handleCancelOrder(req, secondLastSegment);
    }

    if (lastSegment && lastSegment !== 'orders') {
      return await handleOrderDetail(req, lastSegment);
    }

    if (req.method === 'POST') {
      return await handleCreateOrder(req);
    }

    return await handleListOrders(req);
  } catch (error) {
    return errorResponse(error);
  }
});

/**
 * POST /orders
 * Creates an order with split payment allocation and idempotency
 */
async function handleCreateOrder(req: Request): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const idempotencyKey = req.headers.get('Idempotency-Key') || `ord-${Date.now()}-${userId}`;

  return await withIdempotency(supabase, idempotencyKey, async () => {
    const body = await req.json();
    const { group_buy_id, quantity, use_wallet = true } = body;

    if (!group_buy_id || !quantity) {
      throw new HttpError(400, 'group_buy_id and quantity are required');
    }

    // 1. Enforce 10-unit cumulative user ceiling per Group Buy (Spec §74)
    await validateUserUnitLimit(supabase, userId, group_buy_id, quantity, 10);

    const serviceClient = createServiceClient();

    // 2. Fetch Group Buy details
    const { data: gb } = await serviceClient
      .from('group_buys')
      .select('*, pricing_tiers:group_buy_pricing_tiers(*)')
      .eq('id', group_buy_id)
      .single();

    if (!gb) throw new HttpError(404, 'Group Buy not found');
    if (gb.status !== 'live' && gb.status !== 'pending_activation') {
      throw new HttpError(400, `Cannot place order on Group Buy in ${gb.status} status`);
    }

    // 3. Resolve unit price
    const tiers = (gb.pricing_tiers || []).map((t: any) => ({
      minPercentage: Number(t.min_percentage),
      maxPercentage: t.max_percentage !== null ? Number(t.max_percentage) : null,
      discountPercentage: Number(t.discount_percentage),
      discountedPrice: Number(t.discounted_price),
    }));

    const { currentPrice } = resolveActiveTier(
      Number(gb.original_unit_price),
      gb.paid_quantity,
      gb.target_quantity,
      tiers,
    );

    const totalAmount = currentPrice * quantity;

    // 4. Fetch user wallet balance
    const { data: wallet } = await serviceClient
      .from('wallets')
      .select('id, balance')
      .eq('user_id', userId)
      .single();

    const walletBalance = Number(wallet?.balance ?? 0);
    const split = calculateSplitPayment({ totalAmount, walletBalance, useWallet });

    // 5. Generate unique order number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `STP-ORD-${dateStr}-${randSuffix}`;

    // 6. Create Order record
    const { data: order, error: orderErr } = await serviceClient
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: userId,
        group_buy_id,
        product_id: gb.product_id,
        basket_id: gb.basket_id,
        quantity,
        unit_price_at_purchase: currentPrice,
        total_amount: totalAmount,
        wallet_amount: split.walletAmount,
        gateway_amount: split.gatewayAmount,
        currency_code: 'NGN',
        status: split.isFullyFundedByWallet ? 'paid' : 'pending',
        idempotency_key: idempotencyKey,
      })
      .select()
      .single();

    if (orderErr || !order) {
      console.error('Create order error:', orderErr);
      throw new HttpError(500, 'Failed to create order');
    }

    // 7. If 100% wallet funded: execute debit immediately and reserve units!
    if (split.isFullyFundedByWallet && split.walletAmount > 0) {
      await executeWalletDebit(serviceClient, {
        userId,
        orderId: order.id,
        groupBuyId: gb.id,
        amount: split.walletAmount,
        description: `Full wallet payment for ${quantity} unit(s) on ${orderNumber}`,
        idempotencyKey: `debit-${order.id}`,
      });

      // Atomic unit reservation
      const { targetReached } = await atomicReserveUnits(serviceClient, gb.id, quantity);
      if (targetReached && gb.status === 'live') {
        await transitionGroupBuy({ supabase: serviceClient, groupBuyId: gb.id }, 'target_reached');
      }
    }

    return jsonResponse({
      order,
      split,
      requires_gateway_payment: split.requiresGatewayPayment,
    }, 201);
  });
}

/**
 * GET /orders
 * List orders for the authenticated user
 */
async function handleListOrders(req: Request): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      group_buy:group_buys(id, slug, status, target_quantity, paid_quantity),
      product:products(name, unit, images:product_images(image_url)),
      basket:baskets(name, image_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new HttpError(500, 'Failed to fetch user orders');

  return jsonResponse({ orders: orders || [] });
}

/**
 * GET /orders/:id
 * Get single order detail
 */
async function handleOrderDetail(req: Request, orderId: string): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      group_buy:group_buys(
        id, slug, status, target_quantity, paid_quantity,
        service_area:service_areas(name),
        collection_point:collection_points(name, address, operating_hours)
      ),
      product:products(name, unit, description, images:product_images(*)),
      basket:baskets(name, description, items:basket_items(*, product:products(*)))
    `)
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (error || !order) throw new HttpError(404, 'Order not found');

  return jsonResponse({ order });
}

/**
 * POST /orders/:id/cancel
 * Cancel order according to Refund Policy Matrix (§4.1):
 * - Allowed with 100% full refund if Group Buy is LIVE
 * - REJECTED if Group Buy is TARGET_REACHED or later (supplier order locked)
 */
async function handleCancelOrder(req: Request, orderId: string): Promise<Response> {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');

  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);

  const serviceClient = createServiceClient();

  const { data: order } = await serviceClient
    .from('orders')
    .select('*, group_buy:group_buys(id, status, paid_quantity)')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (!order) throw new HttpError(404, 'Order not found');
  if (order.status !== 'paid') {
    throw new HttpError(400, `Cannot cancel order in ${order.status} status`);
  }

  // Check Group Buy status against Refund Policy Matrix (§4.1)
  const gbStatus = order.group_buy?.status;
  if (gbStatus !== 'live') {
    throw new HttpError(
      400,
      `Cancellation rejected: Orders cannot be cancelled once the Group Buy reaches TARGET_REACHED or enters FULFILMENT. (Current status: ${gbStatus})`,
    );
  }

  const now = new Date().toISOString();

  // 1. Mark order as refunded with reason 'user_cancelled' (Addendum A2)
  await serviceClient
    .from('orders')
    .update({
      status: 'refunded',
      refund_reason: 'user_cancelled',
      refunded_at: now,
      refunded_by: userId,
    })
    .eq('id', order.id);

  // 2. Decrement paid_quantity on Group Buy
  const newPaidQty = Math.max(0, order.group_buy.paid_quantity - order.quantity);
  await serviceClient
    .from('group_buys')
    .update({ paid_quantity: newPaidQty, updated_at: now })
    .eq('id', order.group_buy_id);

  // 3. Credit refund amount back to user's wallet
  const { data: wallet } = await serviceClient
    .from('wallets')
    .select('id, balance')
    .eq('user_id', userId)
    .single();

  if (wallet) {
    const refundAmount = Number(order.total_amount);
    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore + refundAmount;

    await serviceClient.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      user_id: userId,
      transaction_type: 'credit_refund',
      entry_side: 'credit',
      amount: refundAmount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      currency_code: 'NGN',
      order_id: order.id,
      group_buy_id: order.group_buy_id,
      description: `Full refund for cancellation of order ${order.order_number} while Group Buy was LIVE`,
      idempotency_key: `refund-user-${order.id}`,
    });

    await serviceClient
      .from('wallets')
      .update({ balance: balanceAfter, updated_at: now })
      .eq('id', wallet.id);
  }

  return jsonResponse({
    success: true,
    message: 'Order cancelled successfully. 100% of funds credited back to your STAPLE Wallet.',
  });
}
