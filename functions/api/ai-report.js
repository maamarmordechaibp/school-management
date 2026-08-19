/**
 * Cloudflare Pages Function - /api/ai-report
 *
 * Generates a fluent, audience-tailored narrative report about ONE student by
 * analysing the data the caller already has access to (notes, assessments,
 * communication, tasks, plans, special-ed, cases …). The client assembles the
 * bundle (so Supabase RLS already governs what it contains) and this endpoint
 * only builds the prompt and calls the model.
 *
 * Environment variables (set in Cloudflare Pages):
 *   AI_API_KEY    — required. Key for an OpenAI-compatible chat API.
 *   AI_BASE_URL   — optional. Default https://api.openai.com/v1
 *   AI_MODEL      — optional. Default gpt-4o-mini
 *   SUPABASE_URL / SUPABASE_SERVICE_KEY — used by the shared auth helper.
 */

import { requireRole, rateLimit, logAudit, STAFF_ROLES } from '../_lib/auth.js';

const HEADERS = { 'Content-Type': 'application/json' };

const LANGUAGES = {
  yi: 'Yiddish',
  he: 'Hebrew',
  en: 'English',
};

// Authentic heimishe Chassidishe Yiddish guidance (iVelt / Kave-Shtiebel register).
const YIDDISH_STYLE =
  'Write in warm, authentic "heimishe" Chassidishe Yiddish — the natural spoken Yiddish of the ' +
  'Monsey / Williamsburg / Kiryas Yoel community, the register used on iVelt and Kave Shtiebel. ' +
  'This is CRITICAL: do NOT write academic YIVO Yiddish and do NOT write Germanized "daytshmerish" ' +
  'Yiddish. Use traditional heimishe spelling and words, for example: אידיש (not ייִדיש), ווי, ' +
  'אזוי, טאקע, גאר, זייער, שוין, נאך, אלץ, ארבעטן, קענען, דארפן, אנדערע, בעסער. ' +
  'Naturally weave in the loshn-koidesh / yeshivishe words that heimishe people really use in speech: ' +
  'ב"ה, בעז"ה, בפרט, בכלל, ממש, פשוט, ענין, מצב, התמדה, מדות, כוחות, מצליח, בעזרת השם, לכתחילה. ' +
  'Sound like a warm menahel actually talking to heimishe parents — use natural connectors such as ' +
  '"ווי מ\'זאגט", "טאקע", "אזוי ווי", "אדרבה". Never transliterate an English word when a natural ' +
  'Yiddish word exists, and never use stiff, translated, literal-English phrasing.';

const AUDIENCE_GUIDES = {
  parents:
    'The reader is the student\'s PARENTS. Give the BIG PICTURE, not every detail. Warm, respectful and ' +
    'encouraging. Lead with the child\'s overall matzav and main strengths, then the 1–3 most important points ' +
    'and concrete ways the parents can help at home. Summarize — do NOT list every call, note or meeting. ' +
    'Keep it readable and relatively short. Avoid clinical jargon, internal staff-only remarks and raw diagnostic labels.',
  tutor:
    'The reader is a TUTOR / mentor who works with the student. Focus on the academic/learning picture: current level, ' +
    'what is working, the specific skills to target next, recent session progress, and the current plan. Practical and specific.',
  staff:
    'The reader is SCHOOL STAFF (teacher / coordinator) who needs the FULL nitty-gritty. Be thorough and specific: ' +
    'go through every discussion we had (each call and meeting with its date and what was said/decided), every concern ' +
    'or issue and its current status, all assessments, interventions, open tasks and follow-ups. Do not omit details that ' +
    'appear in the data — but keep it organized under clear headed sections, and end with concrete next steps and who is responsible.',
  principal:
    'The reader is the PRINCIPAL / administration. A thorough but organized executive picture: the situation, exactly what ' +
    'has been done (with specifics and dates), who is responsible, the open risks, and the recommended next steps.',
};

// When writing Yiddish, keep natural English terms in English (Latin) letters, iVelt-style.
const YIDDISH_ENGLISH_MIX =
  'IMPORTANT for the English words: heimishe people mix English words into Yiddish and write those words in ENGLISH ' +
  '(Latin letters) right inside the Yiddish sentence — exactly like posts on iVelt. When a term is one that heimishe ' +
  'people normally say in English, keep it in English letters; do NOT translate it into Yiddish and do NOT spell it in ' +
  'Hebrew letters. This applies to people\'s and places\' names and to everyday terms such as evaluation, IEP, speech, OT, ' +
  'reading level, principal, meeting, appointment, behavior, test, grade, progress, schedule, phone, email. Keep the ' +
  'sentence flowing naturally with the English word embedded (e.g., "מ\'האט געהאט א meeting וועגן זיין reading level").';

