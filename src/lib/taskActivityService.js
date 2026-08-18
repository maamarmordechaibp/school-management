import { supabase } from '@/lib/customSupabaseClient';

/**
 * Task comments + activity history (migration 060). Complements the existing
 * `todos` system — never replaces it. All writes are best-effort.
 */

export async function fetchTaskComments(todoId) {
  if (!todoId) return [];
  const { data, error } = await supabase
    .from('todo_comments')
    .select('*')
    .eq('todo_id', todoId)
    .order('created_at', { ascending: true });
  if (error) { console.error('fetchTaskComments failed:', error); return []; }
  return data || [];
}

export async function addTaskComment(todoId, body, user) {
  if (!todoId || !body?.trim()) return false;
  const name = user?.name || user?.email || 'Staff';
  const { error } = await supabase.from('todo_comments').insert({
    todo_id: todoId, body: body.trim(), created_by: user?.id || null, created_by_name: name,
  });
  if (error) { console.error('addTaskComment failed:', error); return false; }
  logTaskActivity(todoId, 'comment', body.trim().slice(0, 80), user);
  return true;
}

export async function fetchTaskActivity(todoId) {
  if (!todoId) return [];
  const { data, error } = await supabase
    .from('todo_activity')
    .select('*')
    .eq('todo_id', todoId)
    .order('created_at', { ascending: true });
  if (error) { console.error('fetchTaskActivity failed:', error); return []; }
  return data || [];
}

/** Record an activity row. Fire-and-forget; failures are logged only. */
export async function logTaskActivity(todoId, action, detail, user) {
  if (!todoId || !action) return;
  const name = user?.name || user?.email || 'Staff';
  const { error } = await supabase.from('todo_activity').insert({
    todo_id: todoId, action, detail: detail || null, actor_id: user?.id || null, actor_name: name,
  });
  if (error) console.error('logTaskActivity failed:', error);
}
