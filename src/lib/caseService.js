import { supabase } from '@/lib/customSupabaseClient';

/**
 * Support / case management (migration 067). A case is a broad "matter" for a
 * student; it may optionally link to a special-ed record without duplicating it.
 */

export async function fetchCases(studentId) {
  if (!studentId) return [];
  const { data, error } = await supabase
    .from('support_cases')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchCases failed:', error); return []; }
  return data || [];
}

export async function createCase({ studentId, title, caseType, priority, summary, assignedTo, user }) {
  const { data, error } = await supabase
    .from('support_cases')
    .insert({
      student_id: studentId,
      title: title.trim(),
      case_type: caseType || 'general',
      priority: priority || 'medium',
      summary: summary || null,
      assigned_to: assignedTo || null,
      opened_by: user?.id || null,
    })
    .select()
    .single();
  if (error) { console.error('createCase failed:', error); return { error }; }
  return { data };
}

export async function updateCase(id, patch) {
  const { error } = await supabase.from('support_cases').update(patch).eq('id', id);
  if (error) console.error('updateCase failed:', error);
  return !error;
}

export async function closeCase(id, outcome) {
  return updateCase(id, { status: 'closed', outcome: outcome || null, closed_at: new Date().toISOString() });
}

export async function deleteCase(id) {
  const { error } = await supabase.from('support_cases').delete().eq('id', id);
  if (error) console.error('deleteCase failed:', error);
  return !error;
}

export async function fetchCaseEntries(caseId) {
  if (!caseId) return [];
  const { data, error } = await supabase
    .from('support_case_entries')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true });
  if (error) { console.error('fetchCaseEntries failed:', error); return []; }
  return data || [];
}

export async function addCaseEntry({ caseId, entryType, content, occurredOn, user }) {
  if (!caseId || !content?.trim()) return false;
  const { error } = await supabase.from('support_case_entries').insert({
    case_id: caseId,
    entry_type: entryType || 'note',
    content: content.trim(),
    occurred_on: occurredOn || new Date().toISOString().slice(0, 10),
    created_by: user?.id || null,
    created_by_name: user?.name || user?.first_name || user?.email || null,
  });
  if (error) console.error('addCaseEntry failed:', error);
  return !error;
}
