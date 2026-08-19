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

// Authentic heimishe Chassidishe Yiddish guidance (iVelt / yiddishlabs.com register).
const YIDDISH_STYLE =
  'Write in warm, authentic "heimishe" Chassidishe Yiddish — the natural written Yiddish of the ' +
  'Monsey / Williamsburg / Kiryas Yoel community (the register of iVelt and of yiddishlabs.com reports). ' +
  'CRITICAL rules: (1) Write with NO nekudos / niqqud at all — no pasekh/komets (write א, never אַ or אָ) ' +
  'and no dagesh/rafe (write פ not פּ and not פֿ, ב not בּ, ש not שׁ). Do not leave a single vowel-point; ' +
  'e.g. write סאציאלע (not סאציאַלער), שטאפל (not שטאַפּל), געדאנק (not געדאַנק), אינפארמאציע (not אינפֿאָרמאַציע). ' +
  '(2) NEVER write academic YIVO Yiddish and NEVER write Germanized "daytshmerish" Yiddish, and NEVER let a ' +
  'German word or German letters leak in — specifically never write "Schritt", "nächste", "Eindruck" or ' +
  'any Latin-letter German; use שריט, קומענדיגע, רושם. Always write אידיש (never the YIVO ייִדיש/יידיש). ' +
  '(3) Use heimishe vocabulary and spelling — for example prefer: תלמיד or יונגל (not קינד/סטודענט), ' +
  'באריכט (not רעפּאָרט), געבורטס דאטום (not דאַטע פון געבורט), צושטאנד (not סטאַטוס), אלגעמיינע איבערבליק, ' +
  'שטארקייטן, נקודות, טעותים/גרייזן, פארשריט, פליסיג, פאלגן, אויסהערן, איבערחזר\'ן, אינדערהיים, פארמאגט (not האט, for qualities), ' +
  'ארומגערעדט or דורכגערעדט (not דיסקוטירן), קאנצענטראציע (not קאנצענטרירונג), רואיגע פלעצער, אינדרויסן פון חדר, ' +
  'ווי אויך: ווי, אזוי, טאקע, גאר, זייער, שוין, נאך, אלץ, ארבעטן, קענען, דארפן, אנדערע, בעסער, וויאזוי, אימער. ' +
  '(4) Weave in loshn-koidesh / yeshivishe words heimishe people really use: ב"ה, בעז"ה, בפרט, בכלל, ' +
  'ממש, פשוט, ענין, מצב, התמדה, מדות, כוחות, מצליח, בעזרת השם, כדאי, גורם, שייכות, מיט\'ן אייבערשטנ\'ס הילף. ' +
  '(5) Sound like a warm menahel — natural connectors like "ווי מ\'זאגט", "טאקע", "אזוי ווי", "אדרבה". ' +
  '(6) DATES: give BOTH the Hebrew/loshn-koidesh date and the secular date together, and write the secular ' +
  'month name in ENGLISH letters, e.g. "כ"ט אדר תשפ"ו - March 29, 2026". Write the Hebrew date in gematria ' +
  'letters (כ"ט אלול תשע"ג), NEVER as a Yiddish ordinal number (not 27\'סטן אלול). ' +
  '(7) TITLES: a rebbe/teacher is דער מלמד or הרב [name] (never מורה/הער); a father is ר\' [name]; a mother ' +
  'is די מאמע (or זיין פרוי תחי\'). You may add heimishe honorifics: a boy after his name הי"ו, a rebbe שליט"א, ' +
  'a married woman מרת [name] שתחי\'. ' +
  '(8) SPELLING: use the ending -יג, never -יק — write שטענדיג, וויכטיגער, לעבעדיג, נויטיג, ריכטיג, קומענדיג, ' +
  'יעצטיג, ווייטערדיג. Use אן (not א) before a word that starts with a vowel sound (אן אפוינטמענט). Spell it ' +
  'פאקוס / פאקוסירן (not פוקוס). Never use דיסקוטירן or דיסקוסיע — use שמועס, דורכרעדן, דורכשמועסן, ארומרעדן. ' +
  '(9) Transliterate English terms into Hebrew letters rather than Germanizing them: services → סערוויסעס ' +
  '(not דינסטן), study/studies → לימודים (not שטודיום), age → עידזש, vision → וויזשן. Spell loshn-koidesh and ' +
  'Yiddish learning terms correctly (טייטש, אוצר המילים, פרק). ' +
  '(10) When the source data says "Rabbi", "the Rabbi" or "Rebbi", it means the classroom TEACHER — write ' +
  'דער מלמד (NOT דער רב). Write Jewish first names in loshn-koidesh spelling (משה not מאישע, יעקב, יצחק, שמעון). ' +
  'Prefer a natural loshn-koidesh word over transliterating English when one exists: future → עתיד (not פוטור), ' +
  'take action → טון למעשה; only transliterate English when there is truly no natural heimishe word. ' +
  'Never use stiff, translated, literal-English phrasing.';

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

