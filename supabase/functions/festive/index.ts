/**
 * STAPLE LIMITED — Festive & Seasonal Planning API (Phase 7)
 * Spec §31–§40, §74, and Founder Addendum v1 (B5, A2).
 *
 * Routes:
 * - GET  /festive/seasons           - List active festive seasons (Christmas, Ileya, Owambe)
 * - POST /festive/plans             - Enrol in a festive/Owambe plan with instalment schedule
 * - GET  /festive/my-plans          - Customer's active/completed festive plans with progress
 * - GET  /festive/plans/:id         - Plan detail with instalments & payment ledger
 * - POST /festive/pay-instalment    - Pay scheduled instalment (Wallet or Gateway)
 * - GET  /festive/admin/plans       - Admin: View all plans with overdue/grace status
 * - POST /festive/admin/cancel-plan - Admin: Cancel defaulted plan after grace period (forfeiture)
 * - POST /festive/admin/cancel-season - Admin: STAPLE emergency season cancellation (100% refund)
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

const OWAMBE_MIN_PLANNING_DAYS = 42;
const OWAMBE_MAX_PLANNING_DAYS = 100;
const INSTALMENT_GRACE_PERIOD_DAYS = 7;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return corsHeaders();
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    // Relativize path (/festive/...)
    const festiveIdx = pathSegments.indexOf('festive');
    const relSegments = festiveIdx >= 0 ? pathSegments.slice(festiveIdx + 1) : pathSegments;

    // --- Admin Routes ---
    if (relSegments[0] === 'admin') {
      if (relSegments[1] === 'plans' && req.method === 'GET') {
        return await handleAdminListPlans(req, url);
      }
      if (relSegments[1] === 'cancel-plan' && req.method === 'POST') {
        return await handleAdminCancelPlan(req);
      }
      if (relSegments[1] === 'cancel-season' && req.method === 'POST') {
        return await handleAdminCancelSeason(req);
      }
    }

    // --- Public / Customer Routes ---
    if (relSegments[0] === 'seasons' && req.method === 'GET') {
      return await handleListSeasons(req);
    }

    if (relSegments[0] === 'plans' && req.method === 'POST') {
      return await handleCreatePlan(req);
    }

    if (relSegments[0] === 'my-plans' && req.method === 'GET') {
      return await handleGetMyPlans(req);
    }

    if (relSegments[0] === 'plans' && relSegments[1] && req.method === 'GET') {
      return await handleGetPlanDetail(req, relSegments[1]);
    }

    if (relSegments[0] === 'pay-instalment' && req.method === 'POST') {
      return await handlePayInstalment(req);
    }

    throw new HttpError(404, `Endpoint not found: ${url.pathname}`);
  } catch (error) {
    return errorResponse(error);
  }
});

/**
 * Verify Admin privileges
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
 * GET /festive/seasons - List active festive campaigns
 */
async function handleListSeasons(_req: Request): Promise<Response> {
  const serviceClient = createServiceClient();

  const { data: seasons, error } = await serviceClient
    .from('festive_seasons')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    throw new HttpError(500, `Failed to load festive seasons: ${error.message}`);
  }

  return jsonResponse({
    seasons: seasons || [],
    businessRules: {
      owambeMinDays: OWAMBE_MIN_PLANNING_DAYS,
      owambeMaxDays: OWAMBE_MAX_PLANNING_DAYS,
      gracePeriodDays: INSTALMENT_GRACE_PERIOD_DAYS,
    },
  });
}

/**
 * POST /festive/plans - Enrol in a festive plan
 */
