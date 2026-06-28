/**
 * Cloudflare Pages Function — /api/voice/admin  (PUBLIC webhook, LOCKED)
 *
 * The principal calls the school number, presses the hidden admin key (see
 * ivr.js — option action_type "admin", or "*" on the root menu), and lands
 * here. This is a multi-step IVR that mirrors the website's Mass Phone Call:
 *
 *   1. AUTHENTICATE   caller-ID matches an authorized admin  OR  type a PIN.
 *   2. RECORD         record the announcement after the beep, press #.
 *   3. PLAYBACK       hear it; keep it (1) or re-record (2).
 *   4. PICK A GROUP   1 = Parents → (1 all / 2 by grade / 3 by class)
 *                     2 = Staff   → (1 all / 2 by position)
 *   5. CONFIRM        "This will call N numbers — press 1 to send, 2 cancel."
 *   6. SEND           fans out in the background; every call is logged with
 *                     WHO triggered it (phone_broadcasts).
 *
 * State between steps is carried in a TAMPER-PROOF signed session token (`s`),
 * so a forged POST to a later step without authenticating first is rejected.
 *
 * Query: ?step=<step>&s=<session>&...  Body (form): Digits, From, CallSid,
 *        RecordingUrl, RecordingSid, ...
 */
import {
  validateAndParse, laml, escapeXml, sbSelect, sbInsert,
} from '../../_lib/voice-helpers.js';
import { loadMenu, baseUrlFrom } from '../../_lib/ivr-render.js';
import {
  signSession, verifySession, resolveRecipients, audienceLabel,
  isOwnStorageUrl, sendBroadcast, logBroadcastStart,
} from '../../_lib/broadcast.js';

const PAGE_SIZE = 8; // list items per page (digits 1..8; 9 = more, 0 = back)

// ---- service-role RPC (caller-ID / PIN auth) ----
async function rpc(env, fn, args) {
  const url = env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co';
  const key = env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY;
  try {
    const resp = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args || {}),
    });
    if (!resp.ok) return null;
    return resp.json().catch(() => null);
  } catch {
    return null;
  }
}

function say(text, voice, language) {
  return `<Say voice="${escapeXml(voice)}" language="${escapeXml(language)}">${escapeXml(text)}</Say>`;
}

// ---------------------------------------------------------------
// Hebrew / Yiddish names can't be spoken by the English TTS voice
// (it just says "For , press 1"). Transliterate them to Latin so the
// voice can read an approximation, and fall back to a numbered option
// when nothing speakable remains.
// ---------------------------------------------------------------
const HEBREW_MAP = {
  'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'u', 'ז': 'z',
  'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'ch', 'ל': 'l', 'מ': 'm',
  'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'e', 'פ': 'p', 'ף': 'f',
  'צ': 'tz', 'ץ': 'tz', 'ק': 'k', 'ר': 'r', 'ש': 'sh', 'ת': 't',
};

function hasHebrew(str) {
  return /[\u0590-\u05FF]/.test(String(str || ''));
}

function transliterateHebrew(str) {
  let out = '';
  for (const ch of String(str || '')) {
    if (HEBREW_MAP[ch] !== undefined) out += HEBREW_MAP[ch];
    else if (/[\u0591-\u05C7]/.test(ch)) continue;        // nikkud / cantillation
    else if (ch === '׳' || ch === '״' || ch === '\u2018' || ch === '\u2019') continue; // geresh/gershayim
    else out += ch;
  }
  return out;
}

// A label safe to read aloud: transliterate any Hebrew, keep Latin as-is.
function speakLabel(text) {
  if (!hasHebrew(text)) return String(text || '');
  return transliterateHebrew(text).replace(/\s+/g, ' ').trim();
}

// A list item name for prompts; falls back to "option N" when not speakable.
function speakable(name, index) {
  const raw = String(name || '').trim();
  if (!raw) return `option ${index}`;
  if (!hasHebrew(raw)) return raw;
  const t = transliterateHebrew(raw).replace(/\s+/g, ' ').trim();
  return t ? `${t}, option ${index}` : `option ${index}`;
}

// Build a URL back into this endpoint, preserving session + audio state.
function step(baseUrl, name, state = {}) {
  const u = new URL(`${baseUrl}/api/voice/admin`);
  u.searchParams.set('step', name);
  for (const [k, v] of Object.entries(state)) {
    if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, v);
  }
  return u.toString();
}

function gather(actionUrl, inner, { numDigits = 1, timeout = 6 } = {}) {
  return (
    `<Gather numDigits="${numDigits}" timeout="${timeout}" action="${escapeXml(actionUrl)}" method="POST">` +
    inner +
    `</Gather>`
  );
}

