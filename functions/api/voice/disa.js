/**
 * Cloudflare Pages Function — /api/voice/disa  (PUBLIC webhook, LOCKED)
 *
 * DISA = Direct Inward System Access. An authorized staff member (e.g. the
 * principal) calls the school number from their cell OR office phone, presses
 * the DISA key (an IVR option with action_type "disa"), authenticates, then
 * dials a parent THROUGH the system:
 *
 *   1. AUTHENTICATE  caller-ID matches a registered admin  OR  type a PIN.
 *                    (Reuses the Call-In Broadcast admin list — only registered
 *                     numbers/PINs can dial out on the school's dime.)
 *   2. DIAL          "Enter the number, then pound."
 *   3. CONNECT       bridge the caller to the parent using the SCHOOL caller ID,
 *                    record the conversation (→ transcription + AI notes), and
 *                    insert an inbound_calls row so the matched child's profile
 *                    pops on the principal's logged-in screen.
 *
 * State is carried in the same tamper-proof signed session token as admin.js,
 * bound to the CallSid, so later steps can't be forged.
 *
 * Query: ?step=<auth|pin|dial|connect>&s=<session>&a=<pinAttempt>
 * Body (form): Digits, From, CallSid, ...
 */
import {
  validateAndParse, laml, escapeXml, toE164, sbInsert, sbSelect,
} from '../../_lib/voice-helpers.js';
import { loadMenu, baseUrlFrom } from '../../_lib/ivr-render.js';
import { signSession, verifySession } from '../../_lib/broadcast.js';
import { resolveCaller } from '../../_lib/caller-lookup.js';

// Service-role RPC (caller-ID / PIN auth) — same registered-admin gate as admin.js.
async function rpc(env, fn, args) {
  const url = env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co';
  const key = env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY;
  try {
    const resp = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args || {}),
    });
    if (!resp.ok) return null;
    return resp.json().catch(() => null);
  } catch {
    return null;
  }
}

// A SIP desk phone's caller ID is a SIP identity, not an E.164 number. Authorize
// it when it belongs to an extension whose app_user is a registered admin.
function sipLocalPart(raw) {
  const v = String(raw || '').trim().replace(/^sips?:/i, '');
  return v.split('@')[0].split(';')[0].trim().toLowerCase();
}

function last10(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  return d.length >= 10 ? d.slice(-10) : null;
}

// Best-effort: find the calling principal's app_user by their phone number, so
// the screen-pop still targets them if their admin record isn't linked.
async function appUserByPhone(env, from) {
  const tail = last10(from);
  if (!tail) return null;
  const users = await sbSelect(env, 'app_users?select=id,phone&phone=not.is.null');
  const match = (users || []).find((u) => last10(u.phone) === tail);
  return match?.id || null;
}

async function authorizeSip(env, from) {
  const sipUser = sipLocalPart(from);
  if (!sipUser) return null;
  const exts = await sbSelect(
    env,
    'phone_extensions?is_active=eq.true&select=app_user_id,sip_endpoint,ext_number'
  );
  const match = (exts || []).find((e) => {
    const epUser = sipLocalPart(e.sip_endpoint);
    return (epUser && epUser === sipUser) ||
      (e.ext_number && String(e.ext_number).trim().toLowerCase() === sipUser);
  });
  if (!match || !match.app_user_id) return null;
  const admins = await sbSelect(
    env,
    `phone_broadcast_admins?app_user_id=eq.${match.app_user_id}&is_active=eq.true&select=id,name,app_user_id&limit=1`
  );
  const admin = admins && admins[0];
  return admin && admin.id ? admin : null;
}

function step(baseUrl, name, state = {}) {
  const u = new URL(`${baseUrl}/api/voice/disa`);
  u.searchParams.set('step', name);
  for (const [k, v] of Object.entries(state)) {
    if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, v);
  }
  return u.toString();
}

function gather(actionUrl, inner, { numDigits, finishOnKey, timeout = 8 } = {}) {
  const attrs = [
    numDigits ? `numDigits="${numDigits}"` : '',
    finishOnKey ? `finishOnKey="${finishOnKey}"` : '',
    `timeout="${timeout}"`,
    `action="${escapeXml(actionUrl)}"`,
    'method="POST"',
  ].filter(Boolean).join(' ');
  return `<Gather ${attrs}>${inner}</Gather>`;
}

