/**
 * Shared helpers for the principal call-in voice-broadcast flow
 * (functions/api/voice/admin.js).
 *
 * Responsibilities:
 *   - signSession / verifySession: tamper-proof state carried through the
 *     multi-step IVR (admin identity + expiry, bound to the CallSid). This is
 *     what locks the flow: a forged POST to a later step (e.g. "send") without
 *     a valid signed session is rejected, so only an authenticated principal
 *     can reach the send step.
 *   - resolveRecipients: calls the resolve_broadcast_recipients RPC.
 *   - sendBroadcast: fans the recorded message out to a group via SignalWire
 *     and logs every call to call_log (related_type 'mass_call' so it appears
 *     in the website history + the "press to hear recent messages" callback).
 *   - audience labels + storage URL validation.
 */

// The secret used to sign the IVR session. Prefer a dedicated secret, fall
// back to the recording webhook secret, then the SignalWire API token (always
// present), so the flow is secure without extra configuration.
function sessionSecret(env) {
  return (
    env.PHONE_ADMIN_SECRET ||
    env.RECORDING_WEBHOOK_SECRET ||
    env.SIGNALWIRE_API_TOKEN ||
    'insecure-fallback-secret'
  );
}

const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes

async function hmacHex(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function b64urlEncode(obj) {
  const json = JSON.stringify(obj);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(escape(atob(padded)));
  return JSON.parse(json);
}

/**
 * Build a signed session token. `payload` = { adminId, name, authMethod,
 * appUserId, callSid }. Adds an expiry and an HMAC over the encoded body.
 */
export async function signSession(env, payload) {
  const body = { ...payload, exp: Date.now() + SESSION_TTL_MS };
  const encoded = b64urlEncode(body);
  const sig = await hmacHex(sessionSecret(env), encoded);
  return `${encoded}.${sig}`;
}

/** Verify a session token. Returns the payload or null. */
export async function verifySession(env, token, callSid) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;
  let expected;
  try {
    expected = await hmacHex(sessionSecret(env), encoded);
  } catch {
    return null;
  }
  // Constant-time-ish comparison.
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0) return null;

  let body;
  try {
    body = b64urlDecode(encoded);
  } catch {
    return null;
  }
  if (!body || typeof body.exp !== 'number' || Date.now() > body.exp) return null;
  // Bind to the originating call so a token can't be replayed on another call.
  if (callSid && body.callSid && body.callSid !== callSid) return null;
  return body;
}

// ---------- Supabase service-role RPC ----------
function sbEnv(env) {
  const url = env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co';
  const key = env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY;
  return { url, key };
}

async function sbRpc(env, fn, args) {
  const { url, key } = sbEnv(env);
  const resp = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args || {}),
  });
  if (!resp.ok) return null;
  return resp.json().catch(() => null);
}

/** Resolve a group → array of E.164 phone strings (deduped). */
export async function resolveRecipients(env, { audienceType, audienceId, audienceText, contactType }) {
  const rows = await sbRpc(env, 'resolve_broadcast_recipients', {
    p_audience_type: audienceType,
    p_audience_id: audienceId || null,
    p_audience_text: audienceText || null,
    p_contact_type: contactType || 'primary',
  });
  if (!Array.isArray(rows)) return [];
  // RPC returning TABLE(phone text) → [{ phone: '+1...' }]
  return rows
    .map((r) => (typeof r === 'string' ? r : r?.phone))
    .filter((p) => typeof p === 'string' && p.length >= 11);
}

/** Human label for the audit log / spoken confirmation. */
export function audienceLabel({ audienceType, audienceName }) {
  switch (audienceType) {
    case 'all_parents': return 'All parents';
    case 'grade': return `${audienceName || 'Grade'} — Parents`;
    case 'class': return `${audienceName || 'Class'} — Parents`;
    case 'staff_all': return 'All staff';
    case 'staff_position': return `Staff — ${audienceName || 'Position'}`;
    default: return 'Recipients';
  }
}

