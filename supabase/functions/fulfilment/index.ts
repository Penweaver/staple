/**
 * STAPLE LIMITED — Fulfilment & Collection Hub Operations API (Phase 6)
 *
 * Routes:
 * - POST /fulfilment/dispatch           - Dispatch Group Buy & auto-assign nearest hubs (Addendum B4)
 * - GET  /fulfilment/my-pickups         - Customer's active and historical pickups with codes
 * - POST /fulfilment/verify-code        - Hub staff terminal: Verify 6-digit pickup code
 * - POST /fulfilment/complete-handoff   - Hub staff terminal: Mark goods collected with proxy tracking
 * - GET  /fulfilment/admin/hubs         - Admin: Active hubs with inventory staging load
 * - GET  /fulfilment/admin/orders       - Admin: Fulfilment order queue with status filters
 * - PATCH /fulfilment/admin/reassign-hub - Admin: Override participant collection point (Addendum B4)
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return corsHeaders();
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    // Path matching (/fulfilment/...)
    const fulfilIdx = pathSegments.indexOf('fulfilment');
    const relSegments = fulfilIdx >= 0 ? pathSegments.slice(fulfilIdx + 1) : pathSegments;

    // --- Admin routes ---
    if (relSegments[0] === 'admin') {
      if (relSegments[1] === 'hubs' && req.method === 'GET') {
        return await handleAdminListHubs(req);
      }
      if (relSegments[1] === 'orders' && req.method === 'GET') {
        return await handleAdminListOrders(req, url);
      }
      if (relSegments[1] === 'reassign-hub' && req.method === 'PATCH') {
        return await handleAdminReassignHub(req);
      }
    }

    // --- Dispatch & Staging ---
    if (relSegments[0] === 'dispatch' && req.method === 'POST') {
      return await handleDispatchGroupBuy(req);
    }

    // --- Customer Pickup Pass ---
    if (relSegments[0] === 'my-pickups' && req.method === 'GET') {
      return await handleGetMyPickups(req);
    }

    // --- Hub Verification Terminal ---
    if (relSegments[0] === 'verify-code' && req.method === 'POST') {
      return await handleVerifyPickupCode(req);
    }

    if (relSegments[0] === 'complete-handoff' && req.method === 'POST') {
      return await handleCompleteHandoff(req);
    }

    throw new HttpError(404, `Endpoint not found: ${url.pathname}`);
  } catch (error) {
    return errorResponse(error);
  }
});

/**
 * Verify that caller has Admin privileges
 */
async function verifyAdminCaller(req: Request): Promise<string> {
  const supabase = createUserClient(req);
  const adminId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new HttpError(403, 'Unauthorized: Admin privileges required');
  }

  return adminId;
}

/**
 * Generate 6-digit alphanumeric pickup code: STP-XXX-XXX
 */
function generatePickupCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 3; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `STP-${p1}-${p2}`;
}

/**
 * Normalizes input code to STP-XXX-XXX
 */
function normalizePickupCode(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.trim().toUpperCase().replace(/[\s-]/g, '');
  if (cleaned.startsWith('STP')) {
    const chars = cleaned.slice(3);
    if (chars.length === 6) {
      return `STP-${chars.slice(0, 3)}-${chars.slice(3, 6)}`;
    }
  }
  if (cleaned.length === 6) {
    return `STP-${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`;
  }
  return raw.trim().toUpperCase();
}

/**
 * POST /fulfilment/dispatch
 * Transitions a Group Buy to DELIVERY_FULFILMENT, creates fulfilment records,
 * and auto-assigns the nearest collection hub per participant (Addendum B4).
 */
