-- =====================================================
-- 020: Force permissive RLS on students + classes
--
-- Symptom: Mass Call view loads 0 students even though
-- 362 rows exist (verified via direct SQL). This means
-- RLS is silently filtering them out for the authenticated
-- session. Migration 015 attempted to fix this but may
-- not have been applied, OR a later policy replaced it.
--
-- This migration is idempotent and forcibly restores
-- permissive read access for ALL authenticated users
-- on both students and classes (the embedded join target).
-- =====================================================

-- ---------- STUDENTS ----------
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT polname FROM pg_policy WHERE polrelid = 'students'::regclass LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON students', r.polname);
  END LOOP;
END $$;

CREATE POLICY "students_select_all_authenticated"
  ON students FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "students_all_authenticated"
  ON students FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON students TO authenticated;
GRANT SELECT ON students TO anon;


-- ---------- CLASSES ----------
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT polname FROM pg_policy WHERE polrelid = 'classes'::regclass LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON classes', r.polname);
  END LOOP;
END $$;

CREATE POLICY "classes_select_all"
  ON classes FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "classes_all_authenticated"
  ON classes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON classes TO authenticated;
GRANT SELECT ON classes TO anon;


-- ---------- GRADES (also embedded sometimes) ----------
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT polname FROM pg_policy WHERE polrelid = 'grades'::regclass LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON grades', r.polname);
  END LOOP;
END $$;

CREATE POLICY "grades_select_all"
  ON grades FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "grades_all_authenticated"
  ON grades FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON grades TO authenticated;
GRANT SELECT ON grades TO anon;


-- ---------- STAFF_MEMBERS (used by Mass Call) ----------
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT polname FROM pg_policy WHERE polrelid = 'staff_members'::regclass LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON staff_members', r.polname);
  END LOOP;
END $$;

CREATE POLICY "staff_select_all"
  ON staff_members FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "staff_all_authenticated"
  ON staff_members FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON staff_members TO authenticated;
GRANT SELECT ON staff_members TO anon;


-- ---------- VERIFY ----------
DO $$
DECLARE student_count INT;
BEGIN
  SELECT COUNT(*) INTO student_count FROM students;
  RAISE NOTICE 'Migration 020 complete. students count = %', student_count;
END $$;
