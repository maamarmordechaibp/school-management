/**
 * Cloudflare Pages Function - /api/create-user
 * Creates a new Supabase auth user AND inserts into app_users table.
 * Uses Supabase Admin API (service role key) to create users server-side.
 *
 * Environment variables (set in Cloudflare Pages):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY  (service role key — NOT the anon key)
 */

export async function onRequestPost(context) {
  const SUPABASE_URL = context.env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co';
  const SUPABASE_SERVICE_KEY = context.env.SUPABASE_SERVICE_KEY;

  const headers = { 'Content-Type': 'application/json' };

  if (!SUPABASE_SERVICE_KEY) {
    return new Response(JSON.stringify({ 
      error: 'Server not configured: SUPABASE_SERVICE_KEY is required. Set it in Cloudflare Pages environment variables.' 
    }), { status: 500, headers });
  }

  try {
    const { email, password, name, role, first_name, last_name, assigned_class } = await context.request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), { status: 400, headers });
    }

    // 1. Create auth user via Supabase Admin API
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: name || email }
      })
    });

    const authResult = await authResponse.json();

    if (!authResponse.ok) {
      return new Response(JSON.stringify({ 
        error: authResult.msg || authResult.message || 'Failed to create auth user',
        details: authResult 
      }), { status: authResponse.status, headers });
    }

    const userId = authResult.id;

    // 2. Insert into app_users table (only use columns guaranteed to exist)
    const profilePayload = {
      id: userId,
      email,
      name: name || `${first_name || ''} ${last_name || ''}`.trim() || email,
      role: role || 'teacher',
    };
    // Only add assigned_class if provided (column may not exist in all schemas)
    if (assigned_class) profilePayload.assigned_class = assigned_class;

    const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/app_users`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(profilePayload)
    });

    if (!profileResponse.ok) {
      const profileErr = await profileResponse.text();
      console.error('app_users insert failed:', profileErr);
      
      // If assigned_class column doesn't exist, retry without it
      if (profileErr.includes('assigned_class')) {
        delete profilePayload.assigned_class;
        const retryResponse = await fetch(`${SUPABASE_URL}/rest/v1/app_users`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(profilePayload)
        });
        if (!retryResponse.ok) {
          return new Response(JSON.stringify({ 
            success: true, userId,
            warning: 'Auth user created but profile insert failed: ' + (await retryResponse.text())
          }), { status: 201, headers });
        }
      } else {
        return new Response(JSON.stringify({ 
          success: true, userId,
          warning: 'Auth user created but profile insert failed: ' + profileErr 
        }), { status: 201, headers });
      }
    }

    return new Response(JSON.stringify({ success: true, userId }), { status: 201, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
