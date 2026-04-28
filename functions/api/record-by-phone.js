/**
 * Cloudflare Pages Function — /api/record-by-phone
 *
 * Triggers an outbound call to the AP's phone with a TwiML <Record> verb.
 * The AP picks up, hears "Please record your message after the beep, press
 * pound when done", records, then SignalWire POSTs the recording to
 * /api/recording-callback which downloads + stores it in Supabase Storage.
 *
 * Env vars (Cloudflare Pages):
 *   SIGNALWIRE_PROJECT_ID
 *   SIGNALWIRE_API_TOKEN
 *   SIGNALWIRE_SPACE_URL
 *   SIGNALWIRE_FROM_NUMBER
 *   RECORDING_WEBHOOK_SECRET   (random string used to sign callback URLs)
 *
 * Body:
 *   { to: "+18455551234", label?: "Tuesday's snow-day notice" }
 */

import { requireRole, rateLimit, logAudit, ADMIN_ROLES } from '../_lib/auth.js';

function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function toE164(raw) {
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

// HMAC-SHA256 sign helper
async function sign(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
  const headers = { 'Content-Type': 'application/json' };

  const PROJECT_ID = context.env.SIGNALWIRE_PROJECT_ID;
  const API_TOKEN = context.env.SIGNALWIRE_API_TOKEN;
  const SPACE_URL = context.env.SIGNALWIRE_SPACE_URL;
  const FROM_NUMBER = context.env.SIGNALWIRE_FROM_NUMBER;
  const WEBHOOK_SECRET = context.env.RECORDING_WEBHOOK_SECRET;

  if (!PROJECT_ID || !API_TOKEN || !SPACE_URL || !FROM_NUMBER) {
    return new Response(JSON.stringify({ error: 'SignalWire credentials not configured.' }), { status: 500, headers });
  }
  if (!WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'RECORDING_WEBHOOK_SECRET not configured.' }), { status: 500, headers });
  }

  // --- Auth: principals/admins only ---
  const auth = await requireRole(context, 'record-by-phone', ADMIN_ROLES);
  if (auth.response) return auth.response;
  const { user, role } = auth;

  // --- Rate limit: 10 / 5 min / user ---
  const rl = rateLimit(context, user.id, 10, 5 * 60 * 1000);
  if (!rl.ok) {
    await logAudit(context, { endpoint: 'record-by-phone', caller_user_id: user.id, caller_email: user.email, caller_role: role, status: 'denied', status_code: 429, reason: 'rate_limited' });
    return new Response(JSON.stringify({ error: 'Too many requests', retryAfter: rl.retryAfter }), { status: 429, headers: { ...headers, 'Retry-After': String(rl.retryAfter) } });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers });
  }

  const e164 = toE164(body?.to);
  if (!e164) {
    return new Response(JSON.stringify({ error: 'Invalid phone number' }), { status: 400, headers });
  }

  const label = (body?.label || `Recording ${new Date().toISOString().slice(0, 19)}`).slice(0, 120);

  // Sign a token: userId|timestamp|label  → HMAC. Callback verifies.
  const ts = Date.now();
  const payload = `${user.id}|${ts}|${label}`;
  const sig = await sign(WEBHOOK_SECRET, payload);
  const token = `${ts}.${encodeURIComponent(label)}.${sig}`;

  // Determine callback host. Prefer the same origin we received this request on.
  const reqUrl = new URL(context.request.url);
  const callbackBase = `${reqUrl.protocol}//${reqUrl.host}`;
  const actionUrl =
    `${callbackBase}/api/recording-callback` +
    `?u=${encodeURIComponent(user.id)}` +
    `&t=${encodeURIComponent(token)}`;

  // TwiML: greet, record, hang up.
  const twiml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Response>` +
      `<Pause length="1"/>` +
      `<Say voice="Polly.Joanna" language="en-US">` +
        `Hello. Please record your announcement after the beep. Press pound when you are done. ` +
        `You will hear a confirmation, then the call will end.` +
      `</Say>` +
      `<Record action="${escapeXml(actionUrl)}" method="POST" maxLength="180" finishOnKey="#" playBeep="true"/>` +
      `<Say voice="Polly.Joanna" language="en-US">We did not detect a recording. Please try again. Goodbye.</Say>` +
      `<Hangup/>` +
    `</Response>`;

  const callsUrl = `https://${SPACE_URL}/api/laml/2010-04-01/Accounts/${PROJECT_ID}/Calls.json`;
  const basicAuth = 'Basic ' + btoa(`${PROJECT_ID}:${API_TOKEN}`);

  try {
    const params = new URLSearchParams();
    params.set('To', e164);
    params.set('From', FROM_NUMBER);
    params.set('Twiml', twiml);

    const resp = await fetch(callsUrl, {
      method: 'POST',
      headers: { 'Authorization': basicAuth, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      await logAudit(context, { endpoint: 'record-by-phone', caller_user_id: user.id, caller_email: user.email, caller_role: role, status: 'error', status_code: 502, reason: data?.message || 'signalwire_error' });
      return new Response(JSON.stringify({ error: data?.message || data?.error_message || `HTTP ${resp.status}` }), { status: 502, headers });
    }

    await logAudit(context, { endpoint: 'record-by-phone', caller_user_id: user.id, caller_email: user.email, caller_role: role, status: 'allowed', status_code: 200, reason: 'ok', request_meta: { to: e164, label } });
    return new Response(JSON.stringify({ success: true, sid: data.sid, label, message: 'Calling now — pick up your phone.' }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
