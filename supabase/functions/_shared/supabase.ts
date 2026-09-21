/**
 * STAPLE LIMITED — Shared Supabase Client & Auth Helpers
 * Used by all Supabase Edge Functions (Deno runtime)
 *
 * NOTE: In Supabase Edge Functions, the Supabase client is created per-request
 * using the Authorization header from the incoming request for RLS enforcement.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/** Environment variable keys set by Supabase platform */
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/**
 * Create a Supabase client authenticated as the requesting user.
 * This enforces RLS policies based on the user's JWT.
 */
export function createUserClient(req: Request): SupabaseClient {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new HttpError(401, 'Missing Authorization header');
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: authHeader },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create a Supabase client with service role privileges (bypasses RLS).
 * Use sparingly — only for admin operations and system-level queries.
 */
export function createServiceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Extract the authenticated user's ID from the request.
 * Throws 401 if not authenticated.
 */
export async function getAuthenticatedUserId(supabase: SupabaseClient): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new HttpError(401, 'Not authenticated');
  }
  return user.id;
}

/**
 * Check if the authenticated user has admin/super_admin role.
 */
export async function requireAdmin(supabase: SupabaseClient): Promise<string> {
  const userId = await getAuthenticatedUserId(supabase);
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new HttpError(403, 'Profile not found');
  }
  if (profile.role !== 'admin' && profile.role !== 'super_admin') {
    throw new HttpError(403, 'Admin access required');
  }
  return userId;
}

/**
 * Standard HTTP error class for Edge Functions.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Standard JSON response helpers.
 */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return jsonResponse(
      { error: error.name, message: error.message, status: error.status },
      error.status,
    );
  }
  console.error('Unhandled error:', error);
  return jsonResponse(
    { error: 'InternalServerError', message: 'An unexpected error occurred', status: 500 },
    500,
  );
}

/**
 * CORS preflight handler for Edge Functions.
 */
export function corsHeaders(): Response {
  return new Response('ok', {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}