async function handleDispatchGroupBuy(req: Request): Promise<Response> {
  const adminId = await verifyAdminCaller(req);
  const body = await req.json();
  const { groupBuyId } = body;

  if (!groupBuyId) {
    throw new HttpError(400, 'groupBuyId is required');
  }

  const serviceClient = createServiceClient();

  // 1. Fetch Group Buy
  const { data: gb, error: gbErr } = await serviceClient
    .from('group_buys')
    .select('id, status, service_area_id, default_collection_point_id')
    .eq('id', groupBuyId)
    .single();

  if (gbErr || !gb) {
    throw new HttpError(404, 'Group Buy not found');
  }

  // If not already in delivery_fulfilment, transition state machine
  if (gb.status !== 'delivery_fulfilment') {
    await transitionGroupBuy(serviceClient, groupBuyId, 'delivery_fulfilment', adminId);
  }

  // 2. Fetch all paid orders for this Group Buy
  const { data: orders, error: ordErr } = await serviceClient
    .from('orders')
    .select('id, user_id, quantity, status')
    .eq('group_buy_id', groupBuyId)
    .in('status', ['paid', 'fulfilment_ready']);

  if (ordErr) {
    throw new HttpError(500, 'Failed to query orders for fulfilment dispatch');
  }

  const paidOrders = orders || [];
  let stagedCount = 0;
  const assignedHubIds = new Set<string>();

  for (const ord of paidOrders) {
    // Check if fulfilment already exists
    const { data: existingFulfilment } = await serviceClient
      .from('fulfilments')
      .select('id, collection_point_id')
      .eq('order_id', ord.id)
      .maybeSingle();

    if (existingFulfilment) {
      if (existingFulfilment.collection_point_id) {
        assignedHubIds.add(existingFulfilment.collection_point_id);
      }
      continue;
    }

    // Call database function to find nearest collection point (Addendum B4)
    let assignedHubId: string | null = null;
    const { data: nearestHubId } = await serviceClient.rpc('get_nearest_collection_point_for_user', {
      p_user_id: ord.user_id,
      p_service_area_id: gb.service_area_id,
    });

    assignedHubId = nearestHubId || gb.default_collection_point_id;
    if (assignedHubId) {
      assignedHubIds.add(assignedHubId);
    }

    const pickupCode = generatePickupCode();

    // Insert fulfilment record
    const { error: insErr } = await serviceClient.from('fulfilments').insert({
      group_buy_id: groupBuyId,
      order_id: ord.id,
      user_id: ord.user_id,
      method: 'collection',
      status: 'ready_for_collection',
      collection_point_id: assignedHubId,
      collection_code: pickupCode,
    });

    if (insErr) {
      console.error('Error inserting fulfilment record:', insErr);
      continue;
    }

    // Update order status to fulfilment_ready
    await serviceClient
      .from('orders')
      .update({ status: 'fulfilment_ready', updated_at: new Date().toISOString() })
      .eq('id', ord.id);

    stagedCount++;
  }

  return jsonResponse({
    groupBuyId,
    stagedOrdersCount: stagedCount,
    assignedHubsCount: assignedHubIds.size,
    status: 'delivery_fulfilment',
    message: `Dispatched ${stagedCount} orders across ${assignedHubIds.size} collection hub(s).`,
  });
}

/**
 * GET /fulfilment/my-pickups
 * Customer retrieves active pickup codes and collection point instructions
 */
