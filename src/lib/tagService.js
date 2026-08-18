import { supabase } from '@/lib/customSupabaseClient';

/**
 * Administrator-managed tags (migration 054).
 */

/** All tags (optionally only active), ordered for display. */
export async function fetchTags({ activeOnly = false } = {}) {
  let q = supabase.from('tags').select('*').order('sort_order', { ascending: true }).order('name', { ascending: true });
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) {
    console.error('fetchTags failed:', error);
    return [];
  }
  return data || [];
}

/** Tags assigned to one student (joined with the tag catalog). */
export async function fetchStudentTags(studentId) {
  if (!studentId) return [];
  const { data, error } = await supabase
    .from('student_tags')
    .select('id, tag_id, tags(id, name, color, description)')
    .eq('student_id', studentId);
  if (error) {
    console.error('fetchStudentTags failed:', error);
    return [];
  }
  return (data || []).map((row) => ({ linkId: row.id, ...row.tags }));
}

/** Assign a tag to a student (idempotent via unique constraint). */
export async function assignTag(studentId, tagId, createdBy) {
  const { error } = await supabase
    .from('student_tags')
    .upsert({ student_id: studentId, tag_id: tagId, created_by: createdBy || null }, { onConflict: 'student_id,tag_id' });
  if (error) console.error('assignTag failed:', error);
  return !error;
}

/** Remove a tag from a student. */
export async function removeTag(studentId, tagId) {
  const { error } = await supabase
    .from('student_tags')
    .delete()
    .eq('student_id', studentId)
    .eq('tag_id', tagId);
  if (error) console.error('removeTag failed:', error);
  return !error;
}

/** Create a new tag. */
export async function createTag({ name, color, description, createdBy }) {
  const { data, error } = await supabase
    .from('tags')
    .insert({ name: name.trim(), color: color || '#64748B', description: description || null, created_by: createdBy || null })
    .select()
    .single();
  if (error) {
    console.error('createTag failed:', error);
    return { error };
  }
  return { data };
}

/** Update an existing tag. */
export async function updateTag(id, patch) {
  const { error } = await supabase.from('tags').update(patch).eq('id', id);
  if (error) console.error('updateTag failed:', error);
  return !error;
}

/** Delete a tag (also removes its student links via ON DELETE CASCADE). */
export async function deleteTag(id) {
  const { error } = await supabase.from('tags').delete().eq('id', id);
  if (error) console.error('deleteTag failed:', error);
  return !error;
}

/** student_id -> [{id,name,color}] map for a list of students (single query). */
export async function fetchTagsForStudents(studentIds) {
  if (!studentIds || studentIds.length === 0) return {};
  const { data, error } = await supabase
    .from('student_tags')
    .select('student_id, tags(id, name, color)')
    .in('student_id', studentIds);
  if (error) {
    console.error('fetchTagsForStudents failed:', error);
    return {};
  }
  const map = {};
  for (const row of data || []) {
    if (!row.tags) continue;
    (map[row.student_id] = map[row.student_id] || []).push(row.tags);
  }
  return map;
}
