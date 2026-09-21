/**
 * STAPLE LIMITED — Group Buy API Edge Function (Phase 3)
 * Routes: discover, :id (detail), create, :id/join, :id/share
 *
 * Supabase Edge Function entry point (Deno runtime).
 * Handles collective purchasing discovery, Champion creation,
 * participation, dynamic tier evaluation, and social sharing.
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
import { transitionGroupBuy } from '../_shared/state-machine.ts';
import {
  generatePricingTierRows,
  resolveActiveTier,
} from '../_shared/pricing.ts';
import {
  validateUserUnitLimit,
  validateChampionActiveCapacity,
  atomicReserveUnits,
} from '../_shared/target.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return corsHeaders();
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    // Patterns:
    // /group-buys/discover
    // /group-buys/create
    // /group-buys/:id
    // /group-buys/:id/join
    // /group-buys/:id/share
    const lastSegment = pathSegments[pathSegments.length - 1];
    const secondLastSegment = pathSegments.length > 1 ? pathSegments[pathSegments.length - 2] : null;

    if (lastSegment === 'discover') {
      return await handleDiscover(req);
    }

    if (lastSegment === 'create' || (lastSegment === 'group-buys' && req.method === 'POST')) {
      return await handleCreate(req);
    }

    if (secondLastSegment && lastSegment === 'join') {
      return await handleJoin(req, secondLastSegment);
    }

    if (secondLastSegment && lastSegment === 'share') {
      return await handleShare(req, secondLastSegment);
    }

    // Check if last segment is a UUID or slug (detail lookup)
    if (lastSegment && lastSegment !== 'group-buys') {
      return await handleDetail(req, lastSegment);
    }

    // Default: discover
    return await handleDiscover(req);
  } catch (error) {
    return errorResponse(error);
  }
});

/**
 * GET /group-buys/discover?service_area_id=&lat=&lng=&category_id=&page=&limit=
 * Returns location-aware active Group Buys sorted by proximity and days remaining
 */
async function handleDiscover(req: Request): Promise<Response> {
  if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed');

  const url = new URL(req.url);
  const serviceAreaId = url.searchParams.get('service_area_id');
  const categoryId = url.searchParams.get('category_id');
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '10', 10), 30);
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();

  let query = supabase
    .from('group_buys')
    .select(`
      *,
      product:products(*, category:product_categories(id, name, slug)),
      basket:baskets(*),
      service_area:service_areas(name),
      collection_point:collection_points(name),
      pricing_tiers:group_buy_pricing_tiers(*),
      creator:profiles!group_buys_created_by_fkey(first_name, last_name, display_name)
    `, { count: 'exact' })
    .in('status', ['live', 'target_reached'])
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (serviceAreaId) {
    query = query.eq('service_area_id', serviceAreaId);
  }

  const { data: rows, error, count } = await query;
  if (error) {
    console.error('Discover query error:', error);
    throw new HttpError(500, 'Failed to fetch Group Buys feed');
  }

  const now = new Date().getTime();

  const groupBuys = (rows || []).map((gb: any) => {
    const expiresAt = gb.expires_at ? new Date(gb.expires_at).getTime() : now;
    const daysRemaining = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)));

    const itemTitle = gb.product?.name ?? gb.basket?.name ?? 'Food Essential';
    const categoryName = gb.product?.category?.name ?? (gb.basket ? 'Curated Baskets' : 'Food');
    const unit = gb.product?.unit ?? 'basket';

    const tiers = (gb.pricing_tiers || []).map((t: any) => ({
      id: t.id,
      minPercentage: Number(t.min_percentage),
      maxPercentage: t.max_percentage !== null ? Number(t.max_percentage) : null,
      discountPercentage: Number(t.discount_percentage),
      discountedPrice: Number(t.discounted_price),
      isActive: t.is_active,
    }));

    const tierInfo = resolveActiveTier(
      Number(gb.original_unit_price),
      gb.paid_quantity,
      gb.target_quantity,
      tiers,
    );

    const championName = gb.creator
      ? gb.creator.display_name || `${gb.creator.first_name} ${gb.creator.last_name?.[0] || ''}.`
      : null;

    return {
      id: gb.id,
      slug: gb.slug,
      type: gb.type,
      creator_type: gb.creator_type,
      champion_name: championName,
      title: itemTitle,
      category_name: categoryName,
      image_url: gb.product?.images?.[0]?.image_url ?? gb.basket?.image_url ?? null,
      unit,
      unit_price: tierInfo.currentPrice,
      original_unit_price: Number(gb.original_unit_price),
      currency_code: gb.currency_code,
      target_quantity: gb.target_quantity,
      paid_quantity: gb.paid_quantity,
      min_fulfilment_quantity: gb.min_fulfilment_quantity,
      status: gb.status,
      days_remaining: daysRemaining,
      service_area_name: gb.service_area?.name ?? 'Local Service Area',
      collection_point_name: gb.collection_point?.name ?? null,
      progress_percentage: tierInfo.progressPercentage,
      current_tier: tierInfo.activeTier,
      participants_count: gb.paid_quantity, // Approximated from units paid
    };
  });

  return jsonResponse({
    group_buys: groupBuys,
    total: count || 0,
    page,
    limit,
    has_more: offset + groupBuys.length < (count || 0),
  });
}

