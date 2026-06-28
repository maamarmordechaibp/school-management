/**
 * Phone-system data access. Reads/writes the IVR + extension + device +
 * voicemail tables directly via Supabase. RLS enforces that only the principal
 * can write the configuration tables; any staff member can read.
 */
import { supabase } from '@/lib/customSupabaseClient';

/* ------------------------- Extensions ------------------------- */
export async function listExtensions() {
  const { data, error } = await supabase
    .from('phone_extensions')
    .select('*, staff_members(id, full_name, hebrew_name, position), app_users(id, name, email)')
    .order('sort_order', { ascending: true })
    .order('ext_number', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function saveExtension(ext) {
  const payload = { ...ext };
  delete payload.staff_members;
  delete payload.app_users;
  const { data, error } = await supabase
    .from('phone_extensions')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteExtension(id) {
  const { error } = await supabase.from('phone_extensions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ------------------------- Devices ------------------------- */
export async function listDevices() {
  const { data, error } = await supabase
    .from('phone_devices')
    .select('*, phone_extensions(id, ext_number, label)')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function saveDevice(device) {
  const payload = { ...device };
  delete payload.phone_extensions;
  const { data, error } = await supabase
    .from('phone_devices')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteDevice(id) {
  const { error } = await supabase.from('phone_devices').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ------------------------- IVR menus + options ------------------------- */
export async function listMenus() {
  const { data, error } = await supabase
    .from('ivr_menus')
    .select('*')
    .order('is_root', { ascending: false })
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function listOptions(menuId) {
  const { data, error } = await supabase
    .from('ivr_options')
    .select('*')
    .eq('menu_id', menuId)
    .order('sort_order', { ascending: true })
    .order('digit', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function saveMenu(menu) {
  const { data, error } = await supabase
    .from('ivr_menus')
    .upsert(menu, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteMenu(id) {
  const { error } = await supabase.from('ivr_menus').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function saveOption(option) {
  const { data, error } = await supabase
    .from('ivr_options')
    .upsert(option, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteOption(id) {
  const { error } = await supabase.from('ivr_options').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ------------------------- Voicemails ------------------------- */
export async function listVoicemails() {
  const { data, error } = await supabase
    .from('voicemails')
    .select('*, phone_extensions(id, ext_number, label)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function markVoicemailRead(id, isRead = true) {
  const { error } = await supabase.from('voicemails').update({ is_read: isRead }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteVoicemail(id) {
  const { error } = await supabase.from('voicemails').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ------------------------- Inbound call activity ------------------------- */
export async function listInboundCalls(limit = 100) {
  const { data, error } = await supabase
    .from('inbound_calls')
    .select('*, phone_extensions(id, ext_number, label)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

/* ------------------------- Call-in broadcast admins ------------------------- */
// People authorized to CALL THE SCHOOL and trigger a mass voice broadcast.
// Never selects pin_hash; the PIN is write-only via set_phone_admin_pin RPC.
export async function listBroadcastAdmins() {
  const { data, error } = await supabase
    .from('phone_broadcast_admins')
    .select('id, name, phone, app_user_id, staff_member_id, is_active, pin_hash, created_at')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  // Expose only whether a PIN is set, not the hash itself.
  return (data || []).map(({ pin_hash, ...rest }) => ({ ...rest, has_pin: !!pin_hash }));
}

export async function saveBroadcastAdmin(admin) {
  const payload = { ...admin };
  delete payload.has_pin;
  delete payload.pin; // PINs are set separately via setBroadcastAdminPin
  const { data, error } = await supabase
    .from('phone_broadcast_admins')
    .upsert(payload, { onConflict: 'id' })
    .select('id, name, phone, app_user_id, staff_member_id, is_active')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBroadcastAdmin(id) {
  const { error } = await supabase.from('phone_broadcast_admins').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// Set or clear an admin's PIN. Pass an empty string to clear it.
export async function setBroadcastAdminPin(adminId, pin) {
  const { error } = await supabase.rpc('set_phone_admin_pin', { p_admin_id: adminId, p_pin: pin || '' });
  if (error) throw new Error(error.message);
}

// Audit log: who called in and blasted which group.
export async function listPhoneBroadcasts(limit = 100) {
  const { data, error } = await supabase
    .from('phone_broadcasts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

/* ------------------------- Audio upload (IVR greetings) ------------------------- */
export async function uploadAudio(file, prefix = 'ivr') {
  if (!file) throw new Error('No file provided');
  const ext = (file.name.split('.').pop() || 'mp3').toLowerCase();
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from('call-audio')
    .upload(path, file, { contentType: file.type || 'audio/mpeg', upsert: false });
  if (upErr) throw new Error(upErr.message);
  const { data: pub } = supabase.storage.from('call-audio').getPublicUrl(path);
  return pub.publicUrl;
}