async function handleGetMyPickups(req: Request): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  const { data: fulfilments, error } = await serviceClient
    .from('fulfilments')
    .select(`
      id, status, collection_code, collected_at, collected_by, created_at,
      order:orders(
        id, order_number, quantity, total_amount,
        product:products(name, unit_description, image_url),
        basket:baskets(name, image_url)
      ),
      collection_point:collection_points(
        id, name, address, contact_phone, contact_name, operating_hours
      ),
      group_buy:group_buys(id, title, slug)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user pickups:', error);
    throw new HttpError(500, 'Failed to fetch pickup passes');
  }

  const pickups = (fulfilments || []).map((f: any) => ({
    fulfilmentId: f.id,
    orderId: f.order?.id,
    orderNumber: f.order?.order_number,
    pickupCode: f.collection_code,
    status: f.status,
    itemName: f.order?.product?.name || f.order?.basket?.name || 'Foodstuff Order',
    unitDescription: f.order?.product?.unit_description || 'package',
    quantity: f.order?.quantity,
    totalAmountNaira: Number(f.order?.total_amount || 0),
    hub: {
      id: f.collection_point?.id,
      name: f.collection_point?.name,
      address: f.collection_point?.address,
      contactPhone: f.collection_point?.contact_phone,
      contactName: f.collection_point?.contact_name,
      operatingHours: f.collection_point?.operating_hours,
    },
    groupBuyTitle: f.group_buy?.title,
    groupBuySlug: f.group_buy?.slug,
    isReadyForPickup: f.status === 'ready_for_collection',
    isCollected: f.status === 'collected',
    collectedAt: f.collected_at,
    collectedBy: f.collected_by,
  }));

  return jsonResponse({ pickups });
}

/**
 * POST /fulfilment/verify-code
 * Hub verification terminal: verifies code, displays items & customer details
 */
async function handleVerifyPickupCode(req: Request): Promise<Response> {
  const body = await req.json();
  const { pickupCode } = body;

  if (!pickupCode) {
    throw new HttpError(400, 'pickupCode is required');
  }

  const normalized = normalizePickupCode(pickupCode);
  const serviceClient = createServiceClient();

  const { data: fulfilment, error } = await serviceClient
    .from('fulfilments')
    .select(`
      id, status, collection_code, collected_at, collected_by,
      user:profiles!user_id(id, first_name, last_name, phone),
      order:orders!order_id(
        id, order_number, quantity, total_amount,
        product:products(name, unit_description),
        basket:baskets(name)
      ),
      collection_point:collection_points!collection_point_id(name, address)
    `)
    .eq('collection_code', normalized)
    .maybeSingle();

  if (error || !fulfilment) {
    throw new HttpError(404, `No order found matching pickup code "${normalized}". Please re-check the code.`);
  }

  const f: any = fulfilment;
  const isReady = f.status === 'ready_for_collection';
  const isAlreadyCollected = f.status === 'collected';

  return jsonResponse({
    fulfilmentId: f.id,
    orderId: f.order?.id,
    orderNumber: f.order?.order_number,
    pickupCode: f.collection_code,
    status: f.status,
    customerName: `${f.user?.first_name} ${f.user?.last_name}`,
    customerPhone: f.user?.phone || 'N/A',
    productName: f.order?.product?.name || f.order?.basket?.name || 'Foodstuff Item',
    quantity: f.order?.quantity,
    totalAmountNaira: Number(f.order?.total_amount || 0),
    hubName: f.collection_point?.name || 'STAPLE Collection Hub',
    hubAddress: f.collection_point?.address || '',
    isReadyForPickup: isReady,
    alreadyCollected: isAlreadyCollected,
    collectedAt: f.collected_at,
    collectedBy: f.collected_by,
  });
}

/**
 * POST /fulfilment/complete-handoff
 * Hub terminal marks goods collected; auto-completes Group Buy if all orders collected
 */
async function handleCompleteHandoff(req: Request): Promise<Response> {
  const body = await req.json();
  const { fulfilmentId, collectedBy, notes } = body;

  if (!fulfilmentId) {
    throw new HttpError(400, 'fulfilmentId is required');
  }

  const serviceClient = createServiceClient();

  // 1. Fetch fulfilment record
  const { data: fulfilment, error: fetchErr } = await serviceClient
    .from('fulfilments')
    .select(`
      id, order_id, group_buy_id, status,
      user:profiles!user_id(first_name, last_name)
    `)
    .eq('id', fulfilmentId)
    .single();

  if (fetchErr || !fulfilment) {
    throw new HttpError(404, 'Fulfilment record not found');
  }

  if (fulfilment.status === 'collected') {
    throw new HttpError(400, 'This order has already been collected and marked complete.');
  }

  const f: any = fulfilment;
  const collectorName = (collectedBy && collectedBy.trim()) || `${f.user?.first_name} ${f.user?.last_name}`;
  const now = new Date().toISOString();

  // 2. Update fulfilment status to collected
  const { error: updErr } = await serviceClient
    .from('fulfilments')
    .update({
      status: 'collected',
      collected_at: now,
      collected_by: collectorName,
      notes: notes || null,
      updated_at: now,
    })
    .eq('id', fulfilmentId);

  if (updErr) {
    throw new HttpError(500, 'Failed to complete collection handoff');
  }

  // 3. Update order status to collected
  await serviceClient
    .from('orders')
    .update({ status: 'collected', updated_at: now })
    .eq('id', fulfilment.order_id);

  // 4. Check if all orders for the Group Buy are collected -> Complete Group Buy
  let groupBuyCompleted = false;
  if (fulfilment.group_buy_id) {
    const { data: remainingOrders } = await serviceClient
      .from('orders')
      .select('id, status')
      .eq('group_buy_id', fulfilment.group_buy_id)
      .in('status', ['paid', 'fulfilment_ready', 'in_fulfilment']);

    if (!remainingOrders || remainingOrders.length === 0) {
      // Transition Group Buy to completed
      await serviceClient
        .from('group_buys')
        .update({ status: 'completed', updated_at: now })
        .eq('id', fulfilment.group_buy_id);
      groupBuyCompleted = true;
    }
  }

  // 5. Log audit record
  await serviceClient.from('audit_logs').insert({
    action: 'fulfilment.collected',
    target_resource: `fulfilments/${fulfilmentId}`,
    details: {
      orderId: fulfilment.order_id,
      collectedBy: collectorName,
      groupBuyId: fulfilment.group_buy_id,
      groupBuyCompleted,
    },
  });

  return jsonResponse({
    fulfilmentId,
    orderId: fulfilment.order_id,
    status: 'collected',
    collectedAt: now,
    collectedBy: collectorName,
    groupBuyCompleted,
    message: `Order successfully marked collected by ${collectorName}.`,
  });
}

/**
 * GET /fulfilment/admin/hubs
 * Admin lists all collection points with their current staging load
 */
async function handleAdminListHubs(req: Request): Promise<Response> {
  await verifyAdminCaller(req);
  const serviceClient = createServiceClient();

  const { data: hubs, error: hubErr } = await serviceClient
    .from('collection_points')
    .select(`
      id, name, address, contact_phone, contact_name, operating_hours, is_active,
      service_area:service_areas(id, name)
    `)
    .eq('is_active', true)
    .order('name');

  if (hubErr) {
    throw new HttpError(500, 'Failed to fetch collection hubs');
  }

  // Calculate staging load per hub
  const hubList = hubs || [];
  const hubLoads = await Promise.all(
    hubList.map(async (hub: any) => {
      const { data: fulfilments } = await serviceClient
        .from('fulfilments')
        .select(`
          status,
          order:orders(quantity)
        `)
        .eq('collection_point_id', hub.id);

      const items = fulfilments || [];
      let readyUnits = 0;
      let collectedUnits = 0;
      let pendingUnits = 0;

      for (const item of items) {
        const qty = (item.order as any)?.quantity || 1;
        if (item.status === 'collected') collectedUnits += qty;
        else if (item.status === 'ready_for_collection') readyUnits += qty;
        else pendingUnits += qty;
      }

      return {
        collectionPointId: hub.id,
        hubName: hub.name,
        serviceAreaName: hub.service_area?.name || '',
        address: hub.address,
        contactPhone: hub.contact_phone,
        contactName: hub.contact_name,
        operatingHours: hub.operating_hours,
        readyUnitsCount: readyUnits,
        collectedUnitsCount: collectedUnits,
        pendingUnitsCount: pendingUnits,
        totalOrdersCount: items.length,
      };
    }),
  );

  return jsonResponse({ hubs: hubLoads });
}

/**
 * GET /fulfilment/admin/orders
 * Admin views fulfilment orders across hubs with status filter
 */
async function handleAdminListOrders(req: Request, url: URL): Promise<Response> {
  await verifyAdminCaller(req);
  const status = url.searchParams.get('status');
  const hubId = url.searchParams.get('hub_id');
  const serviceClient = createServiceClient();

  let query = serviceClient
    .from('fulfilments')
    .select(`
      id, status, collection_code, collected_at, collected_by, created_at,
      order:orders(
        id, order_number, quantity, total_amount,
        product:products(name),
        basket:baskets(name)
      ),
      user:profiles!user_id(id, first_name, last_name, phone),
      collection_point:collection_points(id, name, address),
      group_buy:group_buys(id, title, slug)
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }
  if (hubId) {
    query = query.eq('collection_point_id', hubId);
  }

  const { data: orders, error } = await query;
  if (error) {
    throw new HttpError(500, 'Failed to fetch fulfilment orders');
  }

  return jsonResponse({ orders: orders || [] });
}

