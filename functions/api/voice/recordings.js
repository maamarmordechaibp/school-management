/**
 * Cloudflare Pages Function — /api/voice/recordings  (PUBLIC webhook)
 *
 * Lets an inbound caller listen back to the broadcast (mass-call) recordings
 * the school sent out in the last 7 days. Reached from an IVR option whose
 * action_type is "recordings" (ivr.js redirects here).
 *
 * Navigation while listening:
 *   1 — next message      2 — repeat this message
 *   9 — previous message  0 — back to the main menu
 *   (no key) — auto-advances to the next message when playback finishes
 *
 * Query: ?i=<index>            (0-based position in the 7-day list)
 * Body (form): Digits, From, CallSid, ...
 */
import { validateAndParse, laml, escapeXml, sbSelect } from '../../_lib/voice-helpers.js';
import { loadMenu, baseUrlFrom } from '../../_lib/ivr-render.js';

const WINDOW_DAYS = 7;

function extractAudioUrlFromLogMessage(message) {
  const s = String(message || '').trim();
  if (!s.toLowerCase().startsWith('[audio]')) return null;
  const url = s.slice(7).trim();
  return /^https?:\/\//i.test(url) ? url : null;
}

/**
 * Fetch recent callback-eligible messages, newest first.
 *
 * Primary source: call_recordings created in the last WINDOW_DAYS.
 * Fallback source: call_log entries from recent mass calls where message stores
 * an audio URL as "[audio] <url>". This ensures a message sent today is still
 * available on callback even if the underlying recording was created earlier.
 */
async function loadRecentRecordings(env) {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const recordingsPath =
    `call_recordings?select=id,label,audio_url,created_at,duration_sec` +
    `&created_at=gte.${encodeURIComponent(since)}` +
    `&audio_url=not.is.null` +
    `&order=created_at.desc`;

  const logsPath =
    `call_log?select=created_at,message,related_type,status` +
    `&created_at=gte.${encodeURIComponent(since)}` +
    `&related_type=eq.mass_call` +
    `&status=neq.failed` +
    `&order=created_at.desc` +
    `&limit=200`;

  const [recordingRows, logRows] = await Promise.all([
    sbSelect(env, recordingsPath),
    sbSelect(env, logsPath),
  ]);

  const merged = [];
  const seenUrls = new Set();

  for (const r of Array.isArray(recordingRows) ? recordingRows : []) {
    if (!r?.audio_url || seenUrls.has(r.audio_url)) continue;
    seenUrls.add(r.audio_url);
    merged.push(r);
  }

  for (const row of Array.isArray(logRows) ? logRows : []) {
    const audioUrl = extractAudioUrlFromLogMessage(row?.message);
    if (!audioUrl || seenUrls.has(audioUrl)) continue;
    seenUrls.add(audioUrl);
    merged.push({
      id: `log-${audioUrl}`,
      label: 'Recent school message',
      audio_url: audioUrl,
      created_at: row.created_at,
      duration_sec: null,
    });
  }

  merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return merged;
}

/** Human-ish "June 14" style date for the spoken intro. */
function spokenDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

/**
 * Build the LaML for one recording: a <Gather> that speaks a short intro,
 * plays the audio, then offers the keypad menu. If no key is pressed the
 * trailing <Redirect> auto-advances to the next message.
 */
function renderRecording(recs, index, { baseUrl, voice, language }) {
  const total = recs.length;

  // Past the end → wrap up and send the caller back to the main menu.
  if (index >= total) {
    const back = `${baseUrl}/api/voice/inbound`;
    return laml(
      `<Say voice="${escapeXml(voice)}" language="${escapeXml(language)}">` +
        `That was the last message. Returning to the main menu.` +
      `</Say>` +
      `<Redirect method="POST">${escapeXml(back)}</Redirect>`
    );
  }

  const rec = recs[index];
  const human = index + 1;
  const dateText = spokenDate(rec.created_at);
  const labelText = rec.label ? `, ${rec.label}` : '';
  const intro =
    `Message ${human} of ${total}` +
    (dateText ? `, from ${dateText}` : '') +
    `${labelText}.`;

  const action = `${baseUrl}/api/voice/recordings?i=${index}`;
  const next = `${baseUrl}/api/voice/recordings?i=${index + 1}`;

  const gather =
    `<Gather numDigits="1" timeout="6" action="${escapeXml(action)}" method="POST">` +
      `<Say voice="${escapeXml(voice)}" language="${escapeXml(language)}">${escapeXml(intro)}</Say>` +
      `<Play>${escapeXml(rec.audio_url)}</Play>` +
      `<Say voice="${escapeXml(voice)}" language="${escapeXml(language)}">` +
        `Press 1 for the next message, 2 to repeat, 9 for the previous message, or 0 for the main menu.` +
      `</Say>` +
    `</Gather>` +
    // No key pressed → move on to the next message automatically.
    `<Redirect method="POST">${escapeXml(next)}</Redirect>`;

  return laml(gather);
}

export async function onRequestPost(context) {
  const { ok, params } = await validateAndParse(context);
  if (!ok) return laml('<Say>Unauthorized.</Say><Hangup/>');

  const baseUrl = baseUrlFrom(context.request);
  const url = new URL(context.request.url);
  const index = Math.max(0, parseInt(url.searchParams.get('i') || '0', 10) || 0);
  const digit = (params.Digits || '').trim();

  // Match the spoken prompts to whatever voice/language the root menu uses.
  let voice = 'Polly.Joanna';
  let language = 'en-US';
  const root = await loadMenu(context.env, null);
  if (root && root.menu) {
    voice = root.menu.greeting_voice || voice;
    language = root.menu.greeting_language || language;
  }

  const recs = await loadRecentRecordings(context.env);
  if (recs.length === 0) {
    const back = `${baseUrl}/api/voice/inbound`;
    return laml(
      `<Say voice="${escapeXml(voice)}" language="${escapeXml(language)}">` +
        `There are no recent messages from the last ${WINDOW_DAYS} days. Returning to the main menu.` +
      `</Say>` +
      `<Redirect method="POST">${escapeXml(back)}</Redirect>`
    );
  }

  const opts = { baseUrl, voice, language };

  if (digit) {
    switch (digit) {
      case '1': // next
        return renderRecording(recs, index + 1, opts);
      case '2': // repeat
        return renderRecording(recs, index, opts);
      case '9': // previous
        return renderRecording(recs, Math.max(0, index - 1), opts);
      case '0': { // back to main menu
        const back = `${baseUrl}/api/voice/inbound`;
        return laml(`<Redirect method="POST">${escapeXml(back)}</Redirect>`);
      }
      default: // unrecognized key → just replay the current one
        return renderRecording(recs, index, opts);
    }
  }

  // First entry, or auto-advance after playback finished.
  return renderRecording(recs, index, opts);
}

export const onRequestGet = onRequestPost;
