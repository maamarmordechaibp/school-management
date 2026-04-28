/**
 * Voice-call service. POSTs to /api/send-call (Cloudflare Pages Function),
 * which then dials via SignalWire. The frontend NEVER touches the API token.
 */
import { supabase } from '@/lib/customSupabaseClient';

async function authedFetch(url, args) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Not signed in');
  const resp = await fetch(url, {
    ...args,
    headers: {
      'Content-Type': 'application/json',
      ...(args?.headers || {}),
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.error || `Request failed (HTTP ${resp.status})`);
  return data;
}

/**
 * Place one or more outbound calls. Use either `message` (TTS) OR `audioUrl`
 * (a public URL to MP3/WAV). audioUrl wins if both are given.
 */
export async function sendCall(args) {
  return authedFetch('/api/send-call', { method: 'POST', body: JSON.stringify(args) });
}

/**
 * Trigger a call to YOUR phone so you can record a message after the beep.
 * The recording is saved to call_recordings and shows up in the library.
 */
export async function recordByPhone({ to, label }) {
  return authedFetch('/api/record-by-phone', { method: 'POST', body: JSON.stringify({ to, label }) });
}

/**
 * List saved recordings.
 */
export async function listRecordings() {
  const { data, error } = await supabase
    .from('call_recordings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Delete a recording (DB row + storage file).
 */
export async function deleteRecording(recording) {
  // Best-effort: delete the storage object
  try {
    const url = recording.audio_url || '';
    const idx = url.indexOf('/call-audio/');
    if (idx !== -1) {
      const path = url.slice(idx + '/call-audio/'.length);
      await supabase.storage.from('call-audio').remove([path]);
    }
  } catch (e) {
    console.warn('Storage delete failed:', e);
  }
  const { error } = await supabase.from('call_recordings').delete().eq('id', recording.id);
  if (error) throw new Error(error.message);
}

/**
 * Upload an audio file (MP3/WAV/M4A/OGG) and create a call_recordings row.
 * Returns the inserted recording row.
 */
export async function uploadRecording({ file, label, userId }) {
  if (!file) throw new Error('No file provided');
  const ext = (file.name.split('.').pop() || 'mp3').toLowerCase();
  const safeName = `upload/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from('call-audio')
    .upload(safeName, file, { contentType: file.type || 'audio/mpeg', upsert: false });
  if (upErr) throw new Error(upErr.message);

  const { data: pub } = supabase.storage.from('call-audio').getPublicUrl(safeName);
  const audioUrl = pub.publicUrl;

  const { data: row, error: insErr } = await supabase
    .from('call_recordings')
    .insert({
      label: label || file.name,
      audio_url: audioUrl,
      source: 'upload',
      mime_type: file.type || 'audio/mpeg',
      size_bytes: file.size,
      created_by: userId || null,
    })
    .select()
    .single();
  if (insErr) throw new Error(insErr.message);
  return row;
}
