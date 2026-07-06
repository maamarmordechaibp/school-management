/**
 * Cloudflare Pages Function - /api/delete-user
 * Removes a user completely: deletes their app_users profile AND their
 * Supabase auth login, using the service-role key (bypasses RLS).
 *
 * A plain client-side `supabase.from('app_users').delete()` fails when the
 * user is referenced by other rows (teacher_id, created_by, logged_by, …) and
 * — even when it succeeds — leaves the auth.users login intact, so the person
 * could still sign in. This endpoint handles both correctly.
 *
 * Environment variables (set in Cloudflare Pages):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY  (service role key — NOT the anon key)
 */

import { requireRole, logAudit, ADMIN_ROLES } from '../_lib/auth.js';

export async function onRequestPost(context) {
  const SUPABASE_URL = context.env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co';
  const SUPABASE_SERVICE_KEY = context.env.SUPABASE_SERVICE_KEY;

  const headers = { 'Content-Type': 'application/json' };

  if (!SUPABASE_SERVICE_KEY) {
    return new Response(JSON.stringify({
      error: 'Server not configured: SUPABASE_SERVICE_KEY is required. Set it in Cloudflare Pages environment variables.'
    }), { status: 500, headers });
  }

  // --- Auth gate: admin/principal only ---
  const auth = await requireRole(context, 'delete-user', ADMIN_ROLES);
  if (auth.response) return auth.response;
  const { user: caller, role: callerRole } = auth;

  try {
    const { userId } = await context.request.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400, headers });
    }

    // Never let an admin delete their own account out from under themselves.
    if (userId === caller.id) {
      return new Response(JSON.stringify({ error: 'You cannot delete your own account.' }), { status: 400, headers });
    }

    const svcHeaders = {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    };

    // 1. Delete the app_users profile row. Service role bypasses RLS, and
    //    migration 040 makes all referencing FKs ON DELETE SET NULL.
    const profileResp = await fetch(`${SUPABASE_URL}/rest/v1/app_users?id=eq.${userId}`, {
      method: 'DELETE',
      headers: { ...svcHeaders, 'Prefer': 'return=minimal' },
    });

    if (!profileResp.ok) {
      const errText = await profileResp.text();
      await logAudit(context, { endpoint: 'delete-user', caller_user_id: caller.id, caller_email: caller.email, caller_role: callerRole, status: 'error', status_code: profileResp.status, reason: 'profile_delete_failed', request_meta: { target_user_id: userId } });
      return new Response(JSON.stringify({
        error: 'Could not remove the user profile. It is still referenced by other records. ' + errText,
        details: errText,
      }), { status: profileResp.status, headers });
    }

    // 2. Delete the auth login so they can no longer sign in. If they only
    //    existed as a profile (no auth account), a 404 here is harmless.
    const authResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: svcHeaders,
    });

    let authWarning = null;
    if (!authResp.ok && authResp.status !== 404) {
      authWarning = await authResp.text();
      console.warn('auth user delete failed:', authWarning);
    }

    await logAudit(context, { endpoint: 'delete-user', caller_user_id: caller.id, caller_email: caller.email, caller_role: callerRole, status: 'allowed', status_code: 200, reason: 'ok', request_meta: { target_user_id: userId, auth_warning: authWarning } });

    return new Response(JSON.stringify({
      success: true,
      ...(authWarning ? { warning: 'Profile removed, but the auth login could not be deleted: ' + authWarning } : {}),
    }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
