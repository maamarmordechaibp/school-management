/**
 * Cloudflare Pages Function — /api/voice/voicemail  (PUBLIC webhook)
 *
 * Reached when an extension didn't answer (the <Dial action> fires here) or
 * when an IVR option sends the caller straight to voicemail. Plays the
 * extension's greeting (custom or default) and records a message.
 *
 * Query: ?ext=<extensionId>
 */
import { validateAndParse, laml, escapeXml, sayOrPlay, sbSelect } from '../../_lib/voice-helpers.js';
import { baseUrlFrom } from '../../_lib/ivr-render.js';

export async function onRequestPost(context) {
  const { ok, params } = await validateAndParse(context);
  if (!ok) return laml('<Say>Unauthorized.</Say><Hangup/>');

  const url = new URL(context.request.url);
  const extId = url.searchParams.get('ext');
  const baseUrl = baseUrlFrom(context.request);

  // If the call was answered, <Dial action> posts DialCallStatus=completed —
  // don't record voicemail in that case.
  const dialStatus = (params.DialCallStatus || '').toLowerCase();
  if (dialStatus === 'completed' || dialStatus === 'answered') {
    return laml('<Hangup/>');
  }

  let ext = null;
  if (extId) {
    const rows = await sbSelect(context.env, `phone_extensions?id=eq.${extId}&limit=1`);
    ext = rows && rows[0];
  }

  if (ext && ext.voicemail_enabled === false) {
    return laml('<Say>Sorry, no one is available. Please call back later. Goodbye.</Say><Hangup/>');
  }

  const greeting = ext
    ? sayOrPlay({
        audioUrl: ext.voicemail_greeting_audio_url,
        text:
          ext.voicemail_greeting_text ||
          `You have reached ${ext.label}. Please leave a message after the beep, then press pound.`,
      })
    : sayOrPlay({ text: 'Please leave a message after the beep, then press pound.' });

  const action = `${baseUrl}/api/voice/voicemail-callback?ext=${encodeURIComponent(extId || '')}`;

  return laml(
    greeting +
      `<Record action="${escapeXml(action)}" method="POST" maxLength="180" finishOnKey="#" playBeep="true"/>` +
      `<Say>We did not receive a message. Goodbye.</Say><Hangup/>`
  );
}

export const onRequestGet = onRequestPost;
