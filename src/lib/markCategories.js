/**
 * Mark categories — loads the trackable "kinds of marks" (built-in + custom)
 * from the mark_categories table, with a safe fallback to the built-in colours
 * defined in progressAnalysis when the table isn't available yet.
 */

import { supabase } from '@/lib/customSupabaseClient';
import { MARK_CATEGORIES } from '@/lib/progressAnalysis';

// Built-in fallback list (the 7 grade categories) derived from the colour map.
const BUILTIN_KEYS = ['learning', 'davening', 'test', 'farher', 'behavior', 'review', 'midos'];
export const BUILTIN_MARK_CATEGORIES = BUILTIN_KEYS.map((key, i) => ({
  key,
  label: MARK_CATEGORIES[key]?.label || key,
  he: MARK_CATEGORIES[key]?.he || '',
  color: MARK_CATEGORIES[key]?.color || '#64748b',
  sort_order: (i + 1) * 10,
  is_builtin: true,
  is_active: true,
}));

/** Load active categories for the Grades dropdown (custom + built-in). */
export async function loadMarkCategories() {
  try {
    const { data, error } = await supabase
      .from('mark_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    if (data && data.length) return data;
  } catch (e) {
    /* table may not exist yet */
  }
  return BUILTIN_MARK_CATEGORIES;
}

/**
 * Build a { key: { label, color } } lookup for charts, merging the colour-map
 * defaults (covers derived kinds like weekly/farher/other) with DB overrides
 * and any custom categories.
 */
export function buildCategoryMeta(rows = []) {
  const meta = {};
  Object.entries(MARK_CATEGORIES).forEach(([key, v]) => {
    meta[key] = { label: v.label, color: v.color };
  });
  rows.forEach((r) => {
    meta[r.key] = { label: r.label || r.key, color: r.color || '#64748b' };
  });
  return meta;
}
