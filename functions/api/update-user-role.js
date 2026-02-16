/**
 * Cloudflare Pages Function - /api/update-user-role
 * Updates a user's role and assigned_class in app_users.
 */

export async function onRequestPost(context) {
  const SUPABASE_URL = context.env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co';
  const SUPABASE_SERVICE_KEY = context.env.SUPABASE_SERVICE_KEY;

  const headers = { 'Content-Type': 'application/json' };

  if (!SUPABASE_SERVICE_KEY) {
    return new Response(JSON.stringify({ error: 'SUPABASE_SERVICE_KEY not configured' }), { status: 500, headers });
  }

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
      return new Response(JSON.stringify({ error: errText || 'Failed to update role' }), { status: updateResponse.status, headers });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
