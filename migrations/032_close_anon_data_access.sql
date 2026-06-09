-- =====================================================
-- 032: Close public (anon) access to student/staff data
--
-- Migration 020 ("force permissive") granted SELECT on
-- students, classes, grades and staff_members to BOTH
-- `authenticated` AND `anon`. The anon role is the public
-- key shipped in the browser bundle, so this effectively
-- made all student/parent PII readable by anyone with the
-- public key — a serious data-exposure bug.
--
-- This migration:
--   * Keeps the app working for logged-in users (policies
--     stay permissive for `authenticated`, because role
--     filtering is currently enforced in the app layer).
--   * Revokes ALL access from `anon` on these tables and
--     drops any anon-facing policies.
-- Idempotent and safe to re-run.
-- =====================================================

DO $$
DECLARE
  tbl  TEXT;
  pol  RECORD;
  tables TEXT[] := ARRAY[
    'students', 'classes', 'grades', 'staff_members',
    'app_users', 'student_issues', 'call_logs', 'contacts',
    'student_notes', 'class_notes', 'meetings', 'reminders',
    'student_fees', 'payments', 'student_plans',
    'special_ed_students', 'attendance'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Skip tables that don't exist in this database.
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

    -- Drop every existing policy so we can rebuild them authenticated-only.
    FOR pol IN
      SELECT polname FROM pg_policy WHERE polrelid = format('public.%I', tbl)::regclass
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.polname, tbl);
    END LOOP;

    -- Recreate a permissive policy for AUTHENTICATED users only.
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      tbl || '_authenticated_all', tbl
    );

    -- Hard-revoke any table privileges from the public/anon roles.
    EXECUTE format('REVOKE ALL ON %I FROM anon', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO authenticated', tbl);
  END LOOP;
END $$;
