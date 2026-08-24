/**
 * Shared transcription pipeline helper.
 *
 * Creates a `call_conversations` row and submits its audio to Yiddish Labs for
 * async transcription. Yiddish Labs POSTs the transcript back to
 * /api/voice/transcription-webhook, which stores it and runs the AI analysis.
 *
 * Used by both the answered-call recording callback and the voicemail callback
 * so calls, DISA calls, and voicemails all flow through one pipeline.
 */
import { sbInsert, sbUpdate } from './voice-helpers.js';
import { baseUrlFrom } from './ivr-render.js';

const YL_SUBMIT_URL = 'https://app.yiddishlabs.com/api/v1/transcriptions';

// Submit audio to Yiddish Labs for an existing call_conversations row and
// advance its status. Marks the row 'failed' when the audio is missing.
export async function submitToYiddishLabs(context, { convId, audioBuf, mimeType = 'audio/mpeg', name }) {
  const env = context.env;
  const YL_KEY = (env.YIDDISHLABS_API_KEY || '').trim();
  if (!YL_KEY || !convId) return;

  if (!audioBuf) {
    await sbUpdate(env, 'call_conversations', `id=eq.${convId}`, {
      status: 'failed',
      error: 'recording download failed',
    });
    return;
  }

  try {
    const secret = env.CALL_WEBHOOK_SECRET || '';
    const base = env.PUBLIC_BASE_URL || baseUrlFrom(context.request);
    const webhookUrl =
      `${base}/api/voice/transcription-webhook?cc=${convId}` +
      (secret ? `&token=${encodeURIComponent(secret)}` : '');

    const ext = mimeType === 'audio/wav' ? 'wav' : 'mp3';
    const fd = new FormData();
    fd.append('file', new Blob([audioBuf], { type: mimeType }), `${convId}.${ext}`);
    if (name) fd.append('name', name);
    fd.append('language', env.YIDDISHLABS_LANGUAGE || 'auto');
    fd.append('webhook_url', webhookUrl);

    const ylResp = await fetch(YL_SUBMIT_URL, {
      method: 'POST',
      headers: { 'X-API-KEY': YL_KEY },
      body: fd,
    });
    if (ylResp.ok) {
      const job = await ylResp.json().catch(() => null);
      await sbUpdate(env, 'call_conversations', `id=eq.${convId}`, {
        yl_job_id: job?.id || null,
        status: 'transcribing',
      });
    } else {
      const detail = await ylResp.text().catch(() => '');
      console.error('Yiddish Labs submit failed', ylResp.status, detail.slice(0, 300));
      const hint = ylResp.status === 401
        ? ' — check YIDDISHLABS_API_KEY (use the yl_live_ key, not the Flash key)'
        : '';
      await sbUpdate(env, 'call_conversations', `id=eq.${convId}`, {
        status: 'failed',
        error: `transcription submit HTTP ${ylResp.status}${hint}`,
      });
    }
  } catch (e) {
    console.error('Yiddish Labs submit error', e);
  }
}

// Insert a call_conversations row then submit its (already-downloaded) audio.
export async function createConversationAndTranscribe(context, { row, audioBuf, name, mimeType }) {
  const env = context.env;

  let conv = null;
  try {
    conv = await sbInsert(env, 'call_conversations', { ...row, status: 'recorded' });
  } catch (e) {
    console.error('call_conversations insert failed', e);
    return null;
  }

  if (env.YIDDISHLABS_API_KEY && conv?.id) {
    await submitToYiddishLabs(context, { convId: conv.id, audioBuf, mimeType, name });
  }
  return conv;
}
