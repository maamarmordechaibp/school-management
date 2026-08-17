-- =====================================================
-- 050: Principal "Needs Elevation" flag on students
--
-- Adds a per-student flag the principal can raise to escalate a student
-- (the "needs elevation" item in the Principal box). Idempotent / safe to
-- re-run.
-- =====================================================

ALTER TABLE students ADD COLUMN IF NOT EXISTS needs_elevation BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS needs_elevation_note TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS needs_elevation_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS needs_elevation_by UUID;

-- Quick lookup of every student currently flagged for elevation.
CREATE INDEX IF NOT EXISTS idx_students_needs_elevation
  ON students (needs_elevation)
  WHERE needs_elevation = TRUE;

-- =====================================================
-- 050 COMPLETE
-- =====================================================