function buildMessages({ student, bundle, audience, language }) {
  const langName = LANGUAGES[language] || LANGUAGES.yi;
  const guide = AUDIENCE_GUIDES[audience] || AUDIENCE_GUIDES.staff;
  const name = student?.hebrew_name || student?.name ||
    [student?.first_name, student?.last_name].filter(Boolean).join(' ') || 'the student';

  const system =
    `You are an experienced, warm school administrator who writes clear, fluent, well-structured student reports. ` +
    `Write the ENTIRE report in ${langName}. Use natural, native phrasing — not a translation. ` +
    (language === 'yi' ? YIDDISH_STYLE + ' ' + YIDDISH_ENGLISH_MIX + ' ' : '') +
    `${guide} ` +
    `Base the report ONLY on the data provided; never invent facts, dates, names or diagnoses. ` +
    `If a section has no data, omit it rather than guessing. ` +
    `Organize with short headed sections and a brief summary at the top and a clear "next steps" at the end. ` +
    `Keep it honest, kind and actionable.`;

  const userMsg =
    `Write a report about ${name} for the audience described in the system message.\n\n` +
    `Here is all the information available (JSON). Analyse everything and synthesize it — ` +
    `do not just list it back:\n\n` +
    JSON.stringify(bundle, null, 2);

  return [
    { role: 'system', content: system },
    { role: 'user', content: userMsg },
  ];
}

export async function onRequestPost(context) {
  const AI_API_KEY = context.env.AI_API_KEY;
  const AI_BASE_URL = (context.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const AI_MODEL = context.env.AI_MODEL || 'gpt-4o-mini';

  // --- Auth: any school staff role may generate ---
  const auth = await requireRole(context, 'ai-report', STAFF_ROLES);
  if (auth.response) return auth.response;
  const { user, role } = auth;

  // --- Rate limit: 20 generations / 5 min / user ---
  const rl = rateLimit(context, user.id, 20, 5 * 60 * 1000);
  if (!rl.ok) {
    await logAudit(context, { endpoint: 'ai-report', caller_user_id: user.id, caller_email: user.email, caller_role: role, status: 'denied', status_code: 429, reason: 'rate_limited' });
    return new Response(JSON.stringify({ error: 'Too many requests', retryAfter: rl.retryAfter }), { status: 429, headers: { ...HEADERS, 'Retry-After': String(rl.retryAfter) } });
  }

  if (!AI_API_KEY) {
    return new Response(JSON.stringify({ error: 'AI is not configured. An administrator must set AI_API_KEY in the hosting environment.' }), { status: 503, headers: HEADERS });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: HEADERS });
  }

  const { student, bundle, audience = 'staff', language = 'yi' } = body || {};
  if (!student || !bundle) {
    return new Response(JSON.stringify({ error: 'student and bundle are required' }), { status: 400, headers: HEADERS });
  }

  try {
    const resp = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_API_KEY}` },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.4,
        messages: buildMessages({ student, bundle, audience, language }),
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text().catch(() => '');
      await logAudit(context, { endpoint: 'ai-report', caller_user_id: user.id, caller_email: user.email, caller_role: role, status: 'error', status_code: resp.status, reason: 'ai_api_error' });
      return new Response(JSON.stringify({ error: `AI request failed (HTTP ${resp.status})`, detail: detail.slice(0, 500) }), { status: 502, headers: HEADERS });
    }

    const data = await resp.json();
    const report = data?.choices?.[0]?.message?.content?.trim();
    if (!report) {
      return new Response(JSON.stringify({ error: 'AI returned an empty report' }), { status: 502, headers: HEADERS });
    }

    await logAudit(context, { endpoint: 'ai-report', caller_user_id: user.id, caller_email: user.email, caller_role: role, status: 'allowed', status_code: 200, reason: 'ok', request_meta: { audience, language, model: AI_MODEL } });
    return new Response(JSON.stringify({ report }), { status: 200, headers: HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'AI request failed', detail: String(err?.message || err).slice(0, 300) }), { status: 500, headers: HEADERS });
  }
}
