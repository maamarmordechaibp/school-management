import { supabase } from '@/lib/customSupabaseClient';

/**
 * In-app notification helpers (migration 055).
 * These complement — never replace — the existing email notifications.
 */

/** Fetch the most recent notifications for a user. */
export async function fetchNotifications(userId, { limit = 30 } = {}) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('fetchNotifications failed:', error);
    return [];
  }
  return data || [];
}

/** Count unread notifications for a user. */
export async function fetchUnreadCount(userId) {
  if (!userId) return 0;
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) {
    console.error('fetchUnreadCount failed:', error);
    return 0;
  }
  return count || 0;
}

/** Mark a single notification read. */
export async function markNotificationRead(id) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.error('markNotificationRead failed:', error);
  return !error;
}

/** Mark every unread notification for a user read. */
export async function markAllNotificationsRead(userId) {
  if (!userId) return false;
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) console.error('markAllNotificationsRead failed:', error);
  return !error;
}

/**
 * Create a notification for a recipient. Best-effort: failures are logged,
 * never thrown, so callers (e.g. task assignment) never break on a
 * notification error.
 *
 * @param {object} n
 * @param {string} n.userId        recipient app_users.id (required)
 * @param {string} n.title         short headline (required)
 * @param {string} [n.body]        optional detail line
 * @param {string} [n.type]        category, e.g. 'task_assigned'
 * @param {string} [n.priority]    'low' | 'normal' | 'high'
 * @param {string} [n.linkType]    Dashboard view id to open, e.g. 'todos'
 * @param {string} [n.linkId]      record id for the deep link
 * @param {string} [n.studentId]   related student id
 * @param {string} [n.createdBy]   author app_users.id
 */
export async function createNotification(n) {
  if (!n?.userId || !n?.title) return false;
  const { error } = await supabase.from('notifications').insert({
    user_id: n.userId,
    title: n.title,
    body: n.body || null,
    type: n.type || 'admin_alert',
    priority: n.priority || 'normal',
    link_type: n.linkType || null,
    link_id: n.linkId || null,
    related_student_id: n.studentId || null,
    created_by: n.createdBy || null,
  });
  if (error) console.error('createNotification failed:', error);
  return !error;
}
