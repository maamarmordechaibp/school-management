/**
 * Cloudflare Pages Function — /api/voice/voicemail-callback  (PUBLIC webhook)
 *
 * SignalWire POSTs here when a voicemail <Record> finishes. We download the
 * recording, store it in Supabase Storage (call-audio bucket), insert a
 * `voicemails` row, resolve the caller, and email the extension owner.
 *
 * Query: ?ext=<extensionId>
 */
import {
  validateAndParse, laml, escapeXml, sbSelect, sbInsert,
} from '../../_lib/voice-helpers.js';
import { resolveCaller } from '../../_lib/caller-lookup.js';

export async function onRequestPost(context) {
  const { ok, params } = await validateAndParse(context);
  if (!ok) return laml('<Say>Unauthorized.</Say><Hangup/>');

  const env = context.env;
  const SUPABASE_URL = env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co';
  const SERVICE_KEY = env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY;
  const PROJECT_ID = env.SIGNALWIRE_PROJECT_ID;
  const API_TOKEN = env.SIGNALWIRE_API_TOKEN;

  const url = new URL(context.request.url);
  const extId = url.searchParams.get('ext') || null;

  let recordingUrl = params.RecordingUrl;
  let recordingSid = params.RecordingSid;
  const duration = parseInt(params.RecordingDuration || '0', 10) || null;
  const caller = params.From || '';

  if (!recordingSid && recordingUrl) {
    const m = String(recordingUrl).match(/recordings\/([a-f0-9-]+)/i);
    if (m) recordingSid = m[1];
  }
  if (!recordingUrl || !recordingSid) {
    return laml('<Say>No message was recorded. Goodbye.</Say><Hangup/>');
  }

  // Download the audio from SignalWire and re-host it in our bucket.
  const isWav = /\.wav(\?|$)/i.test(recordingUrl);
  const ext = isWav ? 'wav' : 'mp3';
  const mimeType = isWav ? 'audio/wav' : 'audio/mpeg';
  let publicUrl = null;
  try {
    const basicAuth = 'Basic ' + btoa(`${PROJECT_ID}:${API_TOKEN}`);
    const audioResp = await fetch(recordingUrl, { headers: { Authorization: basicAuth } });
    if (audioResp.ok) {
      const buf = await audioResp.arrayBuffer();
      const filename = `voicemail/${recordingSid}.${ext}`;
      const upResp = await fetch(
        `${SUPABASE_URL}/storage/v1/object/call-audio/${filename}`,
        {
          method: 'POST',
          headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            'Content-Type': mimeType,
            'x-upsert': 'true',
          },
          body: buf,
        }
      );
      if (upResp.ok) {
        publicUrl = `${SUPABASE_URL}/storage/v1/object/public/call-audio/${filename}`;
      }
    }
  } catch (e) {
    console.error('voicemail download/upload failed', e);
  }
  // Fall back to the raw SignalWire URL if re-hosting failed.
  if (!publicUrl) publicUrl = recordingUrl;

  // Look up the extension + owner.
  let extension = null;
  if (extId) {
    const rows = await sbSelect(env, `phone_extensions?id=eq.${extId}&limit=1`);
    extension = rows && rows[0];
  }

  // Resolve caller for display.
  let resolved = { type: 'unknown', name: null, matchedId: null };
  try {
    resolved = await resolveCaller(env, caller);
  } catch { /* ignore */ }

  // Insert voicemail row.
  try {
    await sbInsert(
      env,
      'voicemails',
      {
        extension_id: extId,
        target_user_id: extension?.app_user_id || null,
        caller_number: caller || null,
        matched_type: resolved.type,
        matched_id: resolved.matchedId,
        matched_name: resolved.name,
        recording_url: publicUrl,
        duration_sec: duration,
        provider_sid: recordingSid,
      },
      'return=minimal'
    );
  } catch (e) {
    console.error('voicemail insert failed', e);
  }

  // Email the extension owner (best-effort).
  try {
    await notifyOwner(context, extension, { caller, resolved, publicUrl, duration });
  } catch (e) {
    console.error('voicemail notify failed', e);
  }

  return laml('<Say>Thank you. Your message has been recorded. Goodbye.</Say><Hangup/>');
}

async function notifyOwner(context, extension, info) {
  const env = context.env;
  const SUPABASE_URL = env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co';
  const SERVICE_KEY = env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY;
  const RESEND_API_KEY = env.RESEND_API_KEY;
  const FROM = env.RESEND_FROM || env.VOICEMAIL_FROM_EMAIL;
  if (!RESEND_API_KEY || !FROM || !extension?.app_user_id) return;

  // Get the owner's email.
  const users = await sbSelect(
    env,
    `app_users?id=eq.${extension.app_user_id}&select=email,name&limit=1`
  );
  const owner = users && users[0];
  if (!owner?.email) return;

  const callerLabel = info.resolved?.name
    ? `${info.resolved.name} (${info.caller})`
    : info.caller || 'Unknown caller';
  const mins = info.duration ? `${info.duration}s` : '';

  const html =
    `<p>You have a new voicemail on extension <strong>${escapeXml(extension.label)}</strong>.</p>` +
    `<p><strong>From:</strong> ${escapeXml(callerLabel)}<br/>` +
    `<strong>Length:</strong> ${escapeXml(mins)}</p>` +
    (info.publicUrl ? `<p><a href="${escapeXml(info.publicUrl)}">Listen to the message</a></p>` : '') +
    `<p>You can also review it under Phone System → Voicemails in the app.</p>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [owner.email],
      subject: `New voicemail — ${extension.label}`,
      html,
    }),
  });

  // Best-effort: log to email_log if it exists.
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/email_log`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        recipient: owner.email,
        subject: `New voicemail — ${extension.label}`,
        status: 'sent',
      }),
    });
  } catch { /* email_log may not exist or have different columns; ignore */ }
}

export const onRequestGet = onRequestPost;
