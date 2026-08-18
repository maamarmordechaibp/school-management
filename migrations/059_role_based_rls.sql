-- =====================================================
-- 059: Role-based Row Level Security (Phase 0)  ⚠ REVIEW BEFORE APPLYING
-- =====================================================
-- PROBLEM (from audit): migration 032 left every sensitive table with
--   FOR ALL TO authenticated USING(true) WITH CHECK(true)
-- so role filtering only happens in the React layer. Any authenticated
-- teacher/tutor can read/write ANY student's data by calling Supabase
-- directly with their own JWT (Acceptance Scenario 5 fails).
--
-- THIS MIGRATION enforces access at the database level:
--   * Full-access office roles (admin, principal*, secretary) — unchanged,
--     they still see everything.
--   * Teachers — only students in classes they teach
--     (classes.hebrew_teacher_id / english_teacher_id).
--   * Tutors — only students they are assigned to (tutor_assignments).
--   * Special-ed staff — only their special-ed caseload.
--   * Sensitive data (special-education tables) — office + special-ed only.
--
-- ⚠ RISK: this CHANGES what non-office accounts can read. Test with a
--    teacher and a tutor account before/after. Full-access accounts are
--    unaffected. Rollback block is at the bottom of this file.
--
-- Helpers are SECURITY DEFINER to avoid recursive RLS on the lookup tables.
-- Idempotent and safe to re-run.
-- =====================================================

-- ---------- Access helpers ----------

-- Office roles that keep full, unrestricted access.
CREATE OR REPLACE FUNCTION is_full_access()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_users
    WHERE id = auth.uid()
      AND role = ANY (ARRAY[
        'admin','principal','principal_hebrew','principal_english','secretary'
      ])
  );
$$;

-- May the current user see this student at all?
CREATE OR REPLACE FUNCTION can_access_student(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL OR p_student_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Office roles see everyone.
  IF is_full_access() THEN
    RETURN TRUE;
  END IF;

  -- Teacher of the student's class (Hebrew or English side).
  IF EXISTS (
    SELECT 1
    FROM students s
    JOIN classes c ON c.id = s.class_id
    WHERE s.id = p_student_id
      AND (c.hebrew_teacher_id = uid OR c.english_teacher_id = uid)
  ) THEN
    RETURN TRUE;
  END IF;

  -- Explicitly assigned staff on the student record.
  IF EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = p_student_id AND s.assigned_to = uid
  ) THEN
    RETURN TRUE;
  END IF;

  -- Tutor with an assignment to this student.
  IF EXISTS (
    SELECT 1 FROM tutor_assignments ta
    WHERE ta.student_id = p_student_id AND ta.tutor_id = uid
  ) THEN
    RETURN TRUE;
  END IF;

  -- Special-ed staff linked through staff_members -> special_ed_staff,
  -- for a student who has a special-ed record.
  IF EXISTS (
    SELECT 1
    FROM special_ed_students ses
    JOIN special_ed_staff sst ON TRUE
    JOIN staff_members sm ON sm.id = sst.staff_member_id
    WHERE ses.student_id = p_student_id
      AND sm.app_user_id = uid
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- May the current user see SENSITIVE (special-education) data for this student?
CREATE OR REPLACE FUNCTION can_access_sensitive(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL OR p_student_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF is_full_access() THEN
    RETURN TRUE;
  END IF;

  -- Special-ed staff only.
  RETURN EXISTS (
    SELECT 1 FROM app_users WHERE id = uid AND role = 'special_ed'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION is_full_access()             TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_student(UUID)     TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_sensitive(UUID)   TO authenticated;

-- ---------- students master ----------
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS students_authenticated_all ON students;
DROP POLICY IF EXISTS students_select ON students;
DROP POLICY IF EXISTS students_write ON students;

CREATE POLICY students_select ON students FOR SELECT TO authenticated
  USING (can_access_student(id));
CREATE POLICY students_update ON students FOR UPDATE TO authenticated
  USING (can_access_student(id)) WITH CHECK (can_access_student(id));
CREATE POLICY students_insert ON students FOR INSERT TO authenticated
  WITH CHECK (is_full_access());
CREATE POLICY students_delete ON students FOR DELETE TO authenticated
  USING (is_full_access());

-- ---------- child tables keyed by a student_id column ----------
-- Standard rule: visible if the row's student is visible. Rows with a NULL
-- student link (school-wide items) stay visible to authenticated users.
DO $$
DECLARE
  t TEXT;
  col TEXT;
  student_tables TEXT[][] := ARRAY[
    ARRAY['call_logs','student_id'],
    ARRAY['student_issues','student_id'],
    ARRAY['assessments','student_id'],
    ARRAY['grades','student_id'],
    ARRAY['tutor_assignments','student_id'],
    ARRAY['student_plans','student_id'],
    ARRAY['progress_reviews','student_id'],
    ARRAY['late_arrivals','student_id'],
    ARRAY['contacts','student_id'],
    ARRAY['student_notes','student_id'],
    ARRAY['student_fees','student_id'],
    ARRAY['payments','student_id'],
    ARRAY['student_books','student_id'],
    ARRAY['student_bus_assignments','student_id'],
    ARRAY['bus_changes','student_id'],
    ARRAY['child_reports','student_id'],
    ARRAY['student_tags','student_id'],
    ARRAY['tutoring_schedule','student_id'],
    ARRAY['support_cases','student_id'],
    ARRAY['report_card_entries','student_id']
  ];
BEGIN
  FOR i IN 1 .. array_length(student_tables, 1) LOOP
    t   := student_tables[i][1];
    col := student_tables[i][2];

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=t AND column_name=col
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t||'_authenticated_all', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t||'_by_student', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (%I IS NULL OR can_access_student(%I)) WITH CHECK (%I IS NULL OR can_access_student(%I))',
      t||'_by_student', t, col, col, col, col
    );
  END LOOP;
END $$;

-- ---------- meetings, todos, reminders: keep personal/school-wide items ----------
-- meetings.student_id may be NULL (staff/school meetings).
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS meetings_authenticated_all ON meetings;
DROP POLICY IF EXISTS meetings_scoped ON meetings;
CREATE POLICY meetings_scoped ON meetings FOR ALL TO authenticated
  USING (student_id IS NULL OR can_access_student(student_id))
  WITH CHECK (student_id IS NULL OR can_access_student(student_id));

-- todos: yours (assigned/created) OR for a student you can access OR office.
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS todos_authenticated_all ON todos;
DROP POLICY IF EXISTS todos_scoped ON todos;
CREATE POLICY todos_scoped ON todos FOR ALL TO authenticated
  USING (
    is_full_access()
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR (student_id IS NOT NULL AND can_access_student(student_id))
  )
  WITH CHECK (
    is_full_access()
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR (student_id IS NOT NULL AND can_access_student(student_id))
  );

-- reminders link via related_student_id (nullable).
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reminders_authenticated_all ON reminders;
DROP POLICY IF EXISTS reminders_scoped ON reminders;
CREATE POLICY reminders_scoped ON reminders FOR ALL TO authenticated
  USING (related_student_id IS NULL OR can_access_student(related_student_id))
  WITH CHECK (related_student_id IS NULL OR can_access_student(related_student_id));

-- ---------- SENSITIVE special-education tables (office + special-ed only) ----------
-- special_ed_students is keyed directly by student_id.
ALTER TABLE special_ed_students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS special_ed_students_authenticated_all ON special_ed_students;
DROP POLICY IF EXISTS special_ed_students_sensitive ON special_ed_students;
CREATE POLICY special_ed_students_sensitive ON special_ed_students FOR ALL TO authenticated
  USING (can_access_sensitive(student_id))
  WITH CHECK (can_access_sensitive(student_id));

-- Child special-ed tables key via special_ed_student_id -> special_ed_students.student_id.
DO $$
DECLARE
  t TEXT;
  se_tables TEXT[] := ARRAY[
    'special_ed_info_sources',
    'special_ed_evaluations',
    'special_ed_tutoring',
    'special_ed_session_logs',
    'special_ed_monthly_reports'
  ];
BEGIN
  FOR i IN 1 .. array_length(se_tables, 1) LOOP
    t := se_tables[i];
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=t AND column_name='special_ed_student_id'
    ) THEN
      CONTINUE;
    END IF;
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t||'_authenticated_all', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t||'_sensitive', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (can_access_sensitive((SELECT student_id FROM special_ed_students ses WHERE ses.id = %I.special_ed_student_id))) WITH CHECK (can_access_sensitive((SELECT student_id FROM special_ed_students ses WHERE ses.id = %I.special_ed_student_id)))',
      t||'_sensitive', t, t, t
    );
  END LOOP;
