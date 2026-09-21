/**
 * STAPLE LIMITED — Champion Management & Engagement API (Phase 5)
 *
 * Routes:
 * - POST /champions/apply                  - Submit champion application
 * - GET  /champions/me                     - Current user's champion dashboard metrics & status
 * - GET  /champions/group-buys             - Group Buys organized by this Champion
 * - GET  /champions/milestones             - Champion's milestone rewards ledger
 * - GET  /champions/admin/applications     - Admin: List all applications
 * - POST /champions/admin/applications/:id/review - Admin: Approve / Reject application
 * - POST /champions/admin/:userId/suspend  - Admin: Suspend champion
 * - POST /champions/admin/:userId/reactivate - Admin: Reactivate suspended champion
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return corsHeaders();
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    // Route matching
    // Path could be /champions/... or /functions/v1/champions/...
    const champIdx = pathSegments.indexOf('champions');
    const relSegments = champIdx >= 0 ? pathSegments.slice(champIdx + 1) : pathSegments;

    // --- Admin routes ---
    if (relSegments[0] === 'admin') {
      if (relSegments[1] === 'applications') {
        // POST /champions/admin/applications/:id/review
        if (relSegments.length === 4 && relSegments[3] === 'review' && req.method === 'POST') {
          return await handleAdminReviewApplication(req, relSegments[2]);
        }
        // GET /champions/admin/applications
        if (req.method === 'GET') {
          return await handleAdminListApplications(req, url);
        }
      }

      // POST /champions/admin/:userId/suspend
      if (relSegments.length === 3 && relSegments[2] === 'suspend' && req.method === 'POST') {
        return await handleAdminSuspendChampion(req, relSegments[1]);
      }

      // POST /champions/admin/:userId/reactivate
      if (relSegments.length === 3 && relSegments[2] === 'reactivate' && req.method === 'POST') {
        return await handleAdminReactivateChampion(req, relSegments[1]);
      }
    }

    // --- User / Champion routes ---
    if (req.method === 'POST' && relSegments[0] === 'apply') {
      return await handleApplyChampion(req);
    }

    if (req.method === 'GET' && (relSegments[0] === 'me' || relSegments.length === 0)) {
      return await handleGetChampionMe(req);
    }

    if (req.method === 'GET' && relSegments[0] === 'group-buys') {
      return await handleGetChampionGroupBuys(req);
    }

    if (req.method === 'GET' && relSegments[0] === 'milestones') {
      return await handleGetChampionMilestones(req);
    }

    throw new HttpError(404, `Endpoint not found: ${url.pathname}`);
  } catch (error) {
    return errorResponse(error);
  }
});

/**
 * POST /champions/apply
 * Submits a new Champion application
 */
async function handleApplyChampion(req: Request): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const body = await req.json();

  const {
    full_name,
    phone,
    state,
    lga,
    neighborhood,
    service_area_id,
    estimated_network_size,
    motivation,
    experience,
  } = body;

  if (!full_name || full_name.trim().length < 3) {
    throw new HttpError(400, 'Full name must be at least 3 characters long');
  }
  if (!phone || phone.trim().length < 10) {
    throw new HttpError(400, 'A valid Nigerian phone number is required');
  }
  if (!state || !lga || !neighborhood) {
    throw new HttpError(400, 'State, LGA, and Neighborhood/Estate are required');
  }
  if (!estimated_network_size || Number(estimated_network_size) < 1) {
    throw new HttpError(400, 'Estimated community network size must be at least 1 household');
  }
  if (!motivation || motivation.trim().length < 15) {
    throw new HttpError(400, 'Please share your motivation in at least 15 characters');
  }

  const serviceClient = createServiceClient();

  // Check if user is already an active champion
  const { data: profile, error: profileErr } = await serviceClient
    .from('profiles')
    .select('champion_status')
    .eq('id', userId)
    .single();

  if (profileErr) {
    throw new HttpError(500, 'Failed to fetch user profile');
  }

  if (profile?.champion_status === 'active') {
    throw new HttpError(400, 'You are already an Active STAPLE Champion.');
  }

  // Check if user has an existing pending application
  const { data: existingApp } = await serviceClient
    .from('champion_applications')
    .select('id, status')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingApp) {
    throw new HttpError(
      400,
      'You already have a Champion application pending review. Our team will contact you within 24-48 hours.',
    );
  }

  // Insert application
  const { data: application, error: insertErr } = await serviceClient
    .from('champion_applications')
    .insert({
      user_id: userId,
      full_name: full_name.trim(),
      phone: phone.trim(),
      state: state.trim(),
      lga: lga.trim(),
      neighborhood: neighborhood.trim(),
      service_area_id: service_area_id || null,
      estimated_network_size: Number(estimated_network_size),
      motivation: motivation.trim(),
      experience: experience?.trim() || null,
      status: 'pending',
    })
    .select()
    .single();

  if (insertErr) {
    console.error('Error inserting champion application:', insertErr);
    throw new HttpError(500, 'Failed to submit application. Please try again.');
  }

  return jsonResponse(
    {
      application,
      message: 'Your Champion application has been submitted! Our neighborhood team will review it within 24-48 hours.',
    },
    201,
  );
}

