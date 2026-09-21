/**
 * STAPLE LIMITED — Anti-Gaming Payment Fingerprint Engine (Addendum A4)
 * Detects card/account fingerprint reuse across different user profiles to prevent cartel gaming
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface FingerprintCollision {
  fingerprint: string;
  userIds: string[];
  collisionCount: number;
}

/**
 * Extract payment fingerprint from Paystack charge payload
 */
export function extractPaystackFingerprint(payload: any): string | null {
  return (
    payload?.data?.authorization?.signature ||
    payload?.data?.authorization?.bin ||
    payload?.data?.customer?.customer_code ||
    null
  );
}

/**
 * Check if a payment fingerprint is shared by multiple users
 */
export async function checkFingerprintCollisions(
  supabase: SupabaseClient,
  fingerprint: string,
  currentUserId: string,
): Promise<{ hasCollision: boolean; conflictingUserIds: string[] }> {
  if (!fingerprint) return { hasCollision: false, conflictingUserIds: [] };

  const { data: rows, error } = await supabase
    .from('payment_transactions')
    .select('user_id')
    .eq('payment_fingerprint', fingerprint)
    .neq('user_id', currentUserId);

  if (error || !rows) {
    return { hasCollision: false, conflictingUserIds: [] };
  }

  const conflictingUsers = Array.from(new Set(rows.map((r: any) => r.user_id)));

  return {
    hasCollision: conflictingUsers.length > 0,
    conflictingUserIds: conflictingUsers,
  };
}

/**
 * Record an anti-gaming audit event if fingerprint collision occurs
 */
export async function auditFingerprintCollision(
  supabase: SupabaseClient,
  params: {
    fingerprint: string;
    currentUserId: string;
    conflictingUserIds: string[];
    orderId: string;
  },
) {
  const { fingerprint, currentUserId, conflictingUserIds, orderId } = params;

  await supabase.from('audit_logs').insert({
    actor_id: currentUserId,
    action: 'anti_gaming_fingerprint_collision',
    entity_type: 'payment_transactions',
    entity_id: orderId,
    details: {
      fingerprint,
      current_user: currentUserId,
      conflicting_users: conflictingUserIds,
      severity: 'WARNING',
      action_taken: 'pricing_tier_wallet_credits_held_48h',
    },
  });
}
