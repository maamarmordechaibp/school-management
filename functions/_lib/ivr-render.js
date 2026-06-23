/**
 * Renders a data-driven IVR menu (ivr_menus + ivr_options) into LaML.
 *
 * The principal edits menus/options in the app; this turns the current saved
 * tree into the XML SignalWire plays at call time. Supports nested submenus
 * (each option can point at another menu) with no code changes.
 */
import { escapeXml, sayOrPlay, sbSelect, laml } from './voice-helpers.js';

/** Load a menu by id (or the root menu when id is falsy) with its options. */
export async function loadMenu(env, menuId) {
  let menus;
  if (menuId) {
    menus = await sbSelect(env, `ivr_menus?id=eq.${menuId}&limit=1`);
  } else {
    menus = await sbSelect(env, `ivr_menus?is_root=eq.true&is_active=eq.true&limit=1`);
  }
  const menu = menus && menus[0];
  if (!menu) return null;
  const options = await sbSelect(
    env,
    `ivr_options?menu_id=eq.${menu.id}&order=sort_order.asc,digit.asc`
  );
  return { menu, options: options || [] };
}

/**
 * Build the LaML for a menu: greeting + <Gather> that collects one digit and
 * posts back to /api/voice/ivr with the menu id. Falls through to a re-prompt.
 */
export function renderMenu({ menu, options }, { baseUrl, attempt = 1 }) {
  const action = `${baseUrl}/api/voice/ivr?menu=${encodeURIComponent(menu.id)}&attempt=${attempt + 1}`;
  const greeting = sayOrPlay({
    audioUrl: menu.greeting_audio_url,
    text: menu.greeting_text,
    voice: menu.greeting_voice,
    language: menu.greeting_language,
  });

  const callbackHint = menu.is_root
    ? `<Say voice="${escapeXml(menu.greeting_voice)}" language="${escapeXml(menu.greeting_language)}">` +
        `To hear recent school messages, press 9.` +
      `</Say>`
    : '';

  const gather =
    `<Gather numDigits="1" timeout="${menu.timeout_sec || 6}" action="${escapeXml(action)}" method="POST">` +
      greeting +
      callbackHint +
    `</Gather>`;

  // If the caller does nothing, retry up to invalid_retries, else hang up.
  const maxRetries = menu.invalid_retries || 3;
  let tail;
  if (attempt >= maxRetries) {
    tail =
      `<Say voice="${escapeXml(menu.greeting_voice)}" language="${escapeXml(menu.greeting_language)}">` +
      `We did not receive a selection. Goodbye.</Say><Hangup/>`;
  } else {
    // Redirect back to this same menu for another attempt.
    const retry = `${baseUrl}/api/voice/ivr?menu=${encodeURIComponent(menu.id)}&attempt=${attempt + 1}&replay=1`;
    tail = `<Redirect method="POST">${escapeXml(retry)}</Redirect>`;
  }

  return laml(gather + tail);
}

/** Base URL (scheme + host) the webhook was hit on. */
export function baseUrlFrom(request) {
  const u = new URL(request.url);
  return `${u.protocol}//${u.host}`;
}