/**
 * GET /champions/me
 * Retrieves current user's champion status, active buys count, GMV, and milestone rewards
 */
async function handleGetChampionMe(req: Request): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  // 1. Profile details
  const { data: profile, error: profErr } = await serviceClient
    .from('profiles')
    .select('id, first_name, last_name, phone, champion_status, champion_approved_at, champion_suspension_reason')
    .eq('id', userId)
    .single();

  if (profErr || !profile) {
    throw new HttpError(404, 'User profile not found');
  }

  // 2. Pending application if any
  const { data: pendingApp } = await serviceClient
    .from('champion_applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 3. Group Buys created by Champion
  const { data: groupBuys, error: gbErr } = await serviceClient
    .from('group_buys')
    .select('id, slug, title, status, target_quantity, paid_quantity, min_fulfilment_quantity, original_unit_price, expires_at, created_at')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (gbErr) {
    console.error('Error fetching champion group buys:', gbErr);
    throw new HttpError(500, 'Failed to fetch Group Buys');
  }

  const allBuys = groupBuys || [];

  // Active buys: pending_activation, live, target_reached
  const activeBuys = allBuys.filter((gb) =>
    ['pending_activation', 'live', 'target_reached'].includes(gb.status),
  );

  const completedBuys = allBuys.filter((gb) =>
    ['delivery_fulfilment', 'completed'].includes(gb.status),
  );

  const successfulBuys = allBuys.filter(
    (gb) => gb.paid_quantity >= gb.target_quantity || (gb.paid_quantity >= (gb.min_fulfilment_quantity || 1)),
  );

  // Total GMV mobilized: sum of (paid_quantity * original_unit_price) across all buys
  const totalGmv = allBuys.reduce((sum, gb) => {
    return sum + (gb.paid_quantity * (Number(gb.original_unit_price) || 0));
  }, 0);

  // 4. Milestone rewards earned from wallet_transactions
  const { data: milestoneTxs, error: txErr } = await serviceClient
    .from('wallet_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('transaction_type', 'credit_champion_milestone');

  const milestoneRewardsEarned = (milestoneTxs || []).reduce(
    (sum, tx) => sum + Number(tx.amount || 0),
    0,
  );

  // 5. Query system max active buys (default 2 per Spec §8)
  const { data: configRow } = await serviceClient
    .from('system_config')
    .select('value')
    .eq('key', 'max_champion_active_group_buys')
    .maybeSingle();

  const maxActive = Number(configRow?.value ?? 2);

  // 6. Community members reached count
  const gbIds = allBuys.map((g) => g.id);
  let communityMembersCount = 0;
  if (gbIds.length > 0) {
    const { count } = await serviceClient
      .from('group_buy_participants')
      .select('user_id', { count: 'exact', head: true })
      .in('group_buy_id', gbIds);
    communityMembersCount = count || 0;
  }

  return jsonResponse({
    profile: {
      id: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      phone: profile.phone,
      championStatus: profile.champion_status,
      championApprovedAt: profile.champion_approved_at,
      championSuspensionReason: profile.champion_suspension_reason,
    },
    metrics: {
      userId,
      championStatus: profile.champion_status,
      activeGroupBuysCount: activeBuys.length,
      maxActiveGroupBuys: maxActive,
      totalGroupBuysOrganized: allBuys.length,
      successfulGroupBuysCount: successfulBuys.length,
      totalGmvNaira: totalGmv,
      milestoneRewardsEarnedNaira: milestoneRewardsEarned,
      communityMembersReached: communityMembersCount,
    },
    pendingApplication: pendingApp || null,
    recentGroupBuys: allBuys.slice(0, 5).map((gb) => ({
      id: gb.id,
      slug: gb.slug,
      title: gb.title,
      status: gb.status,
      targetQuantity: gb.target_quantity,
      paidQuantity: gb.paid_quantity,
      progressPercentage: Math.min(100, Math.round((gb.paid_quantity / (gb.target_quantity || 1)) * 100)),
      mvfqMet: gb.paid_quantity >= (gb.min_fulfilment_quantity || 1),
      expiresAt: gb.expires_at,
    })),
  });
}

/**
 * GET /champions/group-buys
 * Returns full history of Group Buys organized by caller
 */
async function handleGetChampionGroupBuys(req: Request): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  const { data: groupBuys, error } = await serviceClient
    .from('group_buys')
    .select(`
      id, slug, title, status, target_quantity, paid_quantity,
      min_fulfilment_quantity, original_unit_price, expires_at, created_at,
      product:products(id, name, image_url, unit_description),
      service_area:service_areas(id, name)
    `)
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new HttpError(500, 'Failed to query Champion Group Buys');
  }

  return jsonResponse({ groupBuys: groupBuys || [] });
}

