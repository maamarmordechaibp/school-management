/**
 * Parsha (Torah portion) calendar helpers — self-contained, no external deps.
 *
 * The full ordered list of the 54 parshiyos (diaspora order) is used to drive
 * the Weekly Report selector. "Current week" is estimated from an anchor
 * Shabbos-Bereishis date; because double-parsha and Yom-Tov weeks are not
 * modelled, the auto-selected value is always overridable with the manual
 * selector (as required by the guide).
 */

export const PARSHIYOS = [
  { key: 'bereishis', he: 'בראשית', en: 'Bereishis' },
  { key: 'noach', he: 'נח', en: 'Noach' },
  { key: 'lech_lecha', he: 'לך לך', en: 'Lech Lecha' },
  { key: 'vayeira', he: 'וירא', en: 'Vayeira' },
  { key: 'chayei_sarah', he: 'חיי שרה', en: 'Chayei Sarah' },
  { key: 'toldos', he: 'תולדות', en: 'Toldos' },
  { key: 'vayeitzei', he: 'ויצא', en: 'Vayeitzei' },
  { key: 'vayishlach', he: 'וישלח', en: 'Vayishlach' },
  { key: 'vayeishev', he: 'וישב', en: 'Vayeishev' },
  { key: 'mikeitz', he: 'מקץ', en: 'Mikeitz' },
  { key: 'vayigash', he: 'ויגש', en: 'Vayigash' },
  { key: 'vayechi', he: 'ויחי', en: 'Vayechi' },
  { key: 'shemos', he: 'שמות', en: 'Shemos' },
  { key: 'vaeira', he: 'וארא', en: 'Vaeira' },
  { key: 'bo', he: 'בא', en: 'Bo' },
  { key: 'beshalach', he: 'בשלח', en: 'Beshalach' },
  { key: 'yisro', he: 'יתרו', en: 'Yisro' },
  { key: 'mishpatim', he: 'משפטים', en: 'Mishpatim' },
  { key: 'terumah', he: 'תרומה', en: 'Terumah' },
  { key: 'tetzaveh', he: 'תצוה', en: 'Tetzaveh' },
  { key: 'ki_sisa', he: 'כי תשא', en: 'Ki Sisa' },
  { key: 'vayakhel', he: 'ויקהל', en: 'Vayakhel' },
  { key: 'pekudei', he: 'פקודי', en: 'Pekudei' },
  { key: 'vayikra', he: 'ויקרא', en: 'Vayikra' },
  { key: 'tzav', he: 'צו', en: 'Tzav' },
  { key: 'shemini', he: 'שמיני', en: 'Shemini' },
  { key: 'tazria', he: 'תזריע', en: 'Tazria' },
  { key: 'metzora', he: 'מצורע', en: 'Metzora' },
  { key: 'acharei_mos', he: 'אחרי מות', en: 'Acharei Mos' },
  { key: 'kedoshim', he: 'קדושים', en: 'Kedoshim' },
  { key: 'emor', he: 'אמור', en: 'Emor' },
  { key: 'behar', he: 'בהר', en: 'Behar' },
  { key: 'bechukosai', he: 'בחקותי', en: 'Bechukosai' },
  { key: 'bamidbar', he: 'במדבר', en: 'Bamidbar' },
  { key: 'naso', he: 'נשא', en: 'Naso' },
  { key: 'behaaloscha', he: 'בהעלותך', en: 'Behaaloscha' },
  { key: 'shelach', he: 'שלח', en: 'Shelach' },
  { key: 'korach', he: 'קרח', en: 'Korach' },
  { key: 'chukas', he: 'חקת', en: 'Chukas' },
  { key: 'balak', he: 'בלק', en: 'Balak' },
  { key: 'pinchas', he: 'פינחס', en: 'Pinchas' },
  { key: 'matos', he: 'מטות', en: 'Matos' },
  { key: 'masei', he: 'מסעי', en: 'Masei' },
  { key: 'devarim', he: 'דברים', en: 'Devarim' },
  { key: 'vaeschanan', he: 'ואתחנן', en: 'Vaeschanan' },
  { key: 'eikev', he: 'עקב', en: 'Eikev' },
  { key: 're_eh', he: 'ראה', en: "Re'eh" },
  { key: 'shoftim', he: 'שופטים', en: 'Shoftim' },
  { key: 'ki_seitzei', he: 'כי תצא', en: 'Ki Seitzei' },
  { key: 'ki_savo', he: 'כי תבוא', en: 'Ki Savo' },
  { key: 'nitzavim', he: 'נצבים', en: 'Nitzavim' },
  { key: 'vayeilech', he: 'וילך', en: 'Vayeilech' },
  { key: 'haazinu', he: 'האזינו', en: 'Haazinu' },
  { key: 'vezos_haberachah', he: 'וזאת הברכה', en: 'Vezos Haberachah' },
];

const PARSHA_BY_KEY = Object.fromEntries(PARSHIYOS.map((p) => [p.key, p]));

/** Default anchor: Shabbos Bereishis 5786 (18 Oct 2025). Overridable. */
export const DEFAULT_PARSHA_ANCHOR = '2025-10-18';

export function getParsha(key) {
  return PARSHA_BY_KEY[key] || null;
}

/** Localised label for a parsha key. `lang` = 'he' (default) or 'en'. */
export function parshaLabel(key, lang = 'he') {
  const p = PARSHA_BY_KEY[key];
  if (!p) return key || '';
  return lang === 'en' ? p.en : p.he;
}

/** Return the Sunday (start of week) for a given date, as a YYYY-MM-DD string. */
export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // back up to Sunday
  return d.toISOString().split('T')[0];
}

/** Saturday of the week containing `date`. */
function getSaturday(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + (6 - d.getDay()));
  return d;
}

/**
 * Estimate the current week's parsha key from an anchor Shabbos-Bereishis date.
 * Returns a key from PARSHIYOS. Always overridable via the manual selector.
 */
export function getCurrentParshaKey(anchorDateStr = DEFAULT_PARSHA_ANCHOR, today = new Date()) {
  const anchor = getSaturday(anchorDateStr);
  const current = getSaturday(today);
  const weeks = Math.round((current - anchor) / (7 * 24 * 60 * 60 * 1000));
  const idx = ((weeks % PARSHIYOS.length) + PARSHIYOS.length) % PARSHIYOS.length;
  return PARSHIYOS[idx].key;
}
