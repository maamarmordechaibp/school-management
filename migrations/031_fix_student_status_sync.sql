-- =====================================================
-- 031: Fix student status / is_active mismatch
--
-- Problem: The app's student form writes `is_active` (boolean)
-- but every picker/search filters on `status = 'active'`.
-- The two fields drifted apart, so active students with a
-- NULL/blank/legacy status silently disappeared from search,
-- call logs, issues, meetings, reminders, fees, etc.
--
-- This migration:
--   1. Ensures the `is_active` column exists on students
--      (so student saves never fail on a missing column).
--   2. Backfills `status` from `is_active` (and vice-versa) so
--      existing rows are consistent.
--   3. Adds a trigger that keeps the two columns in sync on
--      every insert/update, regardless of which one the app sends.
-- Idempotent and safe to re-run.
-- =====================================================

-- 1. Ensure both columns exist ---------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE students ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'status'
  ) THEN
    ALTER TABLE students ADD COLUMN status VARCHAR(30) DEFAULT 'active';
  END IF;
END $$;

-- 2. Backfill existing rows -----------------------------------
-- Normalize any case/whitespace variants of "active".
UPDATE students
SET status = 'active'
WHERE status IS NULL
   OR btrim(lower(status)) IN ('active', '');

-- If is_active is explicitly false, reflect that in status.
UPDATE students
SET status = 'inactive'
WHERE is_active IS FALSE
  AND btrim(lower(status)) = 'active';

-- Make sure is_active matches status for every row.
UPDATE students
SET is_active = (btrim(lower(status)) = 'active')
WHERE is_active IS DISTINCT FROM (btrim(lower(status)) = 'active');

-- 3. Keep them in sync going forward --------------------------
CREATE OR REPLACE FUNCTION sync_student_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- On INSERT: derive whichever value was not supplied.
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS NULL THEN
      NEW.status := CASE WHEN NEW.is_active IS FALSE THEN 'inactive' ELSE 'active' END;
    END IF;
    IF NEW.is_active IS NULL THEN
      NEW.is_active := (btrim(lower(NEW.status)) = 'active');
    END IF;
    RETURN NEW;
  END IF;

  -- On UPDATE: if one field changed, mirror it into the other.
  IF NEW.is_active IS DISTINCT FROM OLD.is_active
     AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    NEW.status := CASE WHEN NEW.is_active IS FALSE THEN 'inactive' ELSE 'active' END;
  ELSIF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.is_active IS NOT DISTINCT FROM OLD.is_active THEN
    NEW.is_active := (btrim(lower(NEW.status)) = 'active');
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sync_student_status ON students;
CREATE TRIGGER trg_sync_student_status
  BEFORE INSERT OR UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_status();

-- 4. Index to keep status filtering fast ----------------------
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