async function handleCreatePlan(req: Request): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  const body = await req.json();
  const {
    season_id,
    basket_id,
    payment_type, // 'outright' | 'instalment'
    number_of_instalments = 1,
    preferred_delivery_date,
    collection_point_id,
    no_refund_acknowledged,
  } = body;

  if (!season_id || !basket_id || !payment_type) {
    throw new HttpError(400, 'Missing required fields: season_id, basket_id, payment_type');
  }

  if (!no_refund_acknowledged) {
    throw new HttpError(
      400,
      'Mandatory agreement required: You must acknowledge the non-refundable instalment default policy (§35).'
    );
  }

  // Fetch season
  const { data: season, error: seasonErr } = await serviceClient
    .from('festive_seasons')
    .select('*')
    .eq('id', season_id)
    .eq('is_active', true)
    .single();

  if (seasonErr || !season) {
    throw new HttpError(404, 'Active festive season not found');
  }

  // Fetch curated basket
  const { data: basket, error: basketErr } = await serviceClient
    .from('baskets')
    .select('*')
    .eq('id', basket_id)
    .eq('is_active', true)
    .single();

  if (basketErr || !basket) {
    throw new HttpError(404, 'Active basket not found');
  }

  const now = new Date();
  let targetDelivery = preferred_delivery_date ? new Date(preferred_delivery_date) : null;

  // Category specific validation
  if (season.category === 'owambe_party') {
    if (!targetDelivery) {
      throw new HttpError(400, 'Preferred delivery date is required for Owambe / Party planning');
    }
    const diffDays = Math.round((targetDelivery.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < OWAMBE_MIN_PLANNING_DAYS) {
      throw new HttpError(
        400,
        `Owambe party delivery date must be at least ${OWAMBE_MIN_PLANNING_DAYS} days (6 weeks) ahead. Selected is ${diffDays} days away.`
      );
    }
    if (diffDays > OWAMBE_MAX_PLANNING_DAYS) {
      throw new HttpError(
        400,
        `Owambe party delivery date cannot exceed ${OWAMBE_MAX_PLANNING_DAYS} days (~14 weeks) into the future. Selected is ${diffDays} days away.`
      );
    }
  } else {
    // For Christmas / Ileya with fixed delivery window
    if (season.delivery_window_start) {
      targetDelivery = targetDelivery ?? new Date(season.delivery_window_start);
    } else {
      targetDelivery = targetDelivery ?? new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
    }
  }

  const totalAmount = Number(basket.total_price);
  const numInstalments = payment_type === 'outright' ? 1 : Math.max(2, Math.min(Number(number_of_instalments), 6));

  // Generate instalment schedule
  const schedule = generateSchedule(totalAmount, numInstalments, now, targetDelivery);

  // Insert festive plan
  const { data: plan, error: planErr } = await serviceClient
    .from('festive_plans')
    .insert({
      season_id,
      user_id: userId,
      basket_id,
      payment_type,
      total_amount: totalAmount,
      paid_amount: 0.0,
      remaining_amount: totalAmount,
      currency_code: 'NGN',
      preferred_delivery_date: targetDelivery.toISOString().split('T')[0],
      collection_point_id: collection_point_id || null,
      is_fully_paid: false,
      status: 'active',
      no_refund_acknowledged: true,
    })
    .select()
    .single();

  if (planErr || !plan) {
    throw new HttpError(500, `Failed to create festive plan: ${planErr?.message}`);
  }

  // Insert instalments
  const instalmentRows = schedule.map((item) => ({
    plan_id: plan.id,
    instalment_number: item.instalmentNumber,
    amount: item.amount,
    due_date: item.dueDate,
    status: 'pending',
  }));

  const { data: insertedInstalments, error: instErr } = await serviceClient
    .from('festive_instalments')
    .insert(instalmentRows)
    .select();

  if (instErr) {
    throw new HttpError(500, `Failed to schedule instalments: ${instErr.message}`);
  }

  return jsonResponse(
    {
      plan,
      instalments: insertedInstalments,
      message:
        payment_type === 'outright'
          ? 'Festive plan created. Please proceed to complete outright payment.'
          : `Festive instalment plan created with ${numInstalments} scheduled payments.`,
    },
    201
  );
}

