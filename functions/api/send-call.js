/**
 * Cloudflare Pages Function — /api/send-call
 *
 * Places an outbound voice call via SignalWire LaML REST API
 * (Twilio-compatible) using inline TwiML <Say> for text-to-speech.
 *
 * Required environment variables (set in Cloudflare Pages → Settings → Env Vars):
 *   SIGNALWIRE_PROJECT_ID    (e.g. 0279ca68-442b-47a8-...)
 *   SIGNALWIRE_API_TOKEN     (e.g. PT3048d6e...)  ← keep secret
 *   SIGNALWIRE_SPACE_URL     (e.g. accuinfo.signalwire.com)
 *   SIGNALWIRE_FROM_NUMBER   (E.164, e.g. +18459537587)
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *
 * Request body JSON:
 *   { to: "+18455551234" | string[],
 *     message: "...text to speak...",
 *     voice: "Polly.Carmen" | "Polly.Joanna" | "alice"   (optional, default Polly.Joanna),
 *     language: "he-IL" | "en-US" | ...                  (optional, default en-US),
 *     relatedType, relatedId, sentBy }
 *
 * Returns: { success: true, results: [{ to, status, sid?, error? }, ...] }
 */

import { requireRole, rateLimit, logAudit, ADMIN_ROLES } from '../_lib/auth.js';

// Escape XML for inline TwiML
function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Normalize a US phone number to E.164. Returns null if too short.
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

