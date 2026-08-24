/**
 * Cloudflare Pages Function — /api/voice/call-recording-callback  (PUBLIC webhook)
 *
 * SignalWire POSTs here when the <Dial record="…"> recording of an answered
 * inbound call finishes. We download the audio, re-host it in Supabase Storage
 * (call-audio/calls/), create a `call_conversations` row (carrying the matched
 * parent/student identity from the inbound_calls log), and submit the audio to
 * Yiddish Labs for async transcription. Yiddish Labs calls
 * /api/voice/transcription-webhook when the transcript is ready.
 *
 * Query: ?ext=<extensionId>
 * Env: SIGNALWIRE_PROJECT_ID, SIGNALWIRE_API_TOKEN, SUPABASE_URL,
 *      SUPABASE_SERVICE_KEY, YIDDISHLABS_API_KEY, YIDDISHLABS_LANGUAGE (opt),
 *      CALL_WEBHOOK_SECRET, PUBLIC_BASE_URL (opt).
 */
import { validateAndParse, sbSelect, sbInsert, sbUpdate } from '../../_lib/voice-helpers.js';
import { submitToYiddishLabs } from '../../_lib/transcribe.js';

function ok() {
  return new Response('', { status: 204 });
}

function normalizeSpaceHost(raw) {
  return String(raw || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Candidate media URLs (mp3 + wav). Prefer the canonical
// /Accounts/{acct}/Recordings/{sid} media path — the /Calls/.../Recordings/...
// form SignalWire sends in the webhook does not reliably serve the media file.
function mediaUrls(env, { recordingUrl, recordingSid, accountSid }) {
  const urls = [];
  const space = normalizeSpaceHost(env.SIGNALWIRE_SPACE_URL);
  if (space && accountSid && recordingSid) {
    const base = `https://${space}/api/laml/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}`;
    urls.push(`${base}.mp3`, `${base}.wav`);
  }
  if (recordingUrl) {
    const stripped = String(recordingUrl).replace(/\.(wav|mp3)(\?.*)?$/i, '');
    urls.push(`${stripped}.mp3`, `${stripped}.wav`);
  }
  return [...new Set(urls)];
}

// A <Dial record> file isn't always downloadable the instant "completed" fires
// (dual-channel mixing). Retry with backoff and try both mp3 and wav.
async function downloadWithRetry(env, urls) {
  const basicAuth = 'Basic ' + btoa(`${env.SIGNALWIRE_PROJECT_ID}:${env.SIGNALWIRE_API_TOKEN}`);
  const backoff = [0, 5000, 12000]; // ms before each pass
  for (const wait of backoff) {
    if (wait) await sleep(wait);
    for (const u of urls) {
      try {
        const resp = await fetch(u, { headers: { Authorization: basicAuth } });
        if (resp.ok) {
          const buf = await resp.arrayBuffer();
          if (buf && buf.byteLength > 0) {
            const isWav = /\.wav(\?|$)/i.test(u);
            return { buf, mimeType: isWav ? 'audio/wav' : 'audio/mpeg', ext: isWav ? 'wav' : 'mp3' };
          }
        }
      } catch { /* retry */ }
    }
  }
  return null;
}

async function processRecording(context, { convId, urls, recordingSid, name }) {
  const env = context.env;
  const SUPABASE_URL = env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co';
  const SERVICE_KEY = env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY;

  const dl = await downloadWithRetry(env, urls);
  if (!dl) {
    await sbUpdate(env, 'call_conversations', `id=eq.${convId}`, {
      status: 'failed',
      error: 'recording download failed after retries',
    });
    return;
  }

  let publicUrl = null;
  try {
    const filename = `calls/${recordingSid}.${dl.ext}`;
    const upResp = await fetch(
      `${SUPABASE_URL}/storage/v1/object/call-audio/${filename}`,
      {
        method: 'POST',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': dl.mimeType,
          'x-upsert': 'true',
        },
        body: dl.buf,
      }
    );
    if (upResp.ok) publicUrl = `${SUPABASE_URL}/storage/v1/object/public/call-audio/${filename}`;
  } catch (e) {
    console.error('call recording rehost failed', e);
  }
  if (publicUrl) {
    await sbUpdate(env, 'call_conversations', `id=eq.${convId}`, { recording_url: publicUrl });
  }

  await submitToYiddishLabs(context, { convId, audioBuf: dl.buf, mimeType: dl.mimeType, name });
}

export async function onRequestPost(context) {
  const { ok: valid, params } = await validateAndParse(context);
  if (!valid) return ok();

  const env = context.env;
  const url = new URL(context.request.url);
  const extId = url.searchParams.get('ext') || null;

  const callSid = params.CallSid || null;
  const accountSid = params.AccountSid || null;
  const recordingUrl = params.RecordingUrl || null;
  let recordingSid = params.RecordingSid || null;
  const duration = parseInt(params.RecordingDuration || '0', 10) || null;

  if (!recordingSid && recordingUrl) {
    const m = String(recordingUrl).match(/[Rr]ecordings\/([a-zA-Z0-9-]+)/);
    if (m) recordingSid = m[1];
  }
  if (!recordingSid) return ok();

  // Matched caller/student from the inbound_calls log (route.js / disa.js insert).
  let call = null;
  if (callSid) {
    const rows = await sbSelect(
      env,
      `inbound_calls?provider_sid=eq.${encodeURIComponent(callSid)}&limit=1`
    );
    call = rows && rows[0];
  }

  // Create the row now so it appears in the tab immediately (recording_url is
  // filled in by the background task once the audio is rehosted).
  let conv = null;
  try {
    conv = await sbInsert(env, 'call_conversations', {
      kind: 'call',
      inbound_call_id: call?.id || null,
      caller_number: call?.caller_number || params.From || null,
      extension_id: call?.extension_id || extId,
      target_user_id: call?.target_user_id || null,
      matched_type: call?.matched_type || null,
      matched_id: call?.matched_id || null,
      matched_name: call?.matched_name || null,
      matched_student_ids: call?.matched_student_ids || null,
      duration_sec: duration,
      provider_sid: callSid,
      recording_sid: recordingSid,
      status: 'recorded',
    });
  } catch (e) {
    console.error('call_conversations insert failed', e);
  }

  // Download + rehost + transcribe in the background so SignalWire gets a fast
  // response and the recording has time to finish mixing.
  if (conv?.id) {
    const urls = mediaUrls(env, { recordingUrl, recordingSid, accountSid });
    const name = `Call ${call?.matched_name || call?.caller_number || recordingSid}`;
    context.waitUntil(processRecording(context, { convId: conv.id, urls, recordingSid, name }));
  }

  return ok();
}

export const onRequestGet = onRequestPost;