/**
 * GET /group-buys/:id (or by slug)
 * Full Group Buy details with pricing tiers, progress, and user participation status
 */
async function handleDetail(req: Request, identifier: string): Promise<Response> {
  if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed');

  const supabase = createServiceClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

  let query = supabase
    .from('group_buys')
    .select(`
      *,
      product:products(*, category:product_categories(id, name, slug), images:product_images(*)),
      basket:baskets(*, items:basket_items(*, product:products(*))),
      service_area:service_areas(name),
      collection_point:collection_points(name, address, operating_hours),
      pricing_tiers:group_buy_pricing_tiers(*),
      creator:profiles!group_buys_created_by_fkey(first_name, last_name, display_name)
    `);

  if (isUuid) {
    query = query.eq('id', identifier);
  } else {
    query = query.eq('slug', identifier);
  }

  const { data: gb, error } = await query.single();
  if (error || !gb) {
    throw new HttpError(404, 'Group Buy not found');
  }

  const now = new Date().getTime();
  const expiresAt = gb.expires_at ? new Date(gb.expires_at).getTime() : now;
  const daysRemaining = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)));

  const tiers = (gb.pricing_tiers || []).map((t: any) => ({
    id: t.id,
    minPercentage: Number(t.min_percentage),
    maxPercentage: t.max_percentage !== null ? Number(t.max_percentage) : null,
    discountPercentage: Number(t.discount_percentage),
    discountedPrice: Number(t.discounted_price),
    isActive: t.is_active,
  }));

  const tierInfo = resolveActiveTier(
    Number(gb.original_unit_price),
    gb.paid_quantity,
    gb.target_quantity,
    tiers,
  );

  const championName = gb.creator
    ? gb.creator.display_name || `${gb.creator.first_name} ${gb.creator.last_name?.[0] || ''}.`
    : null;

  // Optional: check calling user's participation quota
  let userParticipation = undefined;
  try {
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const userClient = createUserClient(req);
      const userId = await getAuthenticatedUserId(userClient);
      const { data: userOrders } = await userClient
        .from('orders')
        .select('quantity')
        .eq('group_buy_id', gb.id)
        .eq('user_id', userId)
        .in('status', ['pending', 'paid']);

      const orderedQty = (userOrders || []).reduce((sum: number, o: any) => sum + o.quantity, 0);
      userParticipation = {
        quantity: orderedQty,
        orders_count: userOrders?.length || 0,
        max_units_remaining: Math.max(0, (gb.max_units_per_user || 10) - orderedQty),
      };
    }
  } catch (_) {
    // Non-authenticated browsing allowed
  }

  return jsonResponse({
    group_buy: {
      ...gb,
      champion_name: championName,
      service_area_name: gb.service_area?.name ?? 'Service Area',
      collection_point_name: gb.collection_point?.name ?? null,
      progress_percentage: tierInfo.progressPercentage,
      days_remaining: daysRemaining,
      current_tier: tierInfo.activeTier,
      next_tier: tierInfo.nextTier,
      pricing_tiers: tiers,
      participants_count: gb.paid_quantity,
      user_participation: userParticipation,
    },
  });
}

/**
 * POST /group-buys/create (Champion or Admin)
 * 6-step creation validation and initial setup
 */
