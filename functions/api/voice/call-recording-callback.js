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
import { validateAndParse, sbSelect } from '../../_lib/voice-helpers.js';
import { createConversationAndTranscribe } from '../../_lib/transcribe.js';

function ok() {
  return new Response('', { status: 204 });
}

export async function onRequestPost(context) {
  const { ok: valid, params } = await validateAndParse(context);
  if (!valid) return ok();

  const env = context.env;
  const SUPABASE_URL = env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co';
  const SERVICE_KEY = env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY;
  const PROJECT_ID = env.SIGNALWIRE_PROJECT_ID;
  const API_TOKEN = env.SIGNALWIRE_API_TOKEN;

  const url = new URL(context.request.url);
  const extId = url.searchParams.get('ext') || null;

  const callSid = params.CallSid || null;
  let recordingUrl = params.RecordingUrl;
  let recordingSid = params.RecordingSid;
  const duration = parseInt(params.RecordingDuration || '0', 10) || null;

  if (!recordingSid && recordingUrl) {
    const m = String(recordingUrl).match(/[Rr]ecordings\/([a-zA-Z0-9-]+)/);
    if (m) recordingSid = m[1];
  }
  if (!recordingUrl || !recordingSid) return ok();

  // Dial recordings often come without a file extension — request mp3 (small,
  // stays under transcription size limits for long calls).
  const hasExt = /\.(wav|mp3)(\?|$)/i.test(recordingUrl);
  const audioFetchUrl = hasExt ? recordingUrl : `${recordingUrl}.mp3`;

  // Download from SignalWire and re-host in our bucket.
  let publicUrl = null;
  let audioBuf = null;
  try {
    const basicAuth = 'Basic ' + btoa(`${PROJECT_ID}:${API_TOKEN}`);
    const audioResp = await fetch(audioFetchUrl, { headers: { Authorization: basicAuth } });
    if (audioResp.ok) {
      audioBuf = await audioResp.arrayBuffer();
      const filename = `calls/${recordingSid}.mp3`;
      const upResp = await fetch(
        `${SUPABASE_URL}/storage/v1/object/call-audio/${filename}`,
        {
          method: 'POST',
          headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'audio/mpeg',
            'x-upsert': 'true',
          },
          body: audioBuf,
        }
      );
      if (upResp.ok) {
        publicUrl = `${SUPABASE_URL}/storage/v1/object/public/call-audio/${filename}`;
      }
    }
  } catch (e) {
    console.error('call recording download/upload failed', e);
  }
  if (!publicUrl) publicUrl = audioFetchUrl;

  // Pull the matched caller/student identity from the inbound_calls log
  // (inserted by /api/voice/route when the call was answered).
  let call = null;
  if (callSid) {
    const rows = await sbSelect(
      env,
      `inbound_calls?provider_sid=eq.${encodeURIComponent(callSid)}&limit=1`
    );
    call = rows && rows[0];
  }

  // Insert the conversation row + submit to Yiddish Labs for transcription.
  await createConversationAndTranscribe(context, {
    audioBuf,
    name: `Call ${call?.matched_name || call?.caller_number || recordingSid}`,
    row: {
      kind: 'call',
      inbound_call_id: call?.id || null,
      caller_number: call?.caller_number || params.From || null,
      extension_id: call?.extension_id || extId,
      target_user_id: call?.target_user_id || null,
      matched_type: call?.matched_type || null,
      matched_id: call?.matched_id || null,
      matched_name: call?.matched_name || null,
      matched_student_ids: call?.matched_student_ids || null,
      recording_url: publicUrl,
      duration_sec: duration,
      provider_sid: callSid,
      recording_sid: recordingSid,
    },
  });

  return ok();
}

export const onRequestGet = onRequestPost;
