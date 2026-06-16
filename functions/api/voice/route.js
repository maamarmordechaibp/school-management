/**
 * Cloudflare Pages Function — /api/voice/route  (PUBLIC webhook)
 *
 * Dials a chosen extension: rings the SIP desk phone AND the cell/home forward
 * number simultaneously. At the same moment it resolves the caller's identity
 * and inserts an `inbound_calls` row — which the app's Realtime screen-pop
 * listens for, opening the caller's profile on the answering staff member's
 * screen.
 *
 * If nobody answers within ring_timeout, control passes to /api/voice/voicemail.
 *
 * Query: ?ext=<extensionId>
 */
import {
  validateAndParse, laml, escapeXml, toE164, sbSelect, sbInsert,
} from '../../_lib/voice-helpers.js';
import { resolveCaller } from '../../_lib/caller-lookup.js';
import { baseUrlFrom } from '../../_lib/ivr-render.js';

export async function onRequestPost(context) {
  const { ok, params } = await validateAndParse(context);
  if (!ok) return laml('<Say>Unauthorized.</Say><Hangup/>');

  const url = new URL(context.request.url);
  const extId = url.searchParams.get('ext');
  const baseUrl = baseUrlFrom(context.request);

  if (!extId) return laml('<Say>That extension is not available. Goodbye.</Say><Hangup/>');

  const rows = await sbSelect(
    context.env,
    `phone_extensions?id=eq.${extId}&is_active=eq.true&limit=1`
  );
  const ext = rows && rows[0];
  if (!ext) return laml('<Say>That extension is not available. Goodbye.</Say><Hangup/>');

  const caller = params.From || '';

  // Resolve who is calling + log the inbound call. Best-effort — never block
  // the call on a lookup/log failure.
  let resolved = { type: 'unknown', name: null, matchedId: null, studentIds: [], detail: {} };
  try {
    resolved = await resolveCaller(context.env, caller);
  } catch { /* ignore */ }

  try {
    await sbInsert(
      context.env,
      'inbound_calls',
      {
        caller_number: caller || null,
        extension_id: ext.id,
        target_user_id: ext.app_user_id || null,
        matched_type: resolved.type,
        matched_id: resolved.matchedId,
        matched_name: resolved.name,
        matched_student_ids: resolved.studentIds && resolved.studentIds.length ? resolved.studentIds : null,
        status: 'ringing',
        provider_sid: params.CallSid || null,
      },
      'return=minimal'
    );
  } catch { /* ignore */ }

  // Build the <Dial>: ring SIP endpoint + forward number together.
  const timeout = ext.ring_timeout || 25;
  const vmAction = `${baseUrl}/api/voice/voicemail?ext=${encodeURIComponent(ext.id)}`;
  const statusCb = `${baseUrl}/api/voice/status-callback?ext=${encodeURIComponent(ext.id)}`;

  let targets = '';
  if (ext.sip_endpoint) {
    targets += `<Sip>sip:${escapeXml(ext.sip_endpoint)}</Sip>`;
  }
  const fwd = toE164(ext.forward_number);
  if (fwd) {
    targets += `<Number>${escapeXml(fwd)}</Number>`;
  }

  if (!targets) {
    // No reachable device — go straight to voicemail.
    return laml(`<Redirect method="POST">${escapeXml(vmAction)}</Redirect>`);
  }

  const dial =
    `<Dial timeout="${timeout}" action="${escapeXml(vmAction)}" method="POST"` +
    ` answerOnBridge="true">` +
    targets +
    `</Dial>`;

  return laml(dial);
}

export const onRequestGet = onRequestPost;