/**
 * GET /champions/milestones
 * Returns audit ledger of ₦2,000 milestone rewards credited to the Champion
 */
async function handleGetChampionMilestones(req: Request): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  const { data: txs, error } = await serviceClient
    .from('wallet_transactions')
    .select(`
      id, amount, description, idempotency_key, created_at,
      group_buy:group_buys(id, title, slug)
    `)
    .eq('user_id', userId)
    .eq('transaction_type', 'credit_champion_milestone')
    .order('created_at', { ascending: false });

  if (error) {
    throw new HttpError(500, 'Failed to query milestone transactions');
  }

  const milestones = (txs || []).map((tx: any) => ({
    id: tx.id,
    groupBuyId: tx.group_buy?.id || null,
    groupBuyTitle: tx.group_buy?.title || 'Group Buy Target Milestone',
    groupBuySlug: tx.group_buy?.slug || '',
    amountNaira: Number(tx.amount),
    creditedAt: tx.created_at,
    status: 'credited',
  }));

  return jsonResponse({ milestones });
}

/**
 * Verify caller is an Admin or Super Admin
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
 * GET /champions/admin/applications
 * Admin lists applications with optional status filter
 */
async function handleAdminListApplications(req: Request, url: URL): Promise<Response> {
  await verifyAdminCaller(req);
  const status = url.searchParams.get('status');
  const serviceClient = createServiceClient();

  let query = serviceClient
    .from('champion_applications')
    .select(`
      *,
      user:profiles!user_id(id, first_name, last_name, email, phone, avatar_url)
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data: applications, error } = await query;
  if (error) {
    console.error('Error fetching applications:', error);
    throw new HttpError(500, 'Failed to fetch Champion applications');
  }

  return jsonResponse({ applications: applications || [] });
}

/**
 * POST /champions/admin/applications/:id/review
 * Admin approves or rejects a champion application
 */
async function handleAdminReviewApplication(req: Request, applicationId: string): Promise<Response> {
  const adminId = await verifyAdminCaller(req);
  const body = await req.json();
  const { action, rejectionReason } = body;

  if (!['approve', 'reject'].includes(action)) {
    throw new HttpError(400, 'Invalid action. Must be "approve" or "reject".');
  }

  const serviceClient = createServiceClient();

  const { data: app, error: appErr } = await serviceClient
    .from('champion_applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (appErr || !app) {
    throw new HttpError(404, 'Application not found');
  }

  const now = new Date().toISOString();

  if (action === 'approve') {
    // 1. Update application record
    const { data: updatedApp, error: uErr } = await serviceClient
      .from('champion_applications')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: now,
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (uErr) {
      throw new HttpError(500, 'Failed to update application');
    }

    // 2. Elevate user profile to Champion
    const { error: profErr } = await serviceClient
      .from('profiles')
      .update({
        role: 'champion',
        champion_status: 'active',
        champion_approved_at: now,
        champion_approved_by: adminId,
        champion_suspended_at: null,
        champion_suspended_by: null,
        champion_suspension_reason: null,
      })
      .eq('id', app.user_id);

    if (profErr) {
      console.error('Error updating user profile to champion:', profErr);
      throw new HttpError(500, 'Failed to update profile to active champion');
    }

    // 3. Log audit record
    await serviceClient.from('audit_logs').insert({
      action: 'champion.approved',
      actor_id: adminId,
      target_resource: `profiles/${app.user_id}`,
      details: { applicationId, applicantName: app.full_name, neighborhood: app.neighborhood },
    });

    return jsonResponse({
      application: updatedApp,
      championStatus: 'active',
      message: `Champion application for ${app.full_name} approved successfully.`,
    });
  } else {
    // Reject
    const { data: updatedApp, error: rErr } = await serviceClient
      .from('champion_applications')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason || 'Application criteria not met at this time.',
        reviewed_by: adminId,
        reviewed_at: now,
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (rErr) {
      throw new HttpError(500, 'Failed to reject application');
    }

    // Log audit record
    await serviceClient.from('audit_logs').insert({
      action: 'champion.rejected',
      actor_id: adminId,
      target_resource: `profiles/${app.user_id}`,
      details: { applicationId, applicantName: app.full_name, rejectionReason },
    });

    return jsonResponse({
      application: updatedApp,
      championStatus: 'inactive',
      message: `Champion application for ${app.full_name} has been rejected.`,
    });
  }
}

/**
 * POST /champions/admin/:userId/suspend
 * Admin suspends an active champion
 */
async function handleAdminSuspendChampion(req: Request, targetUserId: string): Promise<Response> {
  const adminId = await verifyAdminCaller(req);
  const body = await req.json();
  const { reason } = body;

  if (!reason || reason.trim().length < 5) {
    throw new HttpError(400, 'A valid suspension reason must be provided (minimum 5 characters)');
  }

  const serviceClient = createServiceClient();
  const now = new Date().toISOString();

  const { error } = await serviceClient
    .from('profiles')
    .update({
      champion_status: 'suspended',
      champion_suspended_at: now,
      champion_suspended_by: adminId,
      champion_suspension_reason: reason.trim(),
    })
    .eq('id', targetUserId);

  if (error) {
    throw new HttpError(500, 'Failed to suspend champion');
  }

  // Log audit
  await serviceClient.from('audit_logs').insert({
    action: 'champion.suspended',
    actor_id: adminId,
    target_resource: `profiles/${targetUserId}`,
    details: { reason: reason.trim() },
  });

  return jsonResponse({
    userId: targetUserId,
    championStatus: 'suspended',
    message: 'Champion account suspended successfully.',
  });
}

/**
 * POST /champions/admin/:userId/reactivate
 * Admin reactivates a suspended champion
 */
async function handleAdminReactivateChampion(req: Request, targetUserId: string): Promise<Response> {
  const adminId = await verifyAdminCaller(req);
  const serviceClient = createServiceClient();

  const { error } = await serviceClient
    .from('profiles')
    .update({
      champion_status: 'active',
      champion_suspended_at: null,
      champion_suspended_by: null,
      champion_suspension_reason: null,
    })
    .eq('id', targetUserId);

  if (error) {
    throw new HttpError(500, 'Failed to reactivate champion');
  }

  // Log audit
  await serviceClient.from('audit_logs').insert({
    action: 'champion.reactivated',
    actor_id: adminId,
    target_resource: `profiles/${targetUserId}`,
  });

  return jsonResponse({
    userId: targetUserId,
    championStatus: 'active',
    message: 'Champion account reactivated successfully.',
  });
}
