import { supabase } from '@/lib/customSupabaseClient';

/**
 * Generic external-sync helpers (migration 065). Infrastructure only — there is
 * no specific SIS/office integration here. A future integration can use these
 * to record runs and map local <-> external ids. Admin/principal RLS applies.
 */

/** List configured connections. */
export async function fetchSyncConnections() {
  const { data, error } = await supabase
    .from('sync_connections')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchSyncConnections failed:', error); return []; }
  return data || [];
}

/** Recent sync runs (optionally for one connection). */
export async function fetchSyncLogs(connectionId, { limit = 50 } = {}) {
  let q = supabase.from('sync_logs').select('*').order('started_at', { ascending: false }).limit(limit);
  if (connectionId) q = q.eq('connection_id', connectionId);
  const { data, error } = await q;
  if (error) { console.error('fetchSyncLogs failed:', error); return []; }
  return data || [];
}

/** Open a sync run; returns the log id to finish later. */
export async function startSyncRun({ connectionId, direction = 'inbound', entityType }) {
  const { data, error } = await supabase
    .from('sync_logs')
    .insert({ connection_id: connectionId || null, direction, entity_type: entityType || null, status: 'running' })
    .select('id')
    .single();
  if (error) { console.error('startSyncRun failed:', error); return null; }
  return data.id;
}

/** Close a sync run with final counts/status. */
export async function finishSyncRun(logId, { status = 'success', processed = 0, failed = 0, error = null, detail = {} } = {}) {
  if (!logId) return false;
  const { error: err } = await supabase
    .from('sync_logs')
    .update({
      status, records_processed: processed, records_failed: failed,
      error, detail, finished_at: new Date().toISOString(),
    })
    .eq('id', logId);
  if (err) console.error('finishSyncRun failed:', err);
  return !err;
}

/** Map a local record to an external id (idempotent). */
export async function upsertExternalRef({ connectionId, entityType, localId, externalId }) {
  const { error } = await supabase
    .from('external_refs')
    .upsert(
      { connection_id: connectionId || null, entity_type: entityType, local_id: localId, external_id: externalId },
      { onConflict: 'connection_id,entity_type,external_id' }
    );
  if (error) console.error('upsertExternalRef failed:', error);
  return !error;
}

/** Resolve a local id from an external id, or null. */
export async function resolveLocalId({ connectionId, entityType, externalId }) {
  let q = supabase.from('external_refs').select('local_id').eq('entity_type', entityType).eq('external_id', externalId);
  if (connectionId) q = q.eq('connection_id', connectionId);
  const { data, error } = await q.maybeSingle();
  if (error) { console.error('resolveLocalId failed:', error); return null; }
  return data?.local_id || null;
}
