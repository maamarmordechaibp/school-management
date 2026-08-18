import { supabase } from '@/lib/customSupabaseClient';

/**
 * In-app audit trail (migration 063). Records meaningful, sensitive actions —
 * NOT routine views — so the Activity Log stays useful and low-noise.
 * Best-effort: failures are logged only, never thrown.
 *
 * @param {object} e
 * @param {string} e.action        short verb phrase, e.g. 'Document uploaded'
 * @param {string} [e.details]     human-readable detail line
 * @param {string} [e.entityType]  'student' | 'document' | 'permission' | 'report' | 'task'
 * @param {string} [e.entityId]    id of the affected record
 * @param {string} [e.studentId]   related student id
 * @param {object} [e.actor]       current user ({ id, name, email })
 */
export async function logActivity(e) {
  if (!e?.action) return;
  try {
    await supabase.from('activity_logs').insert({
      action: e.action,
      details: e.details || null,
      actor_id: e.actor?.id || null,
      actor_name: e.actor?.name || e.actor?.email || null,
      entity_type: e.entityType || null,
      entity_id: e.entityId || null,
      student_id: e.studentId || null,
    });
  } catch (err) {
    console.error('logActivity failed:', err);
  }
}