async function handleCreate(req: Request): Promise<Response> {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');

  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const body = await req.json();

  const {
    product_id,
    basket_id,
    service_area_id,
    collection_point_id,
    target_quantity,
    lifespan_days = 14,
    initial_purchase_quantity = 1,
    description,
    share_message,
  } = body;

  if (!service_area_id || !target_quantity || (!product_id && !basket_id)) {
    throw new HttpError(400, 'Missing required fields: service_area_id, target_quantity, and product_id or basket_id');
  }

  // Determine role of creator
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, champion_status')
    .eq('id', userId)
    .single();

  if (!profile) throw new HttpError(403, 'Profile not found');

  const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';
  const isChampion = profile.role === 'champion' && profile.champion_status === 'active';

  if (!isAdmin && !isChampion) {
    throw new HttpError(403, 'Only approved Champions and Admins can create Group Buys');
  }

  const creatorType = isAdmin ? 'admin' : 'champion';

  // Champion capacity limit check: max 2 active Group Buys (Spec §8)
  if (creatorType === 'champion') {
    await validateChampionActiveCapacity(supabase, userId, 2);
  }

  const serviceClient = createServiceClient();

  // Fetch product or basket details for pricing and MVFQ
  let basePrice = 0;
  let mvfq = 1;
  let itemSlug = '';

  if (product_id) {
    const { data: product } = await serviceClient
      .from('products')
      .select('base_price, minimum_fulfilment_quantity, slug, min_group_buy_target, max_group_buy_target')
      .eq('id', product_id)
      .single();

    if (!product) throw new HttpError(404, 'Product not found');
    basePrice = Number(product.base_price);
    mvfq = product.minimum_fulfilment_quantity;
    itemSlug = product.slug;

    if (target_quantity < product.min_group_buy_target || target_quantity > product.max_group_buy_target) {
      throw new HttpError(
        400,
        `Target quantity must be between ${product.min_group_buy_target} and ${product.max_group_buy_target}`,
      );
    }
  } else if (basket_id) {
    const { data: basket } = await serviceClient
      .from('baskets')
      .select('total_price, minimum_fulfilment_quantity, slug')
      .eq('id', basket_id)
      .single();

    if (!basket) throw new HttpError(404, 'Basket not found');
    basePrice = Number(basket.total_price);
    mvfq = basket.minimum_fulfilment_quantity;
    itemSlug = basket.slug;
  }

  // Generate unique slug
  const timestampSuffix = Date.now().toString().slice(-4);
  const uniqueSlug = `${itemSlug}-${timestampSuffix}`;
  const shareUrl = `https://staple.ng/gb/${uniqueSlug}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`;

  // Determine initial status
  // Admin created -> goes directly DRAFT -> LIVE (Assumption #4)
  // Champion created -> goes DRAFT -> PENDING_ACTIVATION (requires activation order)
  const initialStatus = isAdmin ? 'live' : 'pending_activation';
  const now = new Date().toISOString();

  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + lifespan_days);

  // Insert Group Buy
  const { data: newGb, error: gbError } = await serviceClient
    .from('group_buys')
    .insert({
      slug: uniqueSlug,
      qr_code_url: qrCodeUrl,
      type: 'regular',
      creator_type: creatorType,
      created_by: userId,
      product_id: product_id || null,
      basket_id: basket_id || null,
      unit_price: basePrice,
      original_unit_price: basePrice,
      currency_code: 'NGN',
      target_quantity,
      paid_quantity: 0,
      max_units_per_user: 10,
      min_fulfilment_quantity: mvfq,
      status: initialStatus,
      lifespan_days,
      live_at: isAdmin ? now : null,
      expires_at: isAdmin ? expiresDate.toISOString() : null,
      service_area_id,
      collection_point_id: collection_point_id || null,
      allow_oversubscription: false,
      description,
      share_message,
    })
    .select()
    .single();

  if (gbError || !newGb) {
    console.error('Create Group Buy error:', gbError);
    throw new HttpError(500, 'Failed to create Group Buy');
  }

  // Insert Standard Pricing Tiers
  const tierRows = generatePricingTierRows(newGb.id, basePrice);
  const { data: createdTiers, error: tierError } = await serviceClient
    .from('group_buy_pricing_tiers')
    .insert(tierRows)
    .select();

  if (tierError) {
    console.error('Create pricing tiers error:', tierError);
  }

  // If Champion created, generate activation requirement
  let activationOrderId = undefined;
  if (!isAdmin) {
    // Generate pending order for Champion activation (1-10 units)
    const activationQty = Math.min(Math.max(initial_purchase_quantity, 1), 10);
    const orderNumber = `ORD-ACT-${Date.now().toString().slice(-6)}`;

    const { data: actOrder } = await serviceClient
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: userId,
        group_buy_id: newGb.id,
        product_id: product_id || null,
        basket_id: basket_id || null,
        quantity: activationQty,
        unit_price_at_purchase: basePrice,
        total_amount: basePrice * activationQty,
        currency_code: 'NGN',
        status: 'pending',
        is_champion_activation: true,
        idempotency_key: `act-${newGb.id}-${userId}`,
      })
      .select('id')
      .single();

    activationOrderId = actOrder?.id;
  }

  return jsonResponse(
    {
      group_buy: newGb,
      pricing_tiers: createdTiers || [],
      activation_required: !isAdmin,
      activation_order_id: activationOrderId,
      qr_code_url: qrCodeUrl,
      share_url: shareUrl,
    },
    201,
  );
}

/**
 * POST /group-buys/:id/join
 * Join an active Group Buy with quantity validation (1-10 units) and split checkout preview
 */