END $$;

-- special_ed_evaluation_requests keyed by student_id.
ALTER TABLE special_ed_evaluation_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS special_ed_evaluation_requests_authenticated_all ON special_ed_evaluation_requests;
DROP POLICY IF EXISTS special_ed_evaluation_requests_sensitive ON special_ed_evaluation_requests;
CREATE POLICY special_ed_evaluation_requests_sensitive ON special_ed_evaluation_requests FOR ALL TO authenticated
  USING (can_access_sensitive(student_id))
  WITH CHECK (can_access_sensitive(student_id));

-- student_documents: visible if you can see the student; folder-level medical
-- restriction is enforced in the app for now (documented follow-up).
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS student_documents_authenticated_all ON student_documents;
DROP POLICY IF EXISTS student_documents_scoped ON student_documents;
CREATE POLICY student_documents_scoped ON student_documents FOR ALL TO authenticated
  USING (can_access_student(student_id))
  WITH CHECK (can_access_student(student_id));

-- support_case_entries keyed via case_id -> support_cases.student_id.
ALTER TABLE support_case_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS support_case_entries_authenticated_all ON support_case_entries;
DROP POLICY IF EXISTS support_case_entries_by_student ON support_case_entries;
CREATE POLICY support_case_entries_by_student ON support_case_entries FOR ALL TO authenticated
  USING (can_access_student((SELECT student_id FROM support_cases sc WHERE sc.id = support_case_entries.case_id)))
  WITH CHECK (can_access_student((SELECT student_id FROM support_cases sc WHERE sc.id = support_case_entries.case_id)));

-- =====================================================
-- 059 COMPLETE
--
-- ROLLBACK (restore permissive behavior):
--   For each affected table run, e.g.:
--     DROP POLICY IF EXISTS students_select ON students;  -- (and _update/_insert/_delete)
--     CREATE POLICY students_authenticated_all ON students
--       FOR ALL TO authenticated USING (true) WITH CHECK (true);
--   ...repeat for the tables listed above, then optionally:
--     DROP FUNCTION can_access_student(UUID);
--     DROP FUNCTION can_access_sensitive(UUID);
--     DROP FUNCTION is_full_access();
--
-- KNOWN FOLLOW-UP: students.medical_notes is a column and cannot be hidden
-- by row-level RLS. If teachers must not read medical_notes, split it into a
-- separate student_medical table (sensitive) in a later migration.
-- =====================================================
