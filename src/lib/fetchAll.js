import { supabase } from '@/lib/customSupabaseClient';

/**
 * Fetch ALL rows from a Supabase query, transparently paging past the
 * PostgREST hard limit (default 1000 rows per request).
 *
 * Supabase silently caps any `.select()` at ~1000 rows, which means large
 * tables (issues, call logs, payments, eventually students) would load
 * incompletely and searches/filters would miss records. This helper pages
 * through the full result set using `.range()` until everything is loaded.
 *
 * Usage:
 *   const students = await fetchAllRows(() =>
 *     supabase.from('students').select('*').order('last_name')
 *   );
 *
 * @param {() => any} queryFactory  A function that returns a fresh Supabase
 *   query builder each time it's called (so we can apply a new .range()).
 * @param {number} [pageSize=1000]  Rows per page.
 * @returns {Promise<Array>} All rows concatenated.
 */
export async function fetchAllRows(queryFactory, pageSize = 1000) {
  let from = 0;
  let all = [];

  // Safety cap to avoid infinite loops if something goes wrong (50k rows).
  const maxPages = 50;
  for (let page = 0; page < maxPages; page++) {
    const to = from + pageSize - 1;
    const { data, error } = await queryFactory().range(from, to);
    if (error) throw error;
    if (!data || data.length === 0) break;

    all = all.concat(data);
    if (data.length < pageSize) break; // last page reached
    from += pageSize;
  }

  return all;
}

export default fetchAllRows;