// Accept either "space.signalwire.com" or "https://space.signalwire.com".
function normalizeSpaceHost(raw) {
  const v = String(raw || '').trim();
  if (!v) return '';
  return v.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

async function readProviderError(resp) {
  const text = await resp.text().catch(() => '');
  if (!text) return `HTTP ${resp.status}`;
  try {
    const data = JSON.parse(text);
    return data?.message || data?.error_message || data?.error || `HTTP ${resp.status}`;
  } catch {
    const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return clean || `HTTP ${resp.status}`;
  }
}

export async function onRequestPost(context) {
  const headers = { 'Content-Type': 'application/json' };

  const PROJECT_ID = context.env.SIGNALWIRE_PROJECT_ID;
  const API_TOKEN = context.env.SIGNALWIRE_API_TOKEN;
  const SPACE_URL = context.env.SIGNALWIRE_SPACE_URL; // e.g. accuinfo.signalwire.com
  const FROM_NUMBER = context.env.SIGNALWIRE_FROM_NUMBER; // E.164
  const SUPABASE_URL = context.env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co';
  const SUPABASE_SERVICE_KEY = context.env.SUPABASE_SERVICE_KEY || context.env.SUPABASE_ANON_KEY;

  const SPACE_HOST = normalizeSpaceHost(SPACE_URL);

  if (!PROJECT_ID || !API_TOKEN || !SPACE_HOST || !FROM_NUMBER) {
    return new Response(
      JSON.stringify({ error: 'SignalWire credentials not configured (SIGNALWIRE_PROJECT_ID / API_TOKEN / SPACE_URL / FROM_NUMBER required).' }),
      { status: 500, headers }
    );
  }

  const FROM_E164 = toE164(FROM_NUMBER);
  if (!FROM_E164) {
    return new Response(
      JSON.stringify({ error: 'SIGNALWIRE_FROM_NUMBER is invalid. Use E.164 like +18455551234.' }),
      { status: 500, headers }
    );
  }

  // --- Auth gate: principals/admins only (calls cost money) ---
  const auth = await requireRole(context, 'send-call', ADMIN_ROLES);
  if (auth.response) return auth.response;
  const { user, role } = auth;

  // --- Rate limit: 30 calls / 5 min / user (each request can fan out, see below) ---
  const rl = rateLimit(context, user.id, 30, 5 * 60 * 1000);
  if (!rl.ok) {
    await logAudit(context, {
      endpoint: 'send-call', caller_user_id: user.id, caller_email: user.email, caller_role: role,
      status: 'denied', status_code: 429, reason: 'rate_limited',
    });
    return new Response(JSON.stringify({ error: 'Too many requests', retryAfter: rl.retryAfter }), {
      status: 429, headers: { ...headers, 'Retry-After': String(rl.retryAfter) },
    });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers });
  }

  const { to, message, audioUrl, voice, language, relatedType, relatedId, sentBy } = body || {};

  if (!to || (!message && !audioUrl)) {
    return new Response(JSON.stringify({ error: 'Missing required fields: to and (message or audioUrl)' }), { status: 400, headers });
  }

  const recipientsRaw = Array.isArray(to) ? to : [to];

  // Hard cap to prevent runaway charges from a single request
  const MAX_PER_REQUEST = 250;
  if (recipientsRaw.length > MAX_PER_REQUEST) {
    return new Response(
      JSON.stringify({ error: `Too many recipients in one request (max ${MAX_PER_REQUEST}).` }),
      { status: 400, headers }
    );
  }

  const ttsVoice = voice || 'Polly.Joanna';
  const ttsLang = language || 'en-US';

  // Build inline TwiML. If audioUrl is provided, use <Play> (real recording);
  // otherwise use <Say> (text-to-speech). Either way, repeat twice with a
  // pause between so the parent doesn't miss the start.
  const speakOrPlay = audioUrl
    ? `<Play>${escapeXml(audioUrl)}</Play>`
    : `<Say voice="${escapeXml(ttsVoice)}" language="${escapeXml(ttsLang)}">${escapeXml(message)}</Say>`;

  const twiml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Response>` +
      `<Pause length="1"/>` +
      speakOrPlay +
      `<Pause length="1"/>` +
      speakOrPlay +
    `</Response>`;

  const callsUrl = `https://${SPACE_HOST}/api/laml/2010-04-01/Accounts/${PROJECT_ID}/Calls.json`;
  const basicAuth = 'Basic ' + btoa(`${PROJECT_ID}:${API_TOKEN}`);

  const results = [];
  let okCount = 0;
  let failCount = 0;

  for (const raw of recipientsRaw) {
    const e164 = toE164(raw);
    if (!e164) {
      results.push({ to: raw, status: 'invalid_number' });
      failCount++;
      continue;
    }

    try {
      const params = new URLSearchParams();
      params.set('To', e164);
      params.set('From', FROM_E164);
      params.set('Twiml', twiml);

      const resp = await fetch(callsUrl, {
        method: 'POST',
        headers: {
          'Authorization': basicAuth,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      let data = {};
      if (resp.ok) {
        data = await resp.json().catch(() => ({}));
      }
      if (!resp.ok) {
        const providerError = await readProviderError(resp);
        results.push({ to: e164, status: 'failed', error: providerError });
        failCount++;
      } else {
        results.push({ to: e164, status: 'queued', sid: data.sid });
        okCount++;
      }

      // Best-effort: log to call_log
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/call_log`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            recipient: e164,
            message: audioUrl ? `[audio] ${audioUrl}` : message,
            voice: audioUrl ? null : ttsVoice,
            language: audioUrl ? null : ttsLang,
            provider: 'signalwire',
            provider_sid: data?.sid || null,
            status: resp.ok ? 'queued' : 'failed',
            error: resp.ok ? null : (results[results.length - 1]?.error || `HTTP ${resp.status}`),
            related_type: relatedType || null,
            related_id: relatedId || null,
            sent_by: sentBy || user.id,
          }),
        });
      } catch (logErr) {
        console.error('Failed to log call:', logErr);
      }
    } catch (err) {
      results.push({ to: e164, status: 'failed', error: err.message });
      failCount++;
    }
  }

  await logAudit(context, {
    endpoint: 'send-call', caller_user_id: user.id, caller_email: user.email, caller_role: role,
    status: failCount > 0 && okCount === 0 ? 'error' : 'allowed',
    status_code: failCount > 0 && okCount === 0 ? 502 : 200,
    reason: 'ok',
    request_meta: { recipient_count: recipientsRaw.length, ok: okCount, failed: failCount, related_type: relatedType || null },
  });

  return new Response(
    JSON.stringify({ success: true, ok: okCount, failed: failCount, results }),
    { status: 200, headers }
  );
}
