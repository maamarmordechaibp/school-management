/**
 * Cloudflare Pages Function — /api/voice/status-callback  (PUBLIC webhook)
 *
 * Optional <Dial statusCallback> target. Updates the matching `inbound_calls`
 * row with the final disposition (answered / missed / completed) so the call
 * activity log and screen-pop state stay accurate.
 *
 * Query: ?ext=<extensionId>
 */
import { validateAndParse, sbUpdate } from '../../_lib/voice-helpers.js';

export async function onRequestPost(context) {
  const { ok, params } = await validateAndParse(context);
  if (!ok) return new Response('', { status: 200 });

  const callSid = params.CallSid;
  const dialStatus = (params.DialCallStatus || params.CallStatus || '').toLowerCase();

  if (callSid && dialStatus) {
    let status = 'completed';
    if (dialStatus === 'completed' || dialStatus === 'answered') status = 'answered';
    else if (['no-answer', 'busy', 'failed', 'canceled'].includes(dialStatus)) status = 'missed';

    const patch = { status };
    const dur = parseInt(params.DialCallDuration || params.CallDuration || '0', 10);
    if (dur) patch.duration_sec = dur;

    try {
      await sbUpdate(
        context.env,
        'inbound_calls',
        `provider_sid=eq.${encodeURIComponent(callSid)}`,
        patch
      );
    } catch { /* ignore */ }
  }

  return new Response('', { status: 200 });
}

export const onRequestGet = onRequestPost;
