/**
 * Shared auth/audit helpers for Cloudflare Pages Functions.
 *
 * - requireAuth(context): verifies the caller's Supabase JWT and returns
 *   { user, role, profile } or a 401/403 Response.
 * - requireRole(context, allowedRoles): same as above but additionally
 *   enforces the caller's role.
 * - logAudit(context, entry): inserts a row into api_audit_log via
 *   service-role REST. Best-effort; never throws.
 *
 * Endpoints should call requireRole() at the top and bail out with the
 * returned Response if it's not undefined.
 */

const STANDARD_HEADERS = { 'Content-Type': 'application/json' };

function getEnv(context) {
  const SUPABASE_URL = context.env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co';
  const SUPABASE_SERVICE_KEY = context.env.SUPABASE_SERVICE_KEY || context.env.SUPABASE_ANON_KEY;
  return { SUPABASE_URL, SUPABASE_SERVICE_KEY };
}

function getAuthToken(request) {
  const header = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function clientIp(request) {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')
    || null;
}

/**
 * Insert an audit row. Failures are swallowed (logging must never break the API).
 */
export async function logAudit(context, entry) {
  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = getEnv(context);
    if (!SUPABASE_SERVICE_KEY) return;
    await fetch(`${SUPABASE_URL}/rest/v1/api_audit_log`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        endpoint: entry.endpoint,
        caller_user_id: entry.caller_user_id || null,
        caller_email: entry.caller_email || null,
        caller_role: entry.caller_role || null,
        status: entry.status,
        status_code: entry.status_code || null,
        reason: entry.reason || null,
        request_meta: entry.request_meta || {},
        ip: clientIp(context.request),
        user_agent: context.request.headers.get('user-agent') || null,
      }),
    });
  } catch (err) {
    console.warn('audit log failed:', err);
  }
}

/**
 * Verify the caller's JWT against Supabase /auth/v1/user, then look up their
 * row in app_users to discover the role.
 */
export async function requireAuth(context, endpoint) {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = getEnv(context);
  const token = getAuthToken(context.request);

  if (!token) {
    await logAudit(context, { endpoint, status: 'denied', status_code: 401, reason: 'missing_jwt' });
    return {
      response: new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: STANDARD_HEADERS }),
    };
  }

  // 1) Verify JWT with Supabase
  let user = null;
  try {
    const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!userResp.ok) {
      await logAudit(context, { endpoint, status: 'denied', status_code: 401, reason: 'invalid_jwt' });
      return {
        response: new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: STANDARD_HEADERS }),
      };
    }
    user = await userResp.json();
  } catch (err) {
    await logAudit(context, { endpoint, status: 'error', status_code: 500, reason: 'jwt_verify_failed' });
    return {
      response: new Response(JSON.stringify({ error: 'Auth verification failed' }), { status: 500, headers: STANDARD_HEADERS }),
    };
  }

  // 2) Look up role in app_users
  let role = null;
  try {
    const profileResp = await fetch(
      `${SUPABASE_URL}/rest/v1/app_users?id=eq.${user.id}&select=id,email,role&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    if (profileResp.ok) {
      const rows = await profileResp.json();
      if (rows && rows[0]) role = rows[0].role;
    }
  } catch (err) {
    console.warn('role lookup failed:', err);
  }

  return { user, role };
}

/**
 * Higher-level wrapper: verify auth AND require a role.
 * Returns either:
 *   { response: Response }  → caller should `return response`
 *   { user, role }          → caller may proceed
 */
export async function requireRole(context, endpoint, allowedRoles) {
  const auth = await requireAuth(context, endpoint);
  if (auth.response) return auth;

  const { user, role } = auth;
  if (!allowedRoles || allowedRoles.length === 0) {
    return { user, role };
  }
  if (!role || !allowedRoles.includes(role)) {
    await logAudit(context, {
      endpoint,
      caller_user_id: user?.id,
      caller_email: user?.email,
      caller_role: role,
      status: 'denied',
      status_code: 403,
      reason: 'forbidden_role',
      request_meta: { required_roles: allowedRoles },
    });
    return {
      response: new Response(JSON.stringify({ error: 'Forbidden: insufficient role' }), { status: 403, headers: STANDARD_HEADERS }),
    };
  }
  return { user, role };
}

// ----- Simple in-memory rate limiter (per-isolate, best-effort) -----
const rateBuckets = new Map();

/**
 * Returns { ok: true } or { ok: false, retryAfter } if the caller has exceeded
 * `max` calls within `windowMs`. Keyed by user id (or IP fallback).
 */
export function rateLimit(context, key, max, windowMs) {
  const now = Date.now();
  const bucketKey = `${context.functionPath || 'fn'}::${key}`;
  const bucket = rateBuckets.get(bucketKey) || { count: 0, resetAt: now + windowMs };
  if (now >= bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  rateBuckets.set(bucketKey, bucket);
  if (bucket.count > max) {
    return { ok: false, retryAfter: Math.max(1, Math.round((bucket.resetAt - now) / 1000)) };
  }
  return { ok: true };
}

export const ADMIN_ROLES = ['admin', 'principal', 'principal_hebrew', 'principal_english'];
export const STAFF_ROLES = [
  'admin', 'principal', 'principal_hebrew', 'principal_english',
  'teacher', 'teacher_hebrew', 'teacher_english',
  'tutor', 'special_ed',
];
