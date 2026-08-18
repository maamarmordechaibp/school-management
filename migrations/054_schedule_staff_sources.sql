-- =====================================================
-- 054: Let tutoring_schedule reference tutors from any source
--
-- The tutor/mentor on an appointment may live in special_ed_staff, the
-- general staff_members directory, or be a tutor login (app_users).
-- We drop the hard FK to special_ed_staff, remember which table the id
-- came from (staff_source), and rely on the denormalized tutor_name for
-- display so no cross-table join is required.
--
-- Idempotent / safe to re-run.
-- =====================================================

ALTER TABLE tutoring_schedule
  DROP CONSTRAINT IF EXISTS tutoring_schedule_staff_id_fkey;

ALTER TABLE tutoring_schedule
  ADD COLUMN IF NOT EXISTS staff_source TEXT; -- 'special_ed' | 'staff_member' | 'app_user'

-- Backfill existing rows: anything with a staff_id so far came from special_ed_staff.
UPDATE tutoring_schedule
  SET staff_source = 'special_ed'
  WHERE staff_id IS NOT NULL AND staff_source IS NULL;

-- =====================================================
-- 054 COMPLETE
-- =====================================================
