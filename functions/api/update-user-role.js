/**
 * Cloudflare Pages Function - /api/update-user-role
 * Updates a user's role and assigned_class in app_users.
 */

import { requireRole, logAudit, ADMIN_ROLES } from '../_lib/auth.js';

export async function onRequestPost(context) {
  const SUPABASE_URL = context.env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co';
  const SUPABASE_SERVICE_KEY = context.env.SUPABASE_SERVICE_KEY;

  const headers = { 'Content-Type': 'application/json' };

  if (!SUPABASE_SERVICE_KEY) {
    return new Response(JSON.stringify({ error: 'SUPABASE_SERVICE_KEY not configured' }), { status: 500, headers });
  }

  // --- Auth gate: admin/principal only ---
  const auth = await requireRole(context, 'update-user-role', ADMIN_ROLES);
  if (auth.response) return auth.response;
  const { user: caller, role: callerRole } = auth;

  try {
    const { userId, role, assigned_class } = await context.request.json();

    if (!userId || !role) {
      return new Response(JSON.stringify({ error: 'userId and role are required' }), { status: 400, headers });
    }

    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/app_users?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        role,
        assigned_class: assigned_class || null
      })
    });

    if (!updateResponse.ok) {
      const errText = await updateResponse.text();
      await logAudit(context, { endpoint: 'update-user-role', caller_user_id: caller.id, caller_email: caller.email, caller_role: callerRole, status: 'error', status_code: updateResponse.status, reason: 'update_failed', request_meta: { target_user_id: userId, target_role: role } });
      return new Response(JSON.stringify({ error: errText || 'Failed to update role' }), { status: updateResponse.status, headers });
    }

    await logAudit(context, { endpoint: 'update-user-role', caller_user_id: caller.id, caller_email: caller.email, caller_role: callerRole, status: 'allowed', status_code: 200, reason: 'ok', request_meta: { target_user_id: userId, target_role: role } });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
