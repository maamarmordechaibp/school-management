/**
 * Shared 1-5 grade colour scale used by Grades, Farhers, Evaluations and the
 * Class Overview. 5 = Excellent (green) … 1 = Weak (red).
 */

export const GRADE_SCALE = [
  { value: 5, label: 'Excellent', he: 'מצוין', bg: 'bg-green-500', text: 'text-white', soft: 'bg-green-100 text-green-800', hex: '#22c55e' },
  { value: 4, label: 'Good', he: 'טוב', bg: 'bg-lime-500', text: 'text-white', soft: 'bg-lime-100 text-lime-800', hex: '#84cc16' },
  { value: 3, label: 'Average', he: 'בינוני', bg: 'bg-yellow-400', text: 'text-slate-900', soft: 'bg-yellow-100 text-yellow-800', hex: '#facc15' },
  { value: 2, label: 'Below', he: 'חלש', bg: 'bg-orange-500', text: 'text-white', soft: 'bg-orange-100 text-orange-800', hex: '#f97316' },
  { value: 1, label: 'Weak', he: 'חלש מאוד', bg: 'bg-red-500', text: 'text-white', soft: 'bg-red-100 text-red-800', hex: '#ef4444' },
];

const BY_VALUE = Object.fromEntries(GRADE_SCALE.map((g) => [g.value, g]));

export function gradeInfo(value) {
  const n = Number(value);
  return BY_VALUE[n] || null;
}

/** Tailwind classes for a small colour-coded badge for a 1-5 score. */
export function gradeSoftClass(value) {
  return gradeInfo(value)?.soft || 'bg-slate-100 text-slate-600';
}

/** Solid background class (for selectable buttons / filled chips). */
export function gradeSolidClass(value) {
  const g = gradeInfo(value);
  return g ? `${g.bg} ${g.text}` : 'bg-slate-200 text-slate-600';
}

/**
 * Map an average 1-5 score to a coarse class-level indicator.
 * >= 4 → green (top), >= 2.5 → orange (average), else red (weaker).
 */
export function levelFromAverage(avg) {
  if (avg == null || Number.isNaN(avg)) {
    return { level: 'none', label: 'No data', he: 'אין נתונים', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-300', hex: '#cbd5e1' };
  }
  if (avg >= 4) return { level: 'top', label: 'Top', he: 'מעולה', bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', hex: '#22c55e' };
  if (avg >= 2.5) return { level: 'average', label: 'Average', he: 'בינוני', bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500', hex: '#f97316' };
  return { level: 'weak', label: 'Needs attention', he: 'חלש', bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500', hex: '#ef4444' };
}
