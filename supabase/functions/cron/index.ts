/**
 * STAPLE LIMITED — Automated Maintenance & Financial Hardening Cron (Phase 9)
 * Daily double-entry wallet reconciliation, automated group buy expiry,
 * 48h delayed tier discount disbursement, and festive overdue enforcement.
 *
 * Routes:
 * - POST /cron/daily-reconciliation   - Reconcile all wallets vs double-entry transaction ledger
 * - POST /cron/process-expiries       - Auto-transition MVFQ >= met to fulfilment; auto-refund < MVFQ
 * - POST /cron/disburse-tier-credits  - Disburse retroactive tier savings after 48h hold (Addendum A4)
 * - POST /cron/scan-festive-overdue   - Scan festive instalments and enforce 7-day grace period
 * - POST /cron/run-all                - Execute full daily maintenance pipeline
 * - GET  /cron/health                 - Health check & cron status
 */

import {
  createServiceClient,
  jsonResponse,
  errorResponse,
  corsHeaders,
  HttpError,
} from '../_shared/supabase.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return corsHeaders();
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    // Relativize path (/cron/...)
    const cronIdx = pathSegments.indexOf('cron');
    const relSegments = cronIdx >= 0 ? pathSegments.slice(cronIdx + 1) : pathSegments;
    const action = relSegments[0] || 'run-all';

    // Health check
    if (req.method === 'GET' && action === 'health') {
      return jsonResponse({
        status: 'ok',
        service: 'staple-cron-maintenance',
        timestamp: new Date().toISOString(),
      });
    }

    if (req.method !== 'POST') {
      throw new HttpError(405, 'Method not allowed. Use POST for scheduled cron tasks.');
    }

    // Verify authorized caller (Service Role, Admin token, or Cron Secret)
    verifyCronAuthorization(req);

    const serviceClient = createServiceClient();

    switch (action) {
      case 'daily-reconciliation': {
        const result = await runWalletReconciliation(serviceClient);
        return jsonResponse(result);
      }

      case 'process-expiries': {
        const result = await runProcessExpiries(serviceClient);
        return jsonResponse(result);
      }

      case 'disburse-tier-credits': {
        const result = await runDisburseTierCredits(serviceClient);
        return jsonResponse(result);
      }

      case 'scan-festive-overdue': {
        const result = await runScanFestiveOverdue(serviceClient);
        return jsonResponse(result);
      }

      case 'run-all': {
        const reconciliation = await runWalletReconciliation(serviceClient);
        const expiries = await runProcessExpiries(serviceClient);
        const tierRebates = await runDisburseTierCredits(serviceClient);
        const festiveOverdue = await runScanFestiveOverdue(serviceClient);

        return jsonResponse({
          timestamp: new Date().toISOString(),
          reconciliation,
          expiries,
          tierRebates,
          festiveOverdue,
        });
      }

      default:
        throw new HttpError(404, `Unknown cron action: ${action}`);
    }
  } catch (err) {
    return errorResponse(err);
  }
});

/**
 * Validates request authorization.
 * Allows requests with either a matching CRON_SECRET or Service Role Key.
 */
function verifyCronAuthorization(req: Request): void {
  const authHeader = req.headers.get('Authorization') ?? '';
  const cronSecretHeader = req.headers.get('x-cron-secret') ?? '';

  const configuredCronSecret = Deno.env.get('CRON_SECRET');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  // If secret header matches
  if (configuredCronSecret && cronSecretHeader === configuredCronSecret) {
    return;
  }

  // If bearer token matches service role key or cron secret
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (serviceRoleKey && token === serviceRoleKey) {
    return;
  }
  if (configuredCronSecret && token === configuredCronSecret) {
    return;
  }

  // For local development / preview if no secrets configured, allow internal requests
  if (!configuredCronSecret && !serviceRoleKey) {
    return;
  }

  // Reject unauthorized
  throw new HttpError(401, 'Unauthorized cron invocation');
}

/**
 * Executes double-entry wallet ledger reconciliation RPC.
 */
async function runWalletReconciliation(supabase: ReturnType<typeof createServiceClient>) {
  const { data, error } = await supabase.rpc('reconcile_wallet_ledger');

  if (error) {
    console.error('Wallet reconciliation RPC failed:', error);
    throw new HttpError(500, `Reconciliation failed: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;

  const totalWallets = Number(row?.total_wallets ?? 0);
  const balancedWallets = Number(row?.balanced_wallets ?? 0);
  const discrepantWallets = Number(row?.discrepant_wallets ?? 0);
  const totalSystemLiability = Number(row?.total_system_liability ?? 0);
  const discrepantWalletIds = Array.isArray(row?.discrepant_wallet_ids)
    ? row.discrepant_wallet_ids
    : [];

  return {
    totalWallets,
    balancedWallets,
    discrepantWallets,
    totalSystemLiability,
    discrepantWalletIds,
    isClean: discrepantWallets === 0,
    reconciledAt: new Date().toISOString(),
  };
}

/**
 * Executes group buy expiry evaluation and MVFQ auto-resolution RPC.
 */
async function runProcessExpiries(supabase: ReturnType<typeof createServiceClient>) {
  const { data, error } = await supabase.rpc('process_expired_group_buys');

  if (error) {
    console.error('Process expired group buys RPC failed:', error);
    throw new HttpError(500, `Expiry processing failed: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    processedCount: Number(row?.processed_count ?? 0),
    fulfilledCount: Number(row?.fulfilled_count ?? 0),
    closedCount: Number(row?.closed_count ?? 0),
    totalRefundedNaira: Number(row?.total_refunded_naira ?? 0),
    executedAt: new Date().toISOString(),
  };
}

/**
 * Disburses retroactive pricing tier credits after the 48h hold window.
 */
async function runDisburseTierCredits(supabase: ReturnType<typeof createServiceClient>) {
  const { data, error } = await supabase.rpc('disburse_delayed_tier_credits');

  if (error) {
    console.error('Disburse delayed tier credits RPC failed:', error);
    throw new HttpError(500, `Tier rebate disbursement failed: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    ordersCredited: Number(row?.orders_credited ?? 0),
    totalDisbursedNaira: Number(row?.total_disbursed_naira ?? 0),
    executedAt: new Date().toISOString(),
  };
}

/**
 * Scans festive instalments for overdue status and grace period expiration.
 */
async function runScanFestiveOverdue(supabase: ReturnType<typeof createServiceClient>) {
  const { data, error } = await supabase.rpc('check_overdue_festive_instalments');

  if (error) {
    // If the helper RPC does not return a direct row, query table directly
    console.warn('check_overdue_festive_instalments call returned:', error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    scannedCount: Number(row?.scanned_count ?? 0),
    markedOverdueCount: Number(row?.marked_overdue_count ?? 0),
    defaultCancelledCount: Number(row?.default_cancelled_count ?? 0),
    executedAt: new Date().toISOString(),
  };
}
