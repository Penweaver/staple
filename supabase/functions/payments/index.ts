/**
 * STAPLE LIMITED — Payments & Paystack Webhook Edge Function (Phase 4)
 * Routes: POST /initialize, POST /webhook
 *
 * Supabase Edge Function entry point (Deno runtime).
 * Handles Paystack payment gateway initialization, HMAC signature verification,
 * anti-gaming fingerprint capture (Addendum A4), and order completion.
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
import { executeWalletDebit } from '../_shared/split-payment.ts';
import { atomicReserveUnits } from '../_shared/target.ts';
import { transitionGroupBuy } from '../_shared/state-machine.ts';
import {
  extractPaystackFingerprint,
  checkFingerprintCollisions,
  auditFingerprintCollision,
} from '../_shared/fingerprint.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return corsHeaders();
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const action = pathSegments[pathSegments.length - 1];

    if (action === 'initialize') {
      return await handleInitialize(req);
    }

    if (action === 'webhook') {
      return await handleWebhook(req);
    }

    throw new HttpError(404, `Unknown payments route: ${action}`);
  } catch (error) {
    return errorResponse(error);
  }
});

/**
 * POST /payments/initialize
 * Initialize Paystack transaction for an order's gateway portion
 */
async function handleInitialize(req: Request): Promise<Response> {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');

  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const body = await req.json();
  const { order_id, callback_url } = body;

  if (!order_id) throw new HttpError(400, 'order_id is required');

  const serviceClient = createServiceClient();

  // 1. Fetch order
  const { data: order } = await serviceClient
    .from('orders')
    .select('*, profile:profiles!orders_user_id_fkey(email, first_name, last_name)')
    .eq('id', order_id)
    .eq('user_id', userId)
    .single();

  if (!order) throw new HttpError(404, 'Order not found');
  if (order.status !== 'pending') {
    throw new HttpError(400, `Cannot initiate payment for order in ${order.status} status`);
  }

  const gatewayAmount = Number(order.gateway_amount);
  if (gatewayAmount <= 0) {
    throw new HttpError(400, 'Order is fully covered by wallet balance. No gateway payment needed.');
  }

  // 2. Convert to kobo (amount * 100) at gateway boundary
  const amountInKobo = Math.round(gatewayAmount * 100);
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randSuffix = Math.floor(100000 + Math.random() * 900000);
  const paymentReference = `STP-PAY-${dateStr}-${randSuffix}`;

  const userEmail = order.profile?.email || 'customer@staple.ng';
  const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');

  let authorizationUrl = `https://checkout.paystack.com/${paymentReference}`;
  let accessCode = `acc_${randSuffix}`;

  // If Paystack key is set, call live Paystack API
  if (paystackSecret) {
    try {
      const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          amount: amountInKobo,
          reference: paymentReference,
          currency: 'NGN',
          callback_url: callback_url || 'https://staple.ng/orders/callback',
          metadata: {
            order_id: order.id,
            group_buy_id: order.group_buy_id,
            user_id: userId,
          },
        }),
      });

      const data = await paystackRes.json();
      if (data.status && data.data) {
        authorizationUrl = data.data.authorization_url;
        accessCode = data.data.access_code;
      }
    } catch (err) {
      console.warn('Paystack API call fallback to sandbox reference:', err);
    }
  }

  // 3. Record initiated transaction in payment_transactions table
  await serviceClient.from('payment_transactions').insert({
    reference: paymentReference,
    order_id: order.id,
    user_id: userId,
    amount: Number(order.total_amount),
    wallet_amount: Number(order.wallet_amount),
    gateway_amount: gatewayAmount,
    currency_code: 'NGN',
    status: 'initiated',
    method: 'card',
    gateway_provider: 'paystack',
    gateway_reference: paymentReference,
    idempotency_key: `pay-${order.id}-${Date.now()}`,
  });

  return jsonResponse({
    authorization_url: authorizationUrl,
    access_code: accessCode,
    reference: paymentReference,
    amount_kobo: amountInKobo,
    amount_naira: gatewayAmount,
  });
}

/**
 * POST /payments/webhook
 * Paystack Webhook Handler with signature check and anti-gaming fingerprinting (Addendum A4)
 */