/**
 * PATCH /fulfilment/admin/reassign-hub
 * Admin manual override to reassign participant to different hub (Addendum B4)
 */
async function handleAdminReassignHub(req: Request): Promise<Response> {
  const adminId = await verifyAdminCaller(req);
  const body = await req.json();
  const { fulfilmentId, newCollectionPointId, reason } = body;

  if (!fulfilmentId || !newCollectionPointId) {
    throw new HttpError(400, 'fulfilmentId and newCollectionPointId are required');
  }

  const serviceClient = createServiceClient();

  const { error } = await serviceClient
    .from('fulfilments')
    .update({
      collection_point_id: newCollectionPointId,
      notes: reason ? `Reassigned: ${reason}` : 'Reassigned by Admin',
      updated_at: new Date().toISOString(),
    })
    .eq('id', fulfilmentId);

  if (error) {
    throw new HttpError(500, 'Failed to reassign collection hub');
  }

  await serviceClient.from('audit_logs').insert({
    action: 'fulfilment.hub_reassigned',
    actor_id: adminId,
    target_resource: `fulfilments/${fulfilmentId}`,
    details: { newCollectionPointId, reason },
  });

  return jsonResponse({
    fulfilmentId,
    newCollectionPointId,
    message: 'Collection hub reassigned successfully.',
  });
}