// Download the SignalWire recording and re-host it in the public call-audio
// bucket so outbound <Play> can fetch it. Returns the public URL or null.
async function rehostRecording(env, recordingUrl, recordingSid, adminAppUserId) {
  const SUPABASE_URL = env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co';
  const SERVICE_KEY = env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY;
  const PROJECT_ID = env.SIGNALWIRE_PROJECT_ID;
  const API_TOKEN = env.SIGNALWIRE_API_TOKEN;
  const isWav = /\.wav(\?|$)/i.test(recordingUrl);
  const ext = isWav ? 'wav' : 'mp3';
  const mimeType = isWav ? 'audio/wav' : 'audio/mpeg';
  try {
    const basicAuth = 'Basic ' + btoa(`${PROJECT_ID}:${API_TOKEN}`);
    const audioResp = await fetch(recordingUrl, { headers: { Authorization: basicAuth } });
    if (!audioResp.ok) return null;
    const buf = await audioResp.arrayBuffer();
    const filename = `broadcast/${recordingSid}.${ext}`;
    const upResp = await fetch(
      `${SUPABASE_URL}/storage/v1/object/call-audio/${filename}`,
      {
        method: 'POST',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': mimeType,
          'x-upsert': 'true',
        },
        body: buf,
      }
    );
    if (!upResp.ok) return null;
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/call-audio/${filename}`;
    // Save to the library so it also shows up under Mass Call recordings.
    try {
      await sbInsert(env, 'call_recordings', {
        label: `Phone broadcast ${new Date().toLocaleString()}`,
        audio_url: publicUrl,
        source: 'phone',
        mime_type: mimeType,
        size_bytes: buf.byteLength,
        provider_sid: recordingSid,
        created_by: adminAppUserId || null,
      }, 'return=minimal');
    } catch { /* ignore */ }
    return publicUrl;
  } catch {
    return null;
  }
}

export async function onRequestPost(context) {
  const { ok, params } = await validateAndParse(context);
  if (!ok) return laml('<Say>Unauthorized.</Say><Hangup/>');

  const env = context.env;
  const baseUrl = baseUrlFrom(context.request);
  const url = new URL(context.request.url);
  const stepName = url.searchParams.get('step') || 'auth';
  const digit = (params.Digits || '').trim();
  const callSid = params.CallSid || '';
  const sToken = url.searchParams.get('s') || '';

  // Voice/language follow the root menu's settings.
  let voice = 'Polly.Joanna';
  let language = 'en-US';
  const root = await loadMenu(env, null);
  if (root && root.menu) {
    voice = root.menu.greeting_voice || voice;
    language = root.menu.greeting_language || language;
  }
  const S = (t) => say(t, voice, language);

  // ---------------------------------------------------------------
  // STEP: auth — caller-ID match, else ask for a PIN.
  // ---------------------------------------------------------------
  if (stepName === 'auth') {
    const admin = await rpc(env, 'phone_admin_by_number', { p_number: params.From || '' });
    if (admin && admin.id) {
      const session = await signSession(env, {
        adminId: admin.id, name: admin.name, appUserId: admin.app_user_id,
        authMethod: 'caller_id', callSid,
      });
      return laml(
        S(`Welcome ${admin.name || ''}.`) +
        `<Redirect method="POST">${escapeXml(step(baseUrl, 'menu', { s: session }))}</Redirect>`
      );
    }
    // Not recognized → ask for PIN.
    return laml(
      gather(step(baseUrl, 'pin', {}), S('Please enter your broadcast PIN, followed by the pound key.'), { numDigits: 8, timeout: 8 })
      + S('We did not receive a PIN. Goodbye.') + '<Hangup/>'
    );
  }

  // ---------------------------------------------------------------
  // STEP: pin — verify the typed PIN.
  // ---------------------------------------------------------------
  if (stepName === 'pin') {
    const admin = digit ? await rpc(env, 'verify_phone_admin_pin', { p_pin: digit }) : null;
    if (admin && admin.id) {
      const session = await signSession(env, {
        adminId: admin.id, name: admin.name, appUserId: admin.app_user_id,
        authMethod: 'pin', callSid,
      });
      return laml(
        S('Accepted.') +
        `<Redirect method="POST">${escapeXml(step(baseUrl, 'menu', { s: session }))}</Redirect>`
      );
    }
    const attempt = parseInt(url.searchParams.get('a') || '1', 10);
    if (attempt >= 3) {
      return laml(S('That PIN was not recognized. Goodbye.') + '<Hangup/>');
    }
    return laml(
      gather(step(baseUrl, 'pin', { a: attempt + 1 }), S('That PIN was not recognized. Please try again, followed by pound.'), { numDigits: 8, timeout: 8 })
      + '<Hangup/>'
    );
  }

  // ---- everything past this point REQUIRES a valid signed session ----
  const session = await verifySession(env, sToken, callSid);
  if (!session) {
    return laml(S('Your session has expired. Please call again. Goodbye.') + '<Hangup/>');
  }
  const s = sToken; // pass-through

  // ---------------------------------------------------------------
  // STEP: menu — main admin menu.
  // ---------------------------------------------------------------
  if (stepName === 'menu') {
    return laml(
      gather(
        step(baseUrl, 'menu-pick', { s }),
        S('To record and send a voice message to a group, press 1. To listen to recent broadcasts, press 2. To hang up, press 0.'),
      ) + `<Redirect method="POST">${escapeXml(step(baseUrl, 'menu', { s }))}</Redirect>`
    );
  }

  if (stepName === 'menu-pick') {
    if (digit === '1') return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, 'record', { s }))}</Redirect>`);
    if (digit === '2') return laml(`<Redirect method="POST">${escapeXml(baseUrl + '/api/voice/recordings?i=0')}</Redirect>`);
    if (digit === '0') return laml(S('Goodbye.') + '<Hangup/>');
    return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, 'menu', { s }))}</Redirect>`);
  }

  // ---------------------------------------------------------------
  // STEP: record — record the announcement.
  // ---------------------------------------------------------------
  if (stepName === 'record') {
    const action = step(baseUrl, 'recorded', { s });
    return laml(
      S('Record your message after the beep. Press pound when you are finished.') +
      `<Record action="${escapeXml(action)}" method="POST" maxLength="180" finishOnKey="#" playBeep="true"/>` +
      S('We did not receive a recording. Goodbye.') + '<Hangup/>'
    );
  }

  // ---------------------------------------------------------------
  // STEP: recorded — re-host the audio, then play it back for approval.
  // ---------------------------------------------------------------
  if (stepName === 'recorded') {
    let recordingUrl = params.RecordingUrl;
    let recordingSid = params.RecordingSid;
    if (!recordingSid && recordingUrl) {
      const m = String(recordingUrl).match(/recordings\/([a-f0-9-]+)/i);
      if (m) recordingSid = m[1];
    }
    if (!recordingUrl || !recordingSid) {
      return laml(
        S('We did not capture a recording. Let us try again.') +
        `<Redirect method="POST">${escapeXml(step(baseUrl, 'record', { s }))}</Redirect>`
      );
    }
    const publicUrl = await rehostRecording(env, recordingUrl, recordingSid, session.appUserId);
    if (!publicUrl) {
      return laml(
        S('We could not save your recording. Let us try again.') +
        `<Redirect method="POST">${escapeXml(step(baseUrl, 'record', { s }))}</Redirect>`
      );
    }
    return laml(
      gather(
        step(baseUrl, 'rec-pick', { s, audio: publicUrl }),
        S('Here is your recording.') +
        `<Play>${escapeXml(publicUrl)}</Play>` +
        S('To choose who to send it to, press 1. To record it again, press 2.'),
      ) + `<Redirect method="POST">${escapeXml(step(baseUrl, 'record', { s }))}</Redirect>`
    );
  }

  if (stepName === 'rec-pick') {
    const audio = url.searchParams.get('audio') || '';
    if (digit === '2') return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, 'record', { s }))}</Redirect>`);
    // default / 1 → choose group
    return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, 'group', { s, audio }))}</Redirect>`);
  }

  // ---------------------------------------------------------------
  // STEP: group — top-level audience choice.
  // ---------------------------------------------------------------
  if (stepName === 'group') {
    const audio = url.searchParams.get('audio') || '';
    return laml(
      gather(
        step(baseUrl, 'group-pick', { s, audio }),
        S('To send to parents, press 1. To send to staff, press 2.'),
      ) + `<Redirect method="POST">${escapeXml(step(baseUrl, 'group', { s, audio }))}</Redirect>`
    );
  }

  if (stepName === 'group-pick') {
    const audio = url.searchParams.get('audio') || '';
    if (digit === '1') return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, 'parents', { s, audio }))}</Redirect>`);
    if (digit === '2') return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, 'staff', { s, audio }))}</Redirect>`);
    return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, 'group', { s, audio }))}</Redirect>`);
  }

  // ---------------------------------------------------------------
  // STEP: parents — all / by grade / by class.
  // ---------------------------------------------------------------
  if (stepName === 'parents') {
    const audio = url.searchParams.get('audio') || '';
    return laml(
      gather(
        step(baseUrl, 'parents-pick', { s, audio }),
        S('For all parents, press 1. To choose a grade, press 2. To choose a class, press 3.'),
      ) + `<Redirect method="POST">${escapeXml(step(baseUrl, 'parents', { s, audio }))}</Redirect>`
    );
  }

  if (stepName === 'parents-pick') {
    const audio = url.searchParams.get('audio') || '';
    if (digit === '1') {
      return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, 'confirm', { s, audio, at: 'all_parents' }))}</Redirect>`);
    }
    if (digit === '2') return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, 'grade-list', { s, audio, pg: 0 }))}</Redirect>`);
    if (digit === '3') return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, 'class-list', { s, audio, pg: 0 }))}</Redirect>`);
    return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, 'parents', { s, audio }))}</Redirect>`);
  }

  // ---------------------------------------------------------------
  // STEP: staff — all / by position.
  // ---------------------------------------------------------------
  if (stepName === 'staff') {
    const audio = url.searchParams.get('audio') || '';
    return laml(
      gather(
        step(baseUrl, 'staff-pick', { s, audio }),
        S('For all staff, press 1. To choose a position, press 2.'),
      ) + `<Redirect method="POST">${escapeXml(step(baseUrl, 'staff', { s, audio }))}</Redirect>`
    );
  }

  if (stepName === 'staff-pick') {
    const audio = url.searchParams.get('audio') || '';
    if (digit === '1') return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, 'confirm', { s, audio, at: 'staff_all' }))}</Redirect>`);
    if (digit === '2') return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, 'pos-list', { s, audio, pg: 0 }))}</Redirect>`);
    return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, 'staff', { s, audio }))}</Redirect>`);
  }

  // ---------------------------------------------------------------
  // Generic list steps: grade / class / position.
  // ---------------------------------------------------------------
  if (stepName === 'grade-list' || stepName === 'class-list' || stepName === 'pos-list') {
    const audio = url.searchParams.get('audio') || '';
    const pg = Math.max(0, parseInt(url.searchParams.get('pg') || '0', 10) || 0);
    const items = await loadListItems(env, stepName);
    if (!items.length) {
      return laml(S('There are no options available here. Returning.') +
        `<Redirect method="POST">${escapeXml(step(baseUrl, stepName === 'pos-list' ? 'staff' : 'parents', { s, audio }))}</Redirect>`);
    }
    const start = pg * PAGE_SIZE;
    const pageItems = items.slice(start, start + PAGE_SIZE);
    const hasMore = start + PAGE_SIZE < items.length;
    let prompt = '';
    pageItems.forEach((it, i) => { prompt += `For ${speakable(it.name, i + 1)}, press ${i + 1}. `; });
    if (hasMore) prompt += 'For more options, press 9. ';
    prompt += 'To go back, press 0.';
    const pickStep = stepName === 'grade-list' ? 'grade-pick' : stepName === 'class-list' ? 'class-pick' : 'pos-pick';
    return laml(
      gather(
        step(baseUrl, pickStep, { s, audio, pg }),
        S(prompt),
      ) + `<Redirect method="POST">${escapeXml(step(baseUrl, stepName, { s, audio, pg }))}</Redirect>`
    );
  }

  if (stepName === 'grade-pick' || stepName === 'class-pick' || stepName === 'pos-pick') {
    const audio = url.searchParams.get('audio') || '';
    const pg = Math.max(0, parseInt(url.searchParams.get('pg') || '0', 10) || 0);
    const listStep = stepName === 'grade-pick' ? 'grade-list' : stepName === 'class-pick' ? 'class-list' : 'pos-list';
    if (digit === '0') {
      const backTop = stepName === 'pos-pick' ? 'staff' : 'parents';
      return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, backTop, { s, audio }))}</Redirect>`);
    }
    if (digit === '9') {
      return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, listStep, { s, audio, pg: pg + 1 }))}</Redirect>`);
    }
    const n = parseInt(digit, 10);
    const items = await loadListItems(env, listStep);
    const idx = pg * PAGE_SIZE + (n - 1);
    const chosen = Number.isFinite(n) && n >= 1 && n <= PAGE_SIZE ? items[idx] : null;
    if (!chosen) {
      return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, listStep, { s, audio, pg }))}</Redirect>`);
    }
    if (stepName === 'pos-pick') {
      return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, 'confirm', { s, audio, at: 'staff_position', atext: chosen.name, aname: chosen.name }))}</Redirect>`);
    }
    const at = stepName === 'grade-pick' ? 'grade' : 'class';
    return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, 'confirm', { s, audio, at, aid: chosen.id, aname: chosen.name }))}</Redirect>`);
  }

  // ---------------------------------------------------------------
  // STEP: confirm — announce recipient count, require confirm key.
  // ---------------------------------------------------------------
  if (stepName === 'confirm') {
    const audio = url.searchParams.get('audio') || '';
    const at = url.searchParams.get('at') || '';
    const aid = url.searchParams.get('aid') || '';
    const atext = url.searchParams.get('atext') || '';
    const aname = url.searchParams.get('aname') || '';
    if (!isOwnStorageUrl(env, audio) || !at) {
      return laml(S('Something went wrong. Goodbye.') + '<Hangup/>');
    }
    const numbers = await resolveRecipients(env, { audienceType: at, audienceId: aid, audienceText: atext });
    const count = numbers.length;
    const label = audienceLabel({ audienceType: at, audienceName: aname });
    const spokenLabel = speakLabel(label);
    if (count === 0) {
      return laml(S(`There are no phone numbers for ${spokenLabel}. Returning to the menu.`) +
        `<Redirect method="POST">${escapeXml(step(baseUrl, 'menu', { s }))}</Redirect>`);
    }
    return laml(
      gather(
        step(baseUrl, 'send', { s, audio, at, aid, atext, aname }),
        S(`This message will be sent to ${count} ${count === 1 ? 'number' : 'numbers'}, for ${spokenLabel}. To send now, press 1. To cancel, press 2.`),
      ) + `<Redirect method="POST">${escapeXml(step(baseUrl, 'menu', { s }))}</Redirect>`
    );
  }

  // ---------------------------------------------------------------
  // STEP: send — fan out in the background, free the caller.
  // ---------------------------------------------------------------
  if (stepName === 'send') {
    const audio = url.searchParams.get('audio') || '';
    const at = url.searchParams.get('at') || '';
    const aid = url.searchParams.get('aid') || '';
    const atext = url.searchParams.get('atext') || '';
    const aname = url.searchParams.get('aname') || '';

    if (digit !== '1') {
      return laml(S('Cancelled.') + `<Redirect method="POST">${escapeXml(step(baseUrl, 'menu', { s }))}</Redirect>`);
    }
    if (!isOwnStorageUrl(env, audio) || !at) {
      return laml(S('Something went wrong. Goodbye.') + '<Hangup/>');
    }

    const numbers = await resolveRecipients(env, { audienceType: at, audienceId: aid, audienceText: atext });
    const count = numbers.length;
    const label = audienceLabel({ audienceType: at, audienceName: aname });
    const spokenLabel = speakLabel(label);

    if (count === 0) {
      return laml(S('There are no recipients. Goodbye.') + '<Hangup/>');
    }

    const broadcastId = await logBroadcastStart(env, {
      admin_id: session.adminId,
      admin_name: session.name,
      caller_number: params.From || null,
      auth_method: session.authMethod,
      audience_type: at,
      audience_label: label,
      recording_url: audio,
      recipient_count: count,
      status: 'sending',
    });

    // Fan out after we respond so the caller isn't held on the line.
    if (context.waitUntil) {
      context.waitUntil(sendBroadcast(env, {
        numbers, audioUrl: audio, broadcastId, sentBy: session.appUserId,
      }));
    } else {
      await sendBroadcast(env, { numbers, audioUrl: audio, broadcastId, sentBy: session.appUserId });
    }

    return laml(
      S(`Your message is being sent to ${count} ${count === 1 ? 'number' : 'numbers'}, for ${spokenLabel}. Thank you. Goodbye.`) +
      '<Hangup/>'
    );
  }

  // Unknown step → restart.
  return laml(`<Redirect method="POST">${escapeXml(step(baseUrl, 'auth', {}))}</Redirect>`);
}

// Load grade / class / position list items in a stable order.
async function loadListItems(env, listStep) {
  if (listStep === 'grade-list') {
    const rows = await sbSelect(env, 'grades?select=id,name&order=name.asc');
    return (rows || []).map((r) => ({ id: r.id, name: r.name }));
  }
  if (listStep === 'class-list') {
    const rows = await sbSelect(env, 'classes?select=id,name&order=name.asc');
    return (rows || []).map((r) => ({ id: r.id, name: r.name }));
  }
  // pos-list — distinct active staff positions.
  const rows = await sbSelect(env, 'staff_members?select=position&is_active=eq.true&order=position.asc');
  const seen = new Set();
  const out = [];
  for (const r of rows || []) {
    const p = r?.position;
    if (p && !seen.has(p)) { seen.add(p); out.push({ id: p, name: p }); }
  }
  return out;
}

export const onRequestGet = onRequestPost;
