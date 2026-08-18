/**
 * Pure helpers for the student Excel import (Phase 19), extracted so they can be
 * unit-tested without a spreadsheet or database.
 */

/** Pick the first non-empty value from a row for any of the candidate headers. */
export function pickField(row, keys) {
  const norm = {};
  for (const k of Object.keys(row || {})) norm[k.trim().toLowerCase()] = row[k];
  for (const k of keys) {
    const v = norm[String(k).trim().toLowerCase()];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

/**
 * Classify an import row against the DB and the rows seen so far in the file.
 * Returns 'invalid' | 'duplicate' | 'update' | 'new'. Pure — no side effects.
 */
export function classifyImportRow({ externalId, hasName, existsInDb, seenInFile }) {
  if (!hasName) return 'invalid';
  if (externalId && seenInFile) return 'duplicate';
  if (externalId && existsInDb) return 'update';
  return 'new';
}
