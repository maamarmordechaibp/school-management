/**
 * notifyRecipients — builds the list of "who can be notified" recipient groups
 * used by <StudentNotifyModal>.
 *
 * Emails for each group come from TWO sources, merged together:
 *   1. Staff records — app_users (login accounts), staff_members (the full
 *      roster, matched by position) and special_ed_staff.
 *   2. Configured fallback emails — a per-group list the office sets under
 *      Settings → Notifications (stored in app_settings). This guarantees a
 *      group like "Special Education" appears even when no individual staff
 *      record has an email on file.
 *
 * Returns an array of groups:
 *   { key, label, members: [{ name, email, role }] }
 * The standard groups are always returned (even empty) so the UI can show them;
 * empty groups still let the user type an address into "Add other emails".
 */

import { supabase } from '@/lib/customSupabaseClient';

export const NOTIFY_SETTINGS_KEY = 'notification_recipient_emails';

const isEmail = (e) => typeof e === 'string' && e.includes('@');

const displayName = (u) =>
  (u.name && u.name.trim()) ||
  (u.full_name && u.full_name.trim()) ||
  [u.first_name, u.last_name].filter(Boolean).join(' ').trim() ||
  (u.hebrew_name && u.hebrew_name.trim()) ||
  u.email ||
  'Staff';

const has = (haystack, needles) => {
  const s = String(haystack || '').toLowerCase();
  return needles.some((n) => s.includes(n));
};

/**
 * The standard notification groups. `matchUserRole` matches app_users.role,
 * `matchStaffPosition` matches staff_members.position (case-insensitive
 * substring). `matchSped` pulls in special_ed_staff.
 */
export const NOTIFY_GROUPS = [
  {
    key: 'principals',
    label: 'Principals',
    matchUserRole: (r) => r.startsWith('principal'),
    matchStaffPosition: (p) => has(p, ['principal', 'menahal']) && !has(p, ['sgan']),
  },
  {
    key: 'menahal_vaad',
    label: 'Menahal / Vaad',
    matchUserRole: (r) => r === 'menahal',
    matchStaffPosition: (p) => has(p, ['vaad', 'sgan']),
  },
  {
    key: 'special_ed',
    label: 'Special Education',
    matchUserRole: () => false,
    matchStaffPosition: (p) => has(p, ['special', 'chinuch', 'sped']),
    matchSped: true,
  },
  {
    key: 'teachers',
    label: 'Teachers',
    matchUserRole: (r) => r.startsWith('teacher'),
    matchStaffPosition: (p) => has(p, ['melamed', 'teacher', 'english', 'curriculum', 'helper', 'rebbe']),
  },
  {
    key: 'tutors',
    label: 'Tutors',
    matchUserRole: (r) => r === 'tutor',
    matchStaffPosition: (p) => has(p, ['tutor']),
  },
  {
    key: 'office',
    label: 'Office / Secretary',
    matchUserRole: (r) => r === 'admin',
    matchStaffPosition: (p) => has(p, ['sec', 'office', 'manager']),
  },
];

const parseConfigured = (val) => {
  if (!val) return [];
  const list = Array.isArray(val) ? val : String(val).split(/[\s,;]+/);
  return list.map((e) => e.trim()).filter(isEmail);
};

/** Load the configured per-group fallback emails from app_settings. */
export async function loadNotifyGroupSettings() {
  try {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', NOTIFY_SETTINGS_KEY)
      .maybeSingle();
    if (data?.value) {
      const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      return parsed && typeof parsed === 'object' ? parsed : {};
    }
  } catch {
    /* not configured yet */
  }
  return {};
}

/** Save the configured per-group fallback emails to app_settings. */
export async function saveNotifyGroupSettings(map) {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: NOTIFY_SETTINGS_KEY, value: JSON.stringify(map || {}) }, { onConflict: 'key' });
  if (error) throw error;
}

/** Fetch every recipient group. Pass a studentId to also include parents. */
export async function fetchRecipientGroups(studentId = null) {
  const [usersRes, staffRes, spedRes, settings] = await Promise.all([
    supabase.from('app_users').select('id, name, first_name, last_name, email, role, is_active').eq('is_active', true),
    supabase.from('staff_members').select('id, full_name, hebrew_name, first_name, last_name, email, position, is_active').eq('is_active', true),
    supabase.from('special_ed_staff').select('id, name, hebrew_name, email, role, is_active').eq('is_active', true),
    loadNotifyGroupSettings(),
  ]);

  const activeUsers = (usersRes.data || []).filter((u) => isEmail(u.email));
  const activeStaff = (staffRes.data || []).filter((s) => isEmail(s.email));
  const activeSped = (spedRes.data || []).filter((s) => isEmail(s.email));

  const groups = NOTIFY_GROUPS.map((g) => {
    const members = [];
    const seen = new Set();
    const add = (name, email, role) => {
      const e = String(email || '').trim();
      if (!isEmail(e) || seen.has(e.toLowerCase())) return;
      seen.add(e.toLowerCase());
      members.push({ name, email: e, role });
    };

    activeUsers
      .filter((u) => g.matchUserRole(String(u.role || '')))
      .forEach((u) => add(displayName(u), u.email, u.role));

    activeStaff
      .filter((s) => g.matchStaffPosition(s.position))
      .forEach((s) => add(displayName(s), s.email, s.position));

    if (g.matchSped) {
      activeSped.forEach((s) => add(s.name || s.hebrew_name || 'Special Ed', s.email, s.role));
    }

    parseConfigured(settings[g.key]).forEach((e) => add(e, e, 'configured'));

    return { key: g.key, label: g.label, members };
  });

  // --- Parents (per-student) -----------------------------------------------
  if (studentId) {
    const { data: student } = await supabase
      .from('students')
      .select('father_email, mother_email, notification_emails')
      .eq('id', studentId)
      .maybeSingle();

    const parentMembers = [];
    if (student) {
      if (isEmail(student.father_email)) parentMembers.push({ name: 'Father', email: student.father_email, role: 'parent' });
      if (isEmail(student.mother_email)) parentMembers.push({ name: 'Mother', email: student.mother_email, role: 'parent' });
      (student.notification_emails || []).forEach((e) => {
        if (isEmail(e) && !parentMembers.some((p) => p.email === e)) {
          parentMembers.push({ name: e, email: e, role: 'parent' });
        }
      });
    }
    groups.push({ key: 'parents', label: 'Parents', members: parentMembers });
  }

  return groups;
}
