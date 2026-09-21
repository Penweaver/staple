/**
 * STAPLE LIMITED — Idempotency Engine (Spec §75)
 * Guards all payment, order, and wallet operations against duplicate execution
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { HttpError } from './supabase.ts';

export async function withIdempotency<T>(
  supabase: SupabaseClient,
  key: string,
  handler: () => Promise<T>,
): Promise<T> {
  if (!key) {
    return await handler();
  }

  // 1. Check existing record
  const { data: existing, error: checkError } = await supabase
    .from('idempotency_records')
    .select('status, response')
    .eq('key', key)
    .single();

  if (existing) {
    if (existing.status === 'completed' && existing.response) {
      return existing.response as T;
    }
    if (existing.status === 'processing') {
      throw new HttpError(409, 'Concurrent request in progress for this idempotency key. Please retry.');
    }
  }

  // 2. Insert processing record
  const { error: insertError } = await supabase
    .from('idempotency_records')
    .insert({
      key,
      status: 'processing',
      created_at: new Date().toISOString(),
    });

  if (insertError && insertError.code === '23505') {
    throw new HttpError(409, 'Duplicate request detected.');
  }

  // 3. Execute payload
  try {
    const result = await handler();

    // 4. Update to completed
    await supabase
      .from('idempotency_records')
      .update({
        status: 'completed',
        response: result as Record<string, unknown>,
      })
      .eq('key', key);

    return result;
  } catch (err) {
    // On failure, update or remove key so user can retry
    await supabase
      .from('idempotency_records')
      .update({ status: 'failed' })
      .eq('key', key);

    throw err;
  }
}
