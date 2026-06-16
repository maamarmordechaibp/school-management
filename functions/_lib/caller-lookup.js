/**
 * Caller-ID resolver for the inbound phone system.
 *
 * Given an inbound caller's phone number, find who is calling so the app can
 * pop the right profile:
 *   - parent  → match students.father_phone / mother_phone + contacts.phone.
 *               Returns ALL of that parent's students (multi-kid chooser).
 *   - staff   → match staff_members.home_phone / cell_phone.
 *   - tutor   → match app_users.phone; returns their assigned students.
 *
 * Pure server-side: queries Supabase via the service-role REST API. Never
 * exposed to the browser.
 */

// Normalize to the last 10 US digits for fuzzy matching against messy stored
// numbers (which may be "(845) 555-1234", "845-555-1234", "+18455551234", etc.)
export function last10(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return null;
}

async function sbGet(env, path) {
  const SUPABASE_URL = env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co';
  const SERVICE_KEY = env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY;
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });
  if (!resp.ok) return [];
  return resp.json().catch(() => []);
}

function studentDisplay(s) {
  return (
    [s.first_name, s.last_name].filter(Boolean).join(' ').trim() ||
    s.name ||
    s.hebrew_name ||
    'Student'
  );
}

/**
 * Resolve a caller. Returns:
 *   { type: 'parent'|'staff'|'tutor'|'unknown',
 *     name, matchedId, studentIds: [], detail: {...} }
 */
export async function resolveCaller(env, callerNumber) {
  const tail = last10(callerNumber);
  const empty = { type: 'unknown', name: null, matchedId: null, studentIds: [], detail: {} };
  if (!tail) return empty;

  // PostgREST: match on the last 10 digits using LIKE. We store numbers in many
  // formats, so compare on a stripped suffix via `like.*<tail>`. To keep it
  // index-friendly-ish and simple, fetch candidate rows with an OR ilike.
  const likeTail = `*${tail}`;

  // --- 1) Parent via students (father/mother phone) ---
  const studentRows = await sbGet(
    env,
    `students?select=id,first_name,last_name,name,hebrew_name,father_name,father_phone,mother_name,mother_phone,status` +
      `&or=(father_phone.ilike.${likeTail},mother_phone.ilike.${likeTail})`
  );

  // --- 2) Parent via contacts table (extra guardians) ---
  const contactRows = await sbGet(
    env,
    `contacts?select=id,name,relation,phone,student_id&phone=ilike.${likeTail}`
  );

  const studentIdSet = new Set();
  let parentName = null;
  for (const s of studentRows) {
    studentIdSet.add(s.id);
    if (!parentName) {
      if (last10(s.father_phone) === tail) parentName = s.father_name;
      else if (last10(s.mother_phone) === tail) parentName = s.mother_name;
    }
  }
  for (const c of contactRows) {
    if (c.student_id) studentIdSet.add(c.student_id);
    if (!parentName) parentName = c.name;
  }

  if (studentIdSet.size > 0) {
    const ids = [...studentIdSet];
    // Pull display names for the matched students (for the chooser).
    let students = studentRows.filter((s) => studentIdSet.has(s.id));
    const missing = ids.filter((id) => !students.some((s) => s.id === id));
    if (missing.length) {
      const extra = await sbGet(
        env,
        `students?select=id,first_name,last_name,name,hebrew_name&id=in.(${missing.join(',')})`
      );
      students = students.concat(extra);
    }
    return {
      type: 'parent',
      name: parentName || 'Parent',
      matchedId: ids[0],
      studentIds: ids,
      detail: {
        students: students.map((s) => ({ id: s.id, name: studentDisplay(s) })),
      },
    };
  }

  // --- 3) Staff member (home/cell) ---
  const staffRows = await sbGet(
    env,
    `staff_members?select=id,full_name,hebrew_name,position,app_user_id,home_phone,cell_phone` +
      `&or=(home_phone.ilike.${likeTail},cell_phone.ilike.${likeTail})&limit=1`
  );
  if (staffRows.length) {
    const st = staffRows[0];
    return {
      type: 'staff',
      name: st.full_name || st.hebrew_name || 'Staff',
      matchedId: st.id,
      studentIds: [],
      detail: { position: st.position, appUserId: st.app_user_id },
    };
  }

  // --- 4) Tutor (app_users.phone) → their assigned students ---
  const tutorRows = await sbGet(
    env,
    `app_users?select=id,name,email,role,phone&phone=ilike.${likeTail}&limit=1`
  );
  if (tutorRows.length) {
    const tu = tutorRows[0];
    const assigns = await sbGet(
      env,
      `tutor_assignments?select=student_id,students(id,first_name,last_name,name,hebrew_name)` +
        `&tutor_id=eq.${tu.id}&status=eq.active`
    );
    const students = assigns
      .map((a) => a.students)
      .filter(Boolean)
      .map((s) => ({ id: s.id, name: studentDisplay(s) }));
    return {
      type: 'tutor',
      name: tu.name || tu.email || 'Tutor',
      matchedId: tu.id,
      studentIds: students.map((s) => s.id),
      detail: { role: tu.role, students },
    };
  }

  return empty;
}