export async function onRequestPost(context) {
  const { ok, params } = await validateAndParse(context);
  if (!ok) return laml('<Say>Unauthorized.</Say><Hangup/>');

  const env = context.env;
  const baseUrl = baseUrlFrom(context.request);
  const url = new URL(context.request.url);
  const stepName = url.searchParams.get('step') || 'auth';
  const digit = (params.Digits || '').trim();
  const callSid = params.CallSid || '';
  const sToken = url.searchParams.get('s') || '';

  // Voice/language follow the root menu's settings.
  let voice = 'Polly.Joanna';
  let language = 'en-US';
  const root = await loadMenu(env, null);
  if (root && root.menu) {
    voice = root.menu.greeting_voice || voice;
    language = root.menu.greeting_language || language;
  }
  const S = (t) => `<Say voice="${escapeXml(voice)}" language="${escapeXml(language)}">${escapeXml(t)}</Say>`;

  // ---------------------------------------------------------------
  // STEP: auth — caller-ID match, else ask for a PIN.
  // ---------------------------------------------------------------
  if (stepName === 'auth') {
    let admin = await rpc(env, 'phone_admin_by_number', { p_number: params.From || '' });
    if (!(admin && admin.id)) {
      // Fall back to recognizing a registered admin's own desk phone (SIP).
      admin = await authorizeSip(env, params.From);
    }
    if (admin && admin.id) {
      const session = await signSession(env, {
        adminId: admin.id, name: admin.name, appUserId: admin.app_user_id,
        authMethod: 'caller_id', callSid,
      });
      return laml(
        S(`Welcome ${admin.name || ''}.`) +
        `<Redirect method="POST">${escapeXml(step(baseUrl, 'dial', { s: session }))}</Redirect>`
      );
    }
    return laml(
      gather(step(baseUrl, 'pin', {}), S('Please enter your PIN, followed by the pound key.'), { numDigits: 8, timeout: 8 })
      + S('We did not receive a PIN. Goodbye.') + '<Hangup/>'
    );
  }

  // ---------------------------------------------------------------
  // STEP: pin — verify the typed PIN.
  // ---------------------------------------------------------------
  if (stepName === 'pin') {
    const admin = digit ? await rpc(env, 'verify_phone_admin_pin', { p_pin: digit }) : null;
    if (admin && admin.id) {
      const session = await signSession(env, {
        adminId: admin.id, name: admin.name, appUserId: admin.app_user_id,
        authMethod: 'pin', callSid,
      });
      return laml(
        S('Accepted.') +
        `<Redirect method="POST">${escapeXml(step(baseUrl, 'dial', { s: session }))}</Redirect>`
      );
    }
    const attempt = parseInt(url.searchParams.get('a') || '1', 10);
    if (attempt >= 3) return laml(S('That PIN was not recognized. Goodbye.') + '<Hangup/>');
    return laml(
      gather(step(baseUrl, 'pin', { a: attempt + 1 }), S('That PIN was not recognized. Please try again, followed by pound.'), { numDigits: 8, timeout: 8 })
      + '<Hangup/>'
    );
  }

  // ---- everything past this point REQUIRES a valid signed session ----
  const session = await verifySession(env, sToken, callSid);
  if (!session) return laml(S('Your session has expired. Please call again. Goodbye.') + '<Hangup/>');
  const s = sToken;

  // ---------------------------------------------------------------
  // STEP: dial — collect the destination number.
  // ---------------------------------------------------------------
  if (stepName === 'dial') {
    return laml(
      gather(
        step(baseUrl, 'connect', { s }),
        S('Enter the phone number you want to call, then press pound.'),
        { numDigits: 15, finishOnKey: '#', timeout: 10 }
      ) + S('We did not receive a number. Goodbye.') + '<Hangup/>'
    );
  }

  // ---------------------------------------------------------------
  // STEP: connect — bridge to the parent, record, and screen-pop.
  // ---------------------------------------------------------------
  if (stepName === 'connect') {
    const dest = toE164(digit);
    if (!dest) {
      return laml(
        S('That number was not valid.') +
        `<Redirect method="POST">${escapeXml(step(baseUrl, 'dial', { s }))}</Redirect>`
      );
    }

    const fromNumber = toE164(env.SIGNALWIRE_FROM_NUMBER);
    if (!fromNumber) return laml(S('The system caller ID is not configured. Goodbye.') + '<Hangup/>');

    // Resolve the dialed number to a student so the child's profile pops on the
    // caller's own logged-in screen.
    let resolved = { type: 'unknown', name: null, matchedId: null, studentIds: [] };
    try { resolved = await resolveCaller(env, dest); } catch { /* ignore */ }

    // Whose screen pops: the authenticated principal. Fall back to matching
    // their calling number to an app_user when the admin record isn't linked.
    let targetUserId = session.appUserId || null;
    if (!targetUserId) {
      try { targetUserId = await appUserByPhone(env, params.From); } catch { /* ignore */ }
    }

    // inbound_calls row → screen-pop (target = the authenticated principal) and
    // the correlation key (provider_sid = CallSid) the recording callback uses.
    try {
      await sbInsert(env, 'inbound_calls', {
        caller_number: dest,
        target_user_id: targetUserId,
        matched_type: resolved.type,
        matched_id: resolved.matchedId,
        matched_name: resolved.name,
        matched_student_ids: resolved.studentIds && resolved.studentIds.length ? resolved.studentIds : null,
        status: 'ringing',
        provider_sid: callSid || null,
      }, 'return=minimal');
    } catch { /* never block the call on a log failure */ }

    // Record the conversation (→ /api/voice/call-recording-callback → transcription + AI).
    const recCb = `${baseUrl}/api/voice/call-recording-callback`;
    const recAttrs =
      ` record="record-from-answer-dual"` +
      ` recordingStatusCallback="${escapeXml(recCb)}"` +
      ` recordingStatusCallbackEvent="completed" recordingStatusCallbackMethod="POST"`;

    const dial =
      `<Dial callerId="${escapeXml(fromNumber)}" answerOnBridge="true"${recAttrs}>` +
      `<Number>${escapeXml(dest)}</Number>` +
      `</Dial>`;

    return laml(S('Please wait while we connect you.') + dial + '<Hangup/>');
  }

  return laml(S('Goodbye.') + '<Hangup/>');
}

export const onRequestGet = onRequestPost;
