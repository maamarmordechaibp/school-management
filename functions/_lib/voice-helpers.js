/**
 * Shared helpers for the inbound voice Functions (functions/api/voice/*).
 *
 * - escapeXml / toE164: same conventions as send-call.js.
 * - SignalWire webhook signature validation (Twilio-compatible
 *   X-Twilio-Signature: HMAC-SHA1 of URL + sorted POST params, base64).
 * - LaML builders + Supabase service-role REST helpers.
 */

export function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function toE164(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '');
    return digits.length >= 10 ? `+${digits}` : null;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

/** Wrap LaML XML in a proper text/xml Response. */
export function laml(inner) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`;
  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}

/** <Say> text OR <Play> an audio URL, depending on which is provided. */
export function sayOrPlay({ audioUrl, text, voice = 'Polly.Joanna', language = 'en-US' }) {
  if (audioUrl) return `<Play>${escapeXml(audioUrl)}</Play>`;
  if (text) return `<Say voice="${escapeXml(voice)}" language="${escapeXml(language)}">${escapeXml(text)}</Say>`;
  return '';
}

// ---------- Supabase service-role REST ----------
function sbEnv(env) {
  const url = env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co';
  const key = env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY;
  return { url, key };
}

export async function sbSelect(env, path) {
  const { url, key } = sbEnv(env);
  const resp = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!resp.ok) return [];
  return resp.json().catch(() => []);
}

export async function sbInsert(env, table, row, prefer = 'return=representation') {
  const { url, key } = sbEnv(env);
  const resp = await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: prefer,
    },
    body: JSON.stringify(row),
  });
  if (!resp.ok) return null;
  if (prefer.includes('minimal')) return true;
  const data = await resp.json().catch(() => null);
  return Array.isArray(data) ? data[0] : data;
}

export async function sbUpdate(env, table, filter, patch) {
  const { url, key } = sbEnv(env);
  const resp = await fetch(`${url}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  });
  return resp.ok;
}

// ---------- SignalWire / Twilio webhook signature validation ----------
async function hmacSha1Base64(key, message) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
  // base64 encode
  let binary = '';
  const bytes = new Uint8Array(sig);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/**
 * Validate an incoming SignalWire webhook. Returns { ok, params }.
 *
 * Twilio-compatible scheme: signature = base64(HMAC-SHA1(authToken,
 *   fullUrl + concat(sortedParamName + paramValue))).
 *
 * If SIGNALWIRE_WEBHOOK_TOKEN is not configured, validation is skipped
 * (ok:true) but the parsed params are still returned — so the system works in
 * dev/initial setup while remaining secure once the token is set.
 */
export async function validateAndParse(context) {
  const token =
    context.env.SIGNALWIRE_WEBHOOK_TOKEN ||
    context.env.SIGNALWIRE_API_TOKEN; // SignalWire signs with the project auth token

  let params = {};
  try {
    const form = await context.request.formData();
    for (const [k, v] of form.entries()) params[k] = typeof v === 'string' ? v : '';
  } catch {
    params = {};
  }

  if (!token) return { ok: true, params, unverified: true };

  const signature =
    context.request.headers.get('x-twilio-signature') ||
    context.request.headers.get('X-Twilio-Signature');
  if (!signature) return { ok: false, params };

  // Twilio concatenates the exact URL the webhook was configured with. Use the
  // request URL (Cloudflare preserves it). Strip any cache-busting we didn't add.
  const url = context.request.url;
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const k of sortedKeys) data += k + params[k];

  let expected;
  try {
    expected = await hmacSha1Base64(token, data);
  } catch {
    return { ok: false, params };
  }
  return { ok: expected === signature, params };
}