/**
 * Only allow audio that we ourselves stored in the public call-audio bucket.
 * Prevents a forged request from making the school robocall parents with an
 * arbitrary external <Play> URL.
 */
export function isOwnStorageUrl(env, audioUrl) {
  if (!audioUrl) return false;
  const base = (env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co').replace(/\/+$/, '');
  const prefix = `${base}/storage/v1/object/public/call-audio/`;
  return String(audioUrl).startsWith(prefix);
}

function normalizeSpaceHost(raw) {
  return String(raw || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/**
 * Fan the recorded message out to every number in `numbers` via the
 * SignalWire LaML REST API (same approach as /api/send-call), log each call to
 * call_log, and update the phone_broadcasts row. Designed to be run in
 * context.waitUntil() so the caller isn't held on the line.
 */
export async function sendBroadcast(env, { numbers, audioUrl, broadcastId, sentBy }) {
  const PROJECT_ID = env.SIGNALWIRE_PROJECT_ID;
  const API_TOKEN = env.SIGNALWIRE_API_TOKEN;
  const SPACE_HOST = normalizeSpaceHost(env.SIGNALWIRE_SPACE_URL);
  const FROM = env.SIGNALWIRE_FROM_NUMBER;
  const { url: SUPABASE_URL, key: SERVICE_KEY } = sbEnv(env);

  if (!PROJECT_ID || !API_TOKEN || !SPACE_HOST || !FROM || !audioUrl) {
    await patchBroadcast(env, broadcastId, { status: 'failed' });
    return;
  }

  const callsUrl = `https://${SPACE_HOST}/api/laml/2010-04-01/Accounts/${PROJECT_ID}/Calls.json`;
  const basicAuth = 'Basic ' + btoa(`${PROJECT_ID}:${API_TOKEN}`);

  const twiml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Response>` +
      `<Pause length="1"/>` +
      `<Play>${escapeXml(audioUrl)}</Play>` +
      `<Pause length="1"/>` +
      `<Play>${escapeXml(audioUrl)}</Play>` +
    `</Response>`;

  let ok = 0;
  let failed = 0;

  for (const to of numbers) {
    try {
      const params = new URLSearchParams();
      params.set('To', to);
      params.set('From', FROM);
      params.set('Twiml', twiml);

      const resp = await fetch(callsUrl, {
        method: 'POST',
        headers: { Authorization: basicAuth, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const data = resp.ok ? await resp.json().catch(() => ({})) : {};
      if (resp.ok) ok++; else failed++;

      // Log to call_log so the website history + the "recent messages" callback
      // (recordings.js looks for related_type=mass_call with an [audio] url) see it.
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/call_log`, {
          method: 'POST',
          headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            recipient: to,
            message: `[audio] ${audioUrl}`,
            provider: 'signalwire',
            provider_sid: data?.sid || null,
            status: resp.ok ? 'queued' : 'failed',
            related_type: 'mass_call',
            related_id: broadcastId || null,
            sent_by: sentBy || null,
          }),
        });
      } catch { /* ignore log failure */ }
    } catch {
      failed++;
    }
  }

  await patchBroadcast(env, broadcastId, {
    ok_count: ok,
    failed_count: failed,
    status: failed > 0 && ok === 0 ? 'failed' : 'completed',
  });
}

async function patchBroadcast(env, id, patch) {
  if (!id) return;
  const { url, key } = sbEnv(env);
  try {
    await fetch(`${url}/rest/v1/phone_broadcasts?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(patch),
    });
  } catch { /* ignore */ }
}

/** Create the phone_broadcasts audit row; returns its id (or null). */
export async function logBroadcastStart(env, row) {
  const { url, key } = sbEnv(env);
  try {
    const resp = await fetch(`${url}/rest/v1/phone_broadcasts`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(row),
    });
    if (!resp.ok) return null;
    const data = await resp.json().catch(() => null);
    return Array.isArray(data) ? data[0]?.id : data?.id;
  } catch {
    return null;
  }
}
