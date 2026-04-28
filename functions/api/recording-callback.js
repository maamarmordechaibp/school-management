/**
 * Cloudflare Pages Function — /api/recording-callback
 *
 * PUBLIC webhook. SignalWire POSTs here when a <Record> finishes (form-urlencoded).
 * We verify the signed token from the URL, download the recording from SignalWire,
 * upload it to Supabase Storage (bucket: call-audio), and insert a row in
 * call_recordings.
 *
 * SignalWire sends fields: AccountSid, CallSid, RecordingSid, RecordingUrl,
 * RecordingDuration, etc.
 *
 * Env vars:
 *   SIGNALWIRE_PROJECT_ID
 *   SIGNALWIRE_API_TOKEN
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *   RECORDING_WEBHOOK_SECRET
 */

async function verify(secret, token, expectedUserId) {
  // token = `${ts}.${encodeURIComponent(label)}.${sig}`
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [tsStr, encLabel, sig] = parts;
  const ts = parseInt(tsStr, 10);
  if (!Number.isFinite(ts)) return null;
  // Expire after 30 minutes
  if (Date.now() - ts > 30 * 60 * 1000) return null;

  const label = decodeURIComponent(encLabel);
  const payload = `${expectedUserId}|${ts}|${label}`;

  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  );
  const sigBytes = new Uint8Array(sig.match(/.{1,2}/g).map(h => parseInt(h, 16)));
  const ok = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(payload));
  if (!ok) return null;
  return { label, ts };
}

// Friendly TwiML response (SignalWire plays it to the caller)
function twimlResponse(text) {
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Response>` +
      `<Say voice="Polly.Joanna" language="en-US">${text}</Say>` +
      `<Hangup/>` +
    `</Response>`;
  return new Response(xml, { status: 200, headers: { 'Content-Type': 'text/xml; charset=utf-8' } });
}

export async function onRequestPost(context) {
  const PROJECT_ID = context.env.SIGNALWIRE_PROJECT_ID;
  const API_TOKEN = context.env.SIGNALWIRE_API_TOKEN;
  const SUPABASE_URL = context.env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co';
  const SUPABASE_SERVICE_KEY = context.env.SUPABASE_SERVICE_KEY || context.env.SUPABASE_ANON_KEY;
  const WEBHOOK_SECRET = context.env.RECORDING_WEBHOOK_SECRET;

  if (!PROJECT_ID || !API_TOKEN || !SUPABASE_SERVICE_KEY || !WEBHOOK_SECRET) {
    return twimlResponse('Server not configured. Goodbye.');
  }

  const url = new URL(context.request.url);
  const userId = url.searchParams.get('u');
  const token = url.searchParams.get('t');
  if (!userId || !token) return twimlResponse('Invalid request. Goodbye.');

  const verified = await verify(WEBHOOK_SECRET, token, userId);
  if (!verified) return twimlResponse('Verification failed. Goodbye.');

  // Parse form body from SignalWire
  let form;
  try {
    form = await context.request.formData();
  } catch {
    return twimlResponse('Invalid form data. Goodbye.');
  }

  // Log everything for debugging
  const allFields = {};
  for (const [k, v] of form.entries()) {
    allFields[k] = typeof v === 'string' ? v : '[non-string]';
  }
  console.log('Recording callback fields:', JSON.stringify(allFields));

  // SignalWire usually sends RecordingUrl + RecordingSid. Sometimes only RecordingUrl.
  let recordingUrl = form.get('RecordingUrl');
  let recordingSid = form.get('RecordingSid');
  const duration = parseInt(form.get('RecordingDuration') || '0', 10) || null;

  // Fallback: extract sid from the URL if not provided as a field.
  // URL looks like .../recordings/<sid>.wav
  if (!recordingSid && recordingUrl) {
    const m = String(recordingUrl).match(/recordings\/([a-f0-9-]+)/i);
    if (m) recordingSid = m[1];
  }

  if (!recordingUrl || !recordingSid) {
    console.warn('Missing recording fields. Form:', allFields);
    return twimlResponse('No recording was captured. Please try again. Goodbye.');
  }

  // SignalWire's files.signalwire.com URLs are direct downloads.
  // The URL already includes the file extension (.wav or .mp3). Fetch as-is.
  const audioFetchUrl = recordingUrl;
  const isWav = /\.wav(\?|$)/i.test(audioFetchUrl);
  const ext = isWav ? 'wav' : 'mp3';
  const mimeType = isWav ? 'audio/wav' : 'audio/mpeg';
  const basicAuth = 'Basic ' + btoa(`${PROJECT_ID}:${API_TOKEN}`);

  let audioBuf;
  try {
    const audioResp = await fetch(audioFetchUrl, { headers: { 'Authorization': basicAuth } });
    if (!audioResp.ok) {
      console.error('Failed to fetch recording from SignalWire:', audioResp.status, audioFetchUrl);
      return twimlResponse('Could not download the recording. Goodbye.');
    }
    audioBuf = await audioResp.arrayBuffer();
  } catch (err) {
    console.error('Recording fetch error:', err);
    return twimlResponse('Network error fetching recording. Goodbye.');
  }

  // Upload to Supabase Storage (bucket: call-audio)
  const filename = `phone/${recordingSid}.${ext}`;
  try {
    const uploadResp = await fetch(
      `${SUPABASE_URL}/storage/v1/object/call-audio/${filename}`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': mimeType,
          'x-upsert': 'true',
        },
        body: audioBuf,
      }
    );
    if (!uploadResp.ok) {
      const txt = await uploadResp.text().catch(() => '');
      console.error('Storage upload failed:', uploadResp.status, txt);
      return twimlResponse('Could not save the recording. Goodbye.');
    }
  } catch (err) {
    console.error('Storage upload error:', err);
    return twimlResponse('Storage error. Goodbye.');
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/call-audio/${filename}`;

  // Insert row in call_recordings
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/call_recordings`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        label: verified.label || `Phone recording ${recordingSid.slice(-6)}`,
        audio_url: publicUrl,
        source: 'phone',
        duration_sec: duration,
        mime_type: mimeType,
        size_bytes: audioBuf.byteLength,
        provider_sid: recordingSid,
        created_by: userId,
      }),
    });
  } catch (err) {
    console.error('DB insert error:', err);
    // Still respond OK to caller; recording is at least uploaded.
  }

  return twimlResponse('Your recording was saved successfully. You can now use it from the dashboard. Goodbye.');
}
