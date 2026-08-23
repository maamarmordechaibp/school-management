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

/* ------------------------- Call recordings + AI analysis ------------------------- */
export async function listCallConversations(limit = 100) {
  const { data, error } = await supabase
    .from('call_conversations')
    .select('*, phone_extensions(id, ext_number, label)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateCallConversation(id, patch) {
  const { error } = await supabase.from('call_conversations').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteCallConversation(id) {
  const { error } = await supabase.from('call_conversations').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// One-click "Accept all": turn the AI's suggested action items into todos
// (and reminders when a due date is suggested), linked to the matched student,
// then mark the conversation applied. Returns the number of items created.
export async function applyCallSuggestions(conv, user) {
  const items = Array.isArray(conv?.ai_action_items) ? conv.ai_action_items : [];
  const studentId = conv?.matched_student_ids?.[0] || null;
  const studentName = conv?.matched_name || null;
  const assignedTo = conv?.target_user_id || user?.id || null;

  const priorities = new Set(['low', 'normal', 'high', 'urgent']);
  const cleanPriority = (p) => (priorities.has(p) ? p : 'normal');
  const cleanDate = (d) => (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null);

  const todoRows = items.map((it) => ({
    title: (it?.title || 'Follow-up from call').slice(0, 300),
    description: it?.description || null,
    student_id: studentId,
    student_name: studentName,
    category: 'communication',
    priority: cleanPriority(it?.priority),
    status: 'pending',
    due_date: cleanDate(it?.due_date),
    related_type: 'call',
    related_id: conv?.inbound_call_id || null,
    assigned_to: assignedTo,
    created_by: user?.id || null,
    source: 'ai_draft',
  }));

  if (todoRows.length) {
    const { error } = await supabase.from('todos').insert(todoRows);
    if (error) throw new Error(error.message);
  }

  // Reminders only for dated items (reminder_date is required).
  const reminderRows = items
    .filter((it) => cleanDate(it?.due_date))
    .map((it) => ({
      title: (it?.title || 'Follow-up from call').slice(0, 300),
      description: it?.description || null,
      reminder_date: cleanDate(it?.due_date),
      related_type: 'student',
      related_id: studentId,
      related_student_id: studentId,
      related_student_name: studentName,
      priority: cleanPriority(it?.priority),
      status: 'pending',
      created_by: user?.id || null,
      source: 'ai_draft',
    }));

  if (reminderRows.length) {
    const { error } = await supabase.from('reminders').insert(reminderRows);
    if (error) throw new Error(error.message);
  }

  await updateCallConversation(conv.id, { applied: true });
  return todoRows.length;
}
