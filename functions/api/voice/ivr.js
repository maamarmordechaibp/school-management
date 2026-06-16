/**
 * Cloudflare Pages Function — /api/voice/ivr  (PUBLIC webhook)
 *
 * Handles a digit press on an IVR menu and dispatches based on the option the
 * principal configured:
 *   extension → /api/voice/route (dial the person)
 *   submenu   → render the nested menu (unlimited depth)
 *   message   → play a message, then return to the same menu
 *   voicemail → /api/voice/voicemail
 *   forward   → dial an arbitrary number
 *   hangup    → end the call
 *
 * Query: ?menu=<menuId>&attempt=<n>[&replay=1]
 * Body (form): Digits, From, CallSid, ...
 */
import { validateAndParse, laml, escapeXml, sayOrPlay, sbSelect } from '../../_lib/voice-helpers.js';
import { loadMenu, renderMenu, baseUrlFrom } from '../../_lib/ivr-render.js';

export async function onRequestPost(context) {
  const { ok, params } = await validateAndParse(context);
  if (!ok) return laml('<Say>Unauthorized.</Say><Hangup/>');

  const url = new URL(context.request.url);
  const menuId = url.searchParams.get('menu');
  const attempt = parseInt(url.searchParams.get('attempt') || '1', 10);
  const replay = url.searchParams.get('replay') === '1';
  const baseUrl = baseUrlFrom(context.request);

  const loaded = await loadMenu(context.env, menuId);
  if (!loaded) return laml('<Say>Menu unavailable. Goodbye.</Say><Hangup/>');

  // Timeout / replay with no digit: re-render the menu.
  const digit = (params.Digits || '').trim();
  if (replay || !digit) {
    return renderMenu(loaded, { baseUrl, attempt });
  }

  const option = loaded.options.find((o) => o.digit === digit);
  if (!option) {
    // Invalid choice → re-prompt (renderMenu enforces retry cap).
    return renderMenu(loaded, { baseUrl, attempt });
  }

  switch (option.action_type) {
    case 'extension': {
      if (!option.target_extension_id) {
        return laml('<Say>That option is not available. Goodbye.</Say><Hangup/>');
      }
      const route = `${baseUrl}/api/voice/route?ext=${encodeURIComponent(option.target_extension_id)}`;
      return laml(`<Redirect method="POST">${escapeXml(route)}</Redirect>`);
    }

    case 'submenu': {
      if (!option.target_submenu_id) {
        return laml('<Say>That menu is not available. Goodbye.</Say><Hangup/>');
      }
      const sub = await loadMenu(context.env, option.target_submenu_id);
      if (!sub) return laml('<Say>That menu is not available. Goodbye.</Say><Hangup/>');
      return renderMenu(sub, { baseUrl, attempt: 1 });
    }

    case 'message': {
      const msg = sayOrPlay({
        audioUrl: option.message_audio_url,
        text: option.message_text,
        voice: loaded.menu.greeting_voice,
        language: loaded.menu.greeting_language,
      });
      // Play the message, then return to this menu.
      const back = `${baseUrl}/api/voice/ivr?menu=${encodeURIComponent(loaded.menu.id)}&attempt=1&replay=1`;
      return laml(msg + `<Redirect method="POST">${escapeXml(back)}</Redirect>`);
    }

    case 'forward': {
      const num = option.forward_number;
      if (!num) return laml('<Say>That option is not available. Goodbye.</Say><Hangup/>');
      return laml(`<Dial>${escapeXml(num)}</Dial>`);
    }

    case 'voicemail': {
      const ext = option.target_extension_id ? `?ext=${encodeURIComponent(option.target_extension_id)}` : '';
      const vm = `${baseUrl}/api/voice/voicemail${ext}`;
      return laml(`<Redirect method="POST">${escapeXml(vm)}</Redirect>`);
    }

    case 'hangup':
    default:
      return laml('<Say>Goodbye.</Say><Hangup/>');
  }
}

export const onRequestGet = onRequestPost;