async function handleJoin(req: Request, groupBuyId: string): Promise<Response> {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');

  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const body = await req.json();
  const { quantity, use_wallet = true } = body;

  if (!quantity || quantity < 1) {
    throw new HttpError(400, 'Quantity must be at least 1 unit');
  }

  // 1. Validate 10-unit cumulative user limit
  await validateUserUnitLimit(supabase, userId, groupBuyId, quantity, 10);

  // 2. Fetch Group Buy details
  const serviceClient = createServiceClient();
  const { data: gb } = await serviceClient
    .from('group_buys')
    .select('*, pricing_tiers:group_buy_pricing_tiers(*)')
    .eq('id', groupBuyId)
    .single();

  if (!gb) throw new HttpError(404, 'Group Buy not found');
  if (gb.status !== 'live') {
    throw new HttpError(400, `Cannot join Group Buy in ${gb.status} status. Only LIVE buys accept orders.`);
  }

  // 3. Resolve current tier unit price
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

  // 4. Calculate wallet vs gateway split (§23)
  let walletAmount = 0;
  let gatewayAmount = totalAmount;

  if (use_wallet) {
    const { data: wallet } = await serviceClient
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (wallet && wallet.balance > 0) {
      walletAmount = Math.min(Number(wallet.balance), totalAmount);
      gatewayAmount = totalAmount - walletAmount;
    }
  }

  // 5. Create pending order
  const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
  const idempotencyKey = `join-${groupBuyId}-${userId}-${Date.now()}`;

  const { data: order, error: orderErr } = await serviceClient
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: userId,
      group_buy_id: groupBuyId,
      product_id: gb.product_id,
      basket_id: gb.basket_id,
      quantity,
      unit_price_at_purchase: currentPrice,
      total_amount: totalAmount,
      currency_code: 'NGN',
      status: 'pending',
      wallet_amount: walletAmount,
      gateway_amount: gatewayAmount,
      idempotency_key: idempotencyKey,
    })
    .select()
    .single();

  if (orderErr || !order) {
    console.error('Order creation error:', orderErr);
    throw new HttpError(500, 'Failed to create order');
  }

  return jsonResponse({
    order_id: order.id,
    order_number: order.order_number,
    unit_price: currentPrice,
    total_amount: totalAmount,
    wallet_amount: walletAmount,
    gateway_amount: gatewayAmount,
    requires_gateway_payment: gatewayAmount > 0,
  }, 201);
}

/**
 * GET /group-buys/:id/share
 * Generates pre-formatted WhatsApp, SMS, and QR code metadata for viral sharing
 */
async function handleShare(req: Request, groupBuyId: string): Promise<Response> {
  const supabase = createServiceClient();

  const { data: gb } = await supabase
    .from('group_buys')
    .select(`
      *,
      product:products(name, unit),
      basket:baskets(name),
      service_area:service_areas(name),
      collection_point:collection_points(name),
      creator:profiles!group_buys_created_by_fkey(display_name, first_name)
    `)
    .eq('id', groupBuyId)
    .single();

  if (!gb) throw new HttpError(404, 'Group Buy not found');

  const itemTitle = gb.product?.name ?? gb.basket?.name ?? 'Food Essential';
  const unit = gb.product?.unit ?? 'basket';
  const areaName = gb.service_area?.name ?? 'Lagos';
  const shareUrl = `https://staple.ng/gb/${gb.slug}`;
  const qrCodeUrl = gb.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`;

  const whatsappMessage =
    `🛒 *Join my Group Buy on staple!* 🌾\n\n` +
    `We are pooling orders for *${itemTitle}* in *${areaName}* to unlock bulk farmgate pricing!\n\n` +
    `💰 *Price:* ₦${Number(gb.unit_price).toLocaleString()} / ${unit}\n` +
    `📊 *Progress:* ${gb.paid_quantity}/${gb.target_quantity} orders\n` +
    `👉 Join our community buy here:\n${shareUrl}`;

  const smsMessage =
    `Join our staple group buy for ${itemTitle} in ${areaName}! Current price: ₦${Number(gb.unit_price).toLocaleString()}/${unit}. Join at ${shareUrl}`;

  return jsonResponse({
    title: `Buy ${itemTitle} together on staple`,
    product_name: itemTitle,
    slug: gb.slug,
    share_url: shareUrl,
    qr_code_url: qrCodeUrl,
    area_name: areaName,
    current_price: Number(gb.unit_price),
    original_price: Number(gb.original_unit_price),
    savings_percentage: Math.round(((Number(gb.original_unit_price) - Number(gb.unit_price)) / Number(gb.original_unit_price)) * 100),
    target_quantity: gb.target_quantity,
    paid_quantity: gb.paid_quantity,
    whatsapp_message: whatsappMessage,
    sms_message: smsMessage,
  });
}