async function handleWebhook(req: Request): Promise<Response> {
  const serviceClient = createServiceClient();
  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature');

  // Verify HMAC signature if secret key is present
  const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (paystackSecret && signature) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(paystackSecret),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign'],
    );
    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const computedSignature = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (computedSignature !== signature) {
      console.error('Invalid Paystack webhook signature');
      throw new HttpError(401, 'Invalid webhook signature');
    }
  }

  const event = JSON.parse(rawBody);

  // Store raw webhook payload for audit
  await serviceClient.from('payment_webhooks').insert({
    provider: 'paystack',
    event_type: event.event || 'unknown',
    reference: event.data?.reference || null,
    payload: event,
    status: 'received',
  });

  if (event.event !== 'charge.success') {
    return jsonResponse({ received: true });
  }

  const paymentReference = event.data?.reference;
  if (!paymentReference) {
    return jsonResponse({ received: true });
  }

  // 1. Check if transaction was already processed (Idempotent webhook delivery)
  const { data: existingTx } = await serviceClient
    .from('payment_transactions')
    .select('*, order:orders(*)')
    .eq('reference', paymentReference)
    .single();

  if (!existingTx) {
    console.warn(`Payment reference not found: ${paymentReference}`);
    return jsonResponse({ received: true });
  }

  if (existingTx.status === 'successful') {
    // Already processed
    return jsonResponse({ already_processed: true });
  }

  const order = existingTx.order;
  if (!order) {
    throw new HttpError(404, 'Associated order not found');
  }

  const now = new Date().toISOString();

  // 2. Extract Anti-Gaming Fingerprint (Addendum A4)
  const paymentFingerprint = extractPaystackFingerprint(event);

  if (paymentFingerprint) {
    const collision = await checkFingerprintCollisions(
      serviceClient,
      paymentFingerprint,
      order.user_id,
    );

    if (collision.hasCollision) {
      console.warn(
        `🚨 Anti-Gaming Alert: Fingerprint collision detected for user ${order.user_id} with users [${collision.conflictingUserIds.join(', ')}]`,
      );
      await auditFingerprintCollision(serviceClient, {
        fingerprint: paymentFingerprint,
        currentUserId: order.user_id,
        conflictingUserIds: collision.conflictingUserIds,
        orderId: order.id,
      });
    }
  }

  // 3. If order had a wallet split portion, execute double-entry wallet debit now
  if (order.wallet_amount > 0) {
    await executeWalletDebit(serviceClient, {
      userId: order.user_id,
      orderId: order.id,
      groupBuyId: order.group_buy_id,
      amount: Number(order.wallet_amount),
      description: `Wallet split contribution for order ${order.order_number}`,
      idempotencyKey: `webhook-wallet-split-${order.id}`,
    });
  }

  // 4. Update transaction record
  await serviceClient
    .from('payment_transactions')
    .update({
      status: 'successful',
      payment_fingerprint: paymentFingerprint,
      verified_at: now,
      verified_by: 'paystack_webhook',
      gateway_response: event.data,
      updated_at: now,
    })
    .eq('id', existingTx.id);

  // 5. Update Order status to 'paid'
  await serviceClient
    .from('orders')
    .update({
      status: 'paid',
      updated_at: now,
    })
    .eq('id', order.id);

  // 6. Atomically reserve units on Group Buy
  if (order.group_buy_id) {
    const { targetReached } = await atomicReserveUnits(
      serviceClient,
      order.group_buy_id,
      order.quantity,
    );

    // Fetch Group Buy for status transition
    const { data: gb } = await serviceClient
      .from('group_buys')
      .select('status, is_champion_activation')
      .eq('id', order.group_buy_id)
      .single();

    // If this was Champion activation order, activate GB from PENDING_ACTIVATION -> LIVE
    if (order.is_champion_activation && gb?.status === 'pending_activation') {
      await transitionGroupBuy(
        { supabase: serviceClient, groupBuyId: order.group_buy_id, triggeredBy: order.user_id },
        'live',
      );
    } else if (targetReached && gb?.status === 'live') {
      // Reached 100% target!
      await transitionGroupBuy(
        { supabase: serviceClient, groupBuyId: order.group_buy_id },
        'target_reached',
      );
    }
  }

  return jsonResponse({ processed: true, order_id: order.id });
}
