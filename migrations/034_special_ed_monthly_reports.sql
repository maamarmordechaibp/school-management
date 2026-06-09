-- =====================================================
-- 034: Special-education monthly progress reports
--
-- Each month, every active special-education student should
-- get a progress report ("what was done", progress, etc.).
-- This is similar to a note, but scoped to a calendar month
-- (one report per student per month).
--
-- report_month is stored as the first day of the month
-- (e.g. 2026-06-01) so a UNIQUE(student, month) constraint
-- enforces one report per student per month.
--
-- RLS is authenticated-only, consistent with migration 032.
-- Idempotent and safe to re-run.
-- =====================================================

CREATE TABLE IF NOT EXISTS special_ed_monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  special_ed_student_id UUID NOT NULL REFERENCES special_ed_students(id) ON DELETE CASCADE,
  report_month DATE NOT NULL, -- first day of the month this report covers
  what_was_done TEXT,         -- what was worked on this month
  progress TEXT,              -- progress made
  challenges TEXT,            -- challenges / concerns
  goals_next_month TEXT,      -- goals for next month
  recommendations TEXT,       -- general notes / recommendations
  created_by UUID REFERENCES app_users(id),
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(special_ed_student_id, report_month)
);

CREATE INDEX IF NOT EXISTS idx_special_ed_monthly_student
  ON special_ed_monthly_reports(special_ed_student_id);
CREATE INDEX IF NOT EXISTS idx_special_ed_monthly_month
  ON special_ed_monthly_reports(report_month);

-- Lock access to authenticated users only (no anon/public).
ALTER TABLE special_ed_monthly_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS special_ed_monthly_reports_authenticated_all ON special_ed_monthly_reports;
CREATE POLICY special_ed_monthly_reports_authenticated_all
  ON special_ed_monthly_reports
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

REVOKE ALL ON special_ed_monthly_reports FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON special_ed_monthly_reports TO authenticated;