// English loanwords in Yiddish are written phonetically in HEBREW letters, heimishe-style.
const YIDDISH_ENGLISH_MIX =
  'For English words: heimishe people DO borrow English words, but they write them PHONETICALLY IN HEBREW LETTERS ' +
  '(often in quotes) — NOT in Latin letters. For example: appointment → "אפוינטמענט", check → טשעקן, ' +
  'private → פריוואט, focus → פאקוסירן, social → סאציאל, report card → "רעפאָרט קארד". ' +
  'When a natural heimishe or loshn-koidesh word exists, prefer it and you may put the borrowed word in ' +
  'parentheses in Hebrew letters, e.g., קאנצענטרירן (פאקוסירן), געזעלשאפטליך (סאציאל). ' +
  'NEVER write an English word in Latin letters, and NEVER leak a German word or a German letter (no ä/ü/ß, ' +
  'no "schluss"/"nächste" — use סך הכל and די קומענדיגע שריט).';

// A real report in the exact target voice. The model must imitate its spelling,
// vocabulary and tone — NOT its content.
const YIDDISH_EXEMPLAR = `Imitate the SPELLING, VOCABULARY and TONE of this example exactly (do not copy its content — it is about a different student):

ב"ה

**באריכט איבערן תלמיד: חיים דזשעקאבס**

**אלגעמיינע איבערבליק:**
חיים דזשעקאבס איז א לעבעדיגער און אקטיווער תלמיד, געבוירן דעם 16'טן אויגוסט 2018. זיינע עלטערן, ר' אברהם און זיין פרוי תרני, זענען זייער צוגעלאזן און שטענדיג גרייט צו קאאפערירן און טון אלעס וואס מעגליך אים צו העלפן שטייגן אין זיין אנטוויקלונג. אין דעם באריכט וועלן מיר איבערגיין די לעצטע נייעס ביי חיים'ן, ווי אויך די פלענער און רעקאמענדאציעס פארן קומענדיגן שריט.

**נאטיצן פונעם יעצטיגן מצב:**
- **דאטום:** 29'טן מארץ 2026.
- דער מורה הער מאיער צווייג האט אפגעהאלטן א שמועס מיט די מאמע איבער חיים'ס פארשריט.
- די מאמע האט שוין באשטעלט אן "אפוינטמענט" צו טשעקן זיינע אויגן.
- מען האט דורכגערעדט דעם חשש אז חיים האט שוועריגקייטן זיך צו קאנצענטרירן (פאקוסירן).
- די מאמע זאגט אז ער דארף הילף אין דעם סאציאלן (געזעלשאפטליכן) חלק, אבער זי איז נישט זיכער צי דאס מוז זיין אינדרויסן פון חדר.

**סך הכל:**
חיים איז א תלמיד וואס דארף מער חיזוק און אויפמערקזאמקייט אין געוויסע הינזיכטן. די עלטערן זענען שטענדיג גרייט צו טון אלעס וואס עס פעלט זיך אויס. מיט די הילף פון באשעפער וועלן מיר אינאיינעם קענען געבן פאר חיים די ריכטיגע כלים כדי מצליח צו זיין סיי אין זיינע לימודים און סיי אין זיין געזעלשאפטליכע אנטוויקלונג.

בכבוד רב,
[דיין נאמען]`;

function buildMessages({ student, bundle, audience, language }) {
  const langName = LANGUAGES[language] || LANGUAGES.yi;
  const guide = AUDIENCE_GUIDES[audience] || AUDIENCE_GUIDES.staff;
  const name = student?.hebrew_name || student?.name ||
    [student?.first_name, student?.last_name].filter(Boolean).join(' ') || 'the student';

  const system =
    `You are an experienced, warm school administrator who writes clear, fluent, well-structured student reports. ` +
    `Write the ENTIRE report in ${langName}. Use natural, native phrasing — not a translation. ` +
    (language === 'yi' ? YIDDISH_STYLE + ' ' + YIDDISH_ENGLISH_MIX + '\n\n' + YIDDISH_EXEMPLAR + '\n\n' : '') +
    `${guide} ` +
    `If the data shows the student receives special-education support, therapy or evaluations ` +
    `(fields like special_education, receives_special_ed, or evaluation_requests), the report MUST ` +
    `acknowledge it — for parents warmly and in general terms (that he receives extra help / therapy), ` +
    `for staff and principal in full detail (the evaluations, session progress, monthly reports and plan). ` +
    `Base the report ONLY on the data provided; never invent facts, dates, names or diagnoses. ` +
    `If a section has no data, omit it rather than guessing. ` +
    `Begin with a short HEADER block at the very top — labeled lines for the student's name, today's date, ` +
    `date of birth, address and father's name (omit any line whose data is missing). NEVER include the mother's ` +
    `name anywhere in the report. Do NOT repeat the date of birth inside the narrative prose — it belongs ONLY in ` +
    `the header. After the header, write the full report nicely organized, with short headed sections, a brief ` +
    `summary and a clear "next steps" at the end. ` +
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
  const AI_MODEL = context.env.AI_MODEL || 'gpt-4o';

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
