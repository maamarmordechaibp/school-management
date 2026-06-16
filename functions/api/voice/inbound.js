/**
 * Cloudflare Pages Function — /api/voice/inbound  (PUBLIC webhook)
 *
 * SignalWire hits this when the school's main number is called. We load the
 * root IVR menu the principal configured and play it, collecting one digit.
 *
 * Configure in SignalWire: phone number → Voice → "When a Call Comes In" →
 *   Webhook  POST  https://<your-domain>/api/voice/inbound
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, SIGNALWIRE_WEBHOOK_TOKEN (optional).
 */
import { validateAndParse, laml } from '../../_lib/voice-helpers.js';
import { loadMenu, renderMenu, baseUrlFrom } from '../../_lib/ivr-render.js';

export async function onRequestPost(context) {
  const { ok } = await validateAndParse(context);
  if (!ok) {
    return laml('<Say>Unauthorized.</Say><Hangup/>');
  }

  const loaded = await loadMenu(context.env, null); // root menu
  if (!loaded) {
    return laml(
      '<Say voice="Polly.Joanna" language="en-US">' +
        'The phone system is not configured yet. Please call back later. Goodbye.' +
      '</Say><Hangup/>'
    );
  }

  return renderMenu(loaded, { baseUrl: baseUrlFrom(context.request), attempt: 1 });
}

// SignalWire may probe with GET; respond with the same menu.
export const onRequestGet = onRequestPost;
