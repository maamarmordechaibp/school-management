-- =====================================================
-- 053: Tutoring / therapy appointment schedule
--
-- A single shared table that powers BOTH the per-student schedule and
-- the per-staff (tutor/mentor/therapist) schedule. Because both views
-- read and write the same rows, any change on one side is immediately
-- reflected on the other.
--
-- Supports recurring weekly slots (day_of_week + start_time) and one-off
-- "squeeze-in" appointments (appointment_date set). Each slot has a set
-- duration so it behaves like a real appointment book.
--
-- RLS is authenticated-only, consistent with migrations 032 / 035 / 051.
-- Idempotent and safe to re-run.
-- =====================================================

CREATE TABLE IF NOT EXISTS tutoring_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  -- The tutor / mentor / therapist. special_ed_staff is the directory;
  -- tutor_name is a free-text fallback / label shown on the block.
  staff_id UUID REFERENCES special_ed_staff(id) ON DELETE SET NULL,
  tutor_name TEXT,
  subject TEXT,
  location TEXT,
  -- Recurring weekly slot: 0=Sun .. 6=Sat. Ignored when appointment_date is set.
  day_of_week INTEGER,
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  -- One-off appointment (squeeze-in). When set, this overrides day_of_week.
  appointment_date DATE,
  is_recurring BOOLEAN DEFAULT TRUE,
  color TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tutoring_schedule_student ON tutoring_schedule(student_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_schedule_staff   ON tutoring_schedule(staff_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_schedule_day     ON tutoring_schedule(day_of_week);
CREATE INDEX IF NOT EXISTS idx_tutoring_schedule_date    ON tutoring_schedule(appointment_date);

-- ---------- RLS (authenticated only) ----------
ALTER TABLE tutoring_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tutoring_schedule_authenticated_all ON tutoring_schedule;
CREATE POLICY tutoring_schedule_authenticated_all
  ON tutoring_schedule FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

REVOKE ALL ON tutoring_schedule FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON tutoring_schedule TO authenticated;

-- =====================================================
-- 053 COMPLETE
-- =====================================================