/**
 * GET /festive/my-plans - Customer view of enrolled plans
 */
async function handleGetMyPlans(req: Request): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  const { data: plans, error } = await serviceClient
    .from('festive_plans')
    .select(`
      *,
      season:festive_seasons(*),
      basket:baskets(*),
      collection_point:collection_points(*),
      instalments:festive_instalments(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new HttpError(500, `Failed to load user plans: ${error.message}`);
  }

  const now = new Date();
  const enrichedPlans = (plans || []).map((p) => {
    const instalments = (p.instalments || []).sort(
      (a: { instalment_number: number }, b: { instalment_number: number }) =>
        a.instalment_number - b.instalment_number
    );

    const nextDue = instalments.find((i: { status: string }) =>
      ['pending', 'overdue'].includes(i.status)
    );

    let graceRemaining: number | null = null;
    let isDefaultRisk = false;

    if (nextDue && nextDue.status === 'overdue') {
      const due = new Date(nextDue.due_date);
      const daysOverdue = Math.max(
        0,
        Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
      );
      graceRemaining = Math.max(0, INSTALMENT_GRACE_PERIOD_DAYS - daysOverdue);
      isDefaultRisk = daysOverdue > INSTALMENT_GRACE_PERIOD_DAYS;
    }

    const progressPct =
      p.total_amount > 0 ? Math.min(100, Math.round((p.paid_amount / p.total_amount) * 100)) : 0;

    return {
      ...p,
      instalments,
      nextInstalment: nextDue || null,
      progressPercentage: progressPct,
      daysRemainingInGrace: graceRemaining,
      isDefaultRisk,
    };
  });

  return jsonResponse({ plans: enrichedPlans });
}

/**
 * GET /festive/plans/:id - Plan detail
 */
async function handleGetPlanDetail(req: Request, planId: string): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  const { data: plan, error } = await serviceClient
    .from('festive_plans')
    .select(`
      *,
      season:festive_seasons(*),
      basket:baskets(*),
      collection_point:collection_points(*),
      instalments:festive_instalments(*)
    `)
    .eq('id', planId)
    .single();

  if (error || !plan) {
    throw new HttpError(404, 'Festive plan not found');
  }

  // Caller must be plan owner or admin
  if (plan.user_id !== userId) {
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      throw new HttpError(403, 'Unauthorized access to festive plan');
    }
  }

  return jsonResponse({ plan });
}

/**
 * POST /festive/pay-instalment - Pay scheduled instalment
 */
async function handlePayInstalment(req: Request): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  const body = await req.json();
  const { instalment_id, payment_method = 'wallet', wallet_amount } = body;

  if (!instalment_id) {
    throw new HttpError(400, 'Missing instalment_id');
  }

  // Fetch instalment with parent plan
  const { data: instalment, error: instErr } = await serviceClient
    .from('festive_instalments')
    .select('*, plan:festive_plans(*)')
    .eq('id', instalment_id)
    .single();

  if (instErr || !instalment) {
    throw new HttpError(404, 'Instalment not found');
  }

  if (instalment.status === 'paid') {
    throw new HttpError(400, 'Instalment has already been paid');
  }

  if (instalment.status === 'cancelled') {
    throw new HttpError(400, 'Cannot pay a cancelled instalment');
  }

  if (instalment.plan.user_id !== userId) {
    throw new HttpError(403, 'Unauthorized: This plan belongs to another user');
  }

  const amountToPay = Number(instalment.amount);

  // If wallet payment
  if (payment_method === 'wallet') {
    const { data: wallet, error: wallErr } = await serviceClient
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (wallErr || !wallet) {
      throw new HttpError(404, 'Wallet not found');
    }

    if (Number(wallet.balance) < amountToPay) {
      throw new HttpError(
        400,
        `Insufficient wallet balance (₦${Number(wallet.balance).toLocaleString()}). Required: ₦${amountToPay.toLocaleString()}`
      );
    }

    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore - amountToPay;

    // Deduct from wallet
    const { error: updErr } = await serviceClient
      .from('wallets')
      .update({ balance: balanceAfter, updated_at: new Date().toISOString() })
      .eq('id', wallet.id);

    if (updErr) {
      throw new HttpError(500, `Failed to debit wallet: ${updErr.message}`);
    }

    // Record wallet ledger transaction
    await serviceClient.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      user_id: userId,
      transaction_type: 'debit_purchase',
      entry_side: 'debit',
      amount: amountToPay,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      currency_code: 'NGN',
      description: `Payment for Festive Plan Instalment #${instalment.instalment_number}`,
      idempotency_key: `festive-${instalment.id}-${Date.now()}`,
    });
  }

  // Update instalment status to 'paid' (trigger will auto-update parent plan)
  const nowIso = new Date().toISOString();
  const { data: updatedInstalment, error: updInstErr } = await serviceClient
    .from('festive_instalments')
    .update({
      status: 'paid',
      paid_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', instalment.id)
    .select()
    .single();

  if (updInstErr) {
    throw new HttpError(500, `Failed to update instalment: ${updInstErr.message}`);
  }

  // Fetch refreshed parent plan
  const { data: refreshedPlan } = await serviceClient
    .from('festive_plans')
    .select('*')
    .eq('id', instalment.plan_id)
    .single();

  return jsonResponse({
    message: `Instalment #${instalment.instalment_number} of ₦${amountToPay.toLocaleString()} successfully paid.`,
    instalment: updatedInstalment,
    plan: refreshedPlan,
  });
}

/**
 * GET /festive/admin/plans - Admin list of festive plans with status & overdue filters
 */
async function handleAdminListPlans(req: Request, url: URL): Promise<Response> {
  await verifyAdminCaller(req);
  const serviceClient = createServiceClient();

  const seasonId = url.searchParams.get('season_id');
  const status = url.searchParams.get('status');
  const overdueOnly = url.searchParams.get('overdue') === 'true';

  let query = serviceClient
    .from('festive_plans')
    .select(`
      *,
      season:festive_seasons(*),
      basket:baskets(*),
      user:profiles(id, full_name, phone_number),
      instalments:festive_instalments(*)
    `)
    .order('created_at', { ascending: false });

  if (seasonId) query = query.eq('season_id', seasonId);
  if (status) query = query.eq('status', status);

  const { data: plans, error } = await query;
  if (error) {
    throw new HttpError(500, `Failed to fetch admin festive plans: ${error.message}`);
  }

  const now = new Date();
  let result = (plans || []).map((p) => {
    const instalments = p.instalments || [];
    const overdueInstalments = instalments.filter((i: { status: string; due_date: string }) => {
      if (i.status === 'overdue') return true;
      if (i.status === 'pending') {
        return new Date(i.due_date).getTime() < now.getTime();
      }
      return false;
    });

    const hasOverdue = overdueInstalments.length > 0;
    let maxDaysOverdue = 0;

    overdueInstalments.forEach((i: { due_date: string }) => {
      const days = Math.floor(
        (now.getTime() - new Date(i.due_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (days > maxDaysOverdue) maxDaysOverdue = days;
    });

    const isBeyondGrace = maxDaysOverdue > INSTALMENT_GRACE_PERIOD_DAYS;
    const daysRemainingInGrace = hasOverdue
      ? Math.max(0, INSTALMENT_GRACE_PERIOD_DAYS - maxDaysOverdue)
      : INSTALMENT_GRACE_PERIOD_DAYS;

    return {
      ...p,
      hasOverdue,
      maxDaysOverdue,
      isBeyondGrace,
      daysRemainingInGrace,
      overdueCount: overdueInstalments.length,
    };
  });

  if (overdueOnly) {
    result = result.filter((p) => p.hasOverdue);
  }

  return jsonResponse({ plans: result, count: result.length });
}

/**
 * POST /festive/admin/cancel-plan - Cancel defaulted plan with forfeiture
 * Spec §35 and Founder Addendum B5.
 */
async function handleAdminCancelPlan(req: Request): Promise<Response> {
  const adminId = await verifyAdminCaller(req);
  const serviceClient = createServiceClient();

  const body = await req.json();
  const { plan_id, reason = 'Instalment default beyond 7-day grace period' } = body;

  if (!plan_id) {
    throw new HttpError(400, 'Missing plan_id');
  }

  const { data: plan, error: planErr } = await serviceClient
    .from('festive_plans')
    .select('*, instalments:festive_instalments(*)')
    .eq('id', plan_id)
    .single();

  if (planErr || !plan) {
    throw new HttpError(404, 'Festive plan not found');
  }

  if (plan.status === 'cancelled') {
    throw new HttpError(400, 'Plan is already cancelled');
  }

  const nowIso = new Date().toISOString();

  // Cancel remaining pending/overdue instalments
  await serviceClient
    .from('festive_instalments')
    .update({ status: 'cancelled', updated_at: nowIso })
    .eq('plan_id', plan.id)
    .in('status', ['pending', 'overdue']);

  // Update plan to cancelled
  const { data: cancelledPlan, error: cancelErr } = await serviceClient
    .from('festive_plans')
    .update({
      status: 'cancelled',
      updated_at: nowIso,
    })
    .eq('id', plan.id)
    .select()
    .single();

  if (cancelErr) {
    throw new HttpError(500, `Failed to cancel plan: ${cancelErr.message}`);
  }

  // Log audit
  await serviceClient.from('audit_logs').insert({
    actor_id: adminId,
    actor_role: 'admin',
    action: 'festive_plan_default_cancelled',
    entity_type: 'festive_plan',
    entity_id: plan.id,
    previous_state: { status: plan.status, paid_amount: plan.paid_amount },
    new_state: {
      status: 'cancelled',
      forfeited_amount: plan.paid_amount,
      reason,
    },
    metadata: { reason, forfeiture_policy: 'Spec_35_Addendum_B5' },
  });

  return jsonResponse({
    message: `Plan #${plan.id.slice(0, 8)} cancelled. Prior paid amount of ₦${Number(plan.paid_amount).toLocaleString()} is forfeited per §35 default policy.`,
    plan: cancelledPlan,
  });
}

/**
 * POST /festive/admin/cancel-season - STAPLE emergency season cancellation with 100% wallet refund
 * Founder Addendum A2.
 */
async function handleAdminCancelSeason(req: Request): Promise<Response> {
  const adminId = await verifyAdminCaller(req);
  const serviceClient = createServiceClient();

  const body = await req.json();
  const { season_id, cancellation_reason = 'STAPLE operational season cancellation' } = body;

  if (!season_id) {
    throw new HttpError(400, 'Missing season_id');
  }

  // Verify season exists
  const { data: season, error: sErr } = await serviceClient
    .from('festive_seasons')
    .select('*')
    .eq('id', season_id)
    .single();

  if (sErr || !season) {
    throw new HttpError(404, 'Season not found');
  }

  const nowIso = new Date().toISOString();

  // Deactivate season
  await serviceClient
    .from('festive_seasons')
    .update({ is_active: false, updated_at: nowIso })
    .eq('id', season.id);

  // Fetch all active plans for this season
  const { data: activePlans, error: apErr } = await serviceClient
    .from('festive_plans')
    .select('*')
    .eq('season_id', season.id)
    .eq('status', 'active');

  if (apErr) {
    throw new HttpError(500, `Failed to load season plans: ${apErr.message}`);
  }

  let refundedUsersCount = 0;
  let totalRefundedNaira = 0;

  for (const plan of activePlans || []) {
    const paidAmount = Number(plan.paid_amount);

    if (paidAmount > 0) {
      // Fetch or create user wallet
      const { data: wallet } = await serviceClient
        .from('wallets')
        .select('*')
        .eq('user_id', plan.user_id)
        .single();

      if (wallet) {
        const balanceBefore = Number(wallet.balance);
        const balanceAfter = balanceBefore + paidAmount;

        // Credit wallet
        await serviceClient
          .from('wallets')
          .update({ balance: balanceAfter, updated_at: nowIso })
          .eq('id', wallet.id);

        // Record credit transaction
        await serviceClient.from('wallet_transactions').insert({
          wallet_id: wallet.id,
          user_id: plan.user_id,
          transaction_type: 'credit_refund',
          entry_side: 'credit',
          amount: paidAmount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          currency_code: 'NGN',
          description: `100% Refund for cancelled season: ${season.name}`,
          idempotency_key: `season-cancel-${season.id}-${plan.id}`,
          metadata: {
            refund_reason: 'festive_season_cancelled',
            season_id: season.id,
            plan_id: plan.id,
            cancellation_reason,
          },
        });

        totalRefundedNaira += paidAmount;
        refundedUsersCount++;
      }
    }

    // Cancel plan
    await serviceClient
      .from('festive_plans')
      .update({ status: 'cancelled', updated_at: nowIso })
      .eq('id', plan.id);

    // Cancel pending instalments
    await serviceClient
      .from('festive_instalments')
      .update({ status: 'cancelled', updated_at: nowIso })
      .eq('plan_id', plan.id)
      .eq('status', 'pending');
  }

  // Record audit log
  await serviceClient.from('audit_logs').insert({
    actor_id: adminId,
    actor_role: 'admin',
    action: 'festive_season_emergency_cancelled',
    entity_type: 'festive_season',
    entity_id: season.id,
    metadata: {
      refundedUsersCount,
      totalRefundedNaira,
      cancellation_reason,
    },
  });

  return jsonResponse({
    message: `Season "${season.name}" cancelled. 100% refunds credited to wallets for ${refundedUsersCount} plan(s). Total refunded: ₦${totalRefundedNaira.toLocaleString()}.`,
    refundedUsersCount,
    totalRefundedNaira,
  });
}

/**
 * Schedule generation helper
 */
function generateSchedule(
  totalAmount: number,
  numberOfInstalments: number,
  startDate: Date,
  targetDeliveryDate: Date
): Array<{ instalmentNumber: number; amount: number; dueDate: string }> {
  if (numberOfInstalments <= 1) {
    return [
      {
        instalmentNumber: 1,
        amount: totalAmount,
        dueDate: startDate.toISOString().split('T')[0],
      },
    ];
  }

  // Procurement cutoff: 7 days before delivery
  const cutoffTime = targetDeliveryDate.getTime() - 7 * 24 * 60 * 60 * 1000;
  const effectiveCutoff = cutoffTime > startDate.getTime() ? cutoffTime : targetDeliveryDate.getTime();

  const baseAmount = Math.floor(totalAmount / numberOfInstalments);
  const remainder = totalAmount - baseAmount * numberOfInstalments;

  const totalWindowMs = effectiveCutoff - startDate.getTime();
  const intervalMs = totalWindowMs / (numberOfInstalments - 1);

  const schedule: Array<{ instalmentNumber: number; amount: number; dueDate: string }> = [];

  for (let i = 0; i < numberOfInstalments; i++) {
    const isLast = i === numberOfInstalments - 1;
    const instalmentDueDate = isLast
      ? new Date(effectiveCutoff)
      : new Date(startDate.getTime() + i * intervalMs);

    const amount = isLast ? baseAmount + remainder : baseAmount;

    schedule.push({
      instalmentNumber: i + 1,
      amount,
      dueDate: instalmentDueDate.toISOString().split('T')[0],
    });
  }

  return schedule;
}
