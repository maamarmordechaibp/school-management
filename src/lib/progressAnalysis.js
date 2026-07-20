/**
 * Progress analysis — turns per-student 1-5 marks into chart series, trends,
 * and decline detection used for the progress graph + special-ed referral.
 *
 * A "mark" is any 1-5 score with a category and a date. Marks come from the
 * `grades` table (category + score), `farhers` (subject grade) and
 * `weekly_reports` (parsha grade), all normalised to { date, category, score }.
 */

// Category identity: label + a distinct colour for the graph.
export const MARK_CATEGORIES = {
  learning: { label: 'Learning', he: 'לימוד', color: '#2563eb' },
  davening: { label: 'Davening', he: 'דאווענען', color: '#7c3aed' },
  test: { label: 'Test', he: 'טעסט', color: '#db2777' },
  farher: { label: 'Farher', he: 'פארהער', color: '#0d9488' },
  behavior: { label: 'Behavior', he: 'הנהגות', color: '#ea580c' },
  review: { label: 'Review', he: 'חזרה', color: '#65a30d' },
  midos: { label: 'Midos', he: 'מידות', color: '#ca8a04' },
  weekly: { label: 'Weekly (Parsha)', he: 'שבועי', color: '#0891b2' },
  other: { label: 'Other', he: 'אנדערש', color: '#64748b' },
};

export function categoryLabel(cat) {
  return MARK_CATEGORIES[cat]?.label || cat || 'Other';
}
export function categoryColor(cat) {
  return MARK_CATEGORIES[cat]?.color || MARK_CATEGORIES.other.color;
}

const toScore = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
};
const toTs = (d) => {
  const t = new Date(d).getTime();
  return Number.isFinite(t) ? t : null;
};

/**
 * Normalise rows from grades / farhers / weekly_reports into a flat, sorted
 * array of marks: [{ ts, dateLabel, category, score, source }].
 */
export function normalizeMarks({ grades = [], farhers = [], weekly = [] } = {}) {
  const marks = [];

  grades.forEach((g) => {
    const score = toScore(g.score ?? g.grade);
    const ts = toTs(g.date || g.created_at);
    if (score == null || ts == null) return;
    marks.push({ ts, category: g.category || 'other', score, source: 'grade' });
  });

  farhers.forEach((f) => {
    const score = toScore(f.grade);
    const ts = toTs(f.farher_date || f.created_at);
    if (score == null || ts == null) return;
    marks.push({ ts, category: 'farher', score, source: 'farher' });
  });

  weekly.forEach((w) => {
    const score = toScore(w.grade);
    const ts = toTs(w.week_start || w.created_at);
    if (score == null || ts == null) return;
    marks.push({ ts, category: 'weekly', score, source: 'weekly' });
  });

  marks.sort((a, b) => a.ts - b.ts);
  marks.forEach((m) => { m.dateLabel = new Date(m.ts).toLocaleDateString('en-GB'); });
  return marks;
}

/** List of category keys present in a set of marks (in a stable order). */
export function categoriesPresent(marks) {
  const order = Object.keys(MARK_CATEGORIES);
  const set = new Set(marks.map((m) => m.category));
  return order.filter((c) => set.has(c));
}

/**
 * Build a recharts-friendly dataset: one row per date, a numeric field per
 * category. Sparse points are left undefined (use connectNulls on the Line).
 */
export function buildChartData(marks) {
  const byDate = new Map(); // ts -> row
  marks.forEach((m) => {
    const row = byDate.get(m.ts) || { ts: m.ts, dateLabel: m.dateLabel };
    // If several marks share a date+category, average them.
    if (row[m.category] != null) {
      row[`__n_${m.category}`] = (row[`__n_${m.category}`] || 1) + 1;
      row[m.category] = (row[m.category] * (row[`__n_${m.category}`] - 1) + m.score) / row[`__n_${m.category}`];
    } else {
      row[m.category] = m.score;
    }
    byDate.set(m.ts, row);
  });
  return Array.from(byDate.values()).sort((a, b) => a.ts - b.ts);
}

/**
 * Per-category trend + decline count.
 * Returns { [category]: { points:[score], direction:'up'|'down'|'same', declines:number, last, prev } }
 */
export function computeTrends(marks) {
  const byCat = {};
  marks.forEach((m) => {
    (byCat[m.category] = byCat[m.category] || []).push(m.score);
  });
  const out = {};
  Object.entries(byCat).forEach(([cat, points]) => {
    let declines = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i] < points[i - 1]) declines += 1;
    }
    const last = points[points.length - 1];
    const prev = points.length > 1 ? points[points.length - 2] : null;
    let direction = 'same';
    if (prev != null) direction = last > prev ? 'up' : last < prev ? 'down' : 'same';
    out[cat] = { points, direction, declines, last, prev };
  });
  return out;
}

/**
 * Detect categories where the student declined `threshold`+ times.
 * Returns [{ category, label, declines, points, reason }].
 */
export function detectDeclines(marks, threshold = 2) {
  const trends = computeTrends(marks);
  const flagged = [];
  Object.entries(trends).forEach(([cat, t]) => {
    if (t.declines >= threshold) {
      flagged.push({
        category: cat,
        label: categoryLabel(cat),
        declines: t.declines,
        points: t.points,
        reason: `Declined in ${categoryLabel(cat)} ${t.declines} time(s) (${t.points.join('→')}).`,
      });
    }
  });
  return flagged;
}

/** Build a single reason string for a referral email from flagged declines. */
export function declineReason(flagged) {
  if (!flagged || !flagged.length) return '';
  return flagged.map((f) => f.reason).join(' ');
}
