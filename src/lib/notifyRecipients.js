/**
 * notifyRecipients — builds the list of "who can be notified" recipient groups
 * used by <StudentNotifyModal>. Pulls staff from app_users + special_ed_staff,
 * and (optionally) the student's parents from the students table.
 *
 * Returns an array of groups:
 *   { key, label, members: [{ name, email, role }] }
 * Groups with no valid emails are omitted so the UI only shows what it can send.
 */

import { supabase } from '@/lib/customSupabaseClient';

const isEmail = (e) => typeof e === 'string' && e.includes('@');

const displayName = (u) =>
  (u.name && u.name.trim()) ||
  [u.first_name, u.last_name].filter(Boolean).join(' ').trim() ||
  u.email ||
  'Staff';

/** Fetch every recipient group. Pass a studentId to also include parents. */
export async function fetchRecipientGroups(studentId = null) {
  const groups = [];

  // --- Staff from app_users -------------------------------------------------
  const { data: users } = await supabase
    .from('app_users')
    .select('id, name, first_name, last_name, email, role, is_active')
    .eq('is_active', true);

  const activeUsers = (users || []).filter((u) => isEmail(u.email));

  const bucket = (label, key, match) => {
    const members = activeUsers
      .filter((u) => match(String(u.role || '')))
      .map((u) => ({ name: displayName(u), email: u.email, role: u.role }));
    if (members.length) groups.push({ key, label, members });
  };

  bucket('Principals', 'principals', (r) => r.startsWith('principal') || r === 'menahal');
  bucket('Admin / Office', 'admin', (r) => r === 'admin');
  bucket('Teachers', 'teachers', (r) => r.startsWith('teacher'));
  bucket('Tutors', 'tutors', (r) => r === 'tutor');

  // --- Special-education staff ---------------------------------------------
  const { data: sped } = await supabase
    .from('special_ed_staff')
    .select('id, name, hebrew_name, email, role, is_active')
    .eq('is_active', true);

  const spedMembers = (sped || [])
    .filter((s) => isEmail(s.email))
    .map((s) => ({ name: s.name || s.hebrew_name || 'Special Ed', email: s.email, role: s.role }));
  if (spedMembers.length) {
    groups.push({ key: 'special_ed', label: 'Special Education', members: spedMembers });
  }

  // --- Parents (per-student) -----------------------------------------------
  if (studentId) {
    const { data: student } = await supabase
      .from('students')
      .select('father_email, mother_email, notification_emails')
      .eq('id', studentId)
      .maybeSingle();

    if (student) {
      const parentMembers = [];
      if (isEmail(student.father_email)) {
        parentMembers.push({ name: 'Father', email: student.father_email, role: 'parent' });
      }
      if (isEmail(student.mother_email)) {
        parentMembers.push({ name: 'Mother', email: student.mother_email, role: 'parent' });
      }
      (student.notification_emails || []).forEach((e) => {
        if (isEmail(e) && !parentMembers.some((p) => p.email === e)) {
          parentMembers.push({ name: e, email: e, role: 'parent' });
        }
      });
      if (parentMembers.length) {
        groups.push({ key: 'parents', label: 'Parents', members: parentMembers });
      }
    }
  }

  return groups;
}
