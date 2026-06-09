-- =====================================================
-- 033: Link special-ed tutoring assignments to staff
--
-- The Special Education "Staff" tab lists the students
-- assigned to each staff member by querying
--   special_ed_tutoring.special_ed_staff_id
-- ...but that column never existed on the table (011 only
-- defined a free-text `tutor_name`). As a result, no
-- student ever appeared under a staff member.
--
-- This migration adds the missing FK column + index so a
-- tutoring assignment can be linked to an internal
-- special-ed staff member. Idempotent and safe to re-run.
-- =====================================================

ALTER TABLE special_ed_tutoring
  ADD COLUMN IF NOT EXISTS special_ed_staff_id UUID
  REFERENCES special_ed_staff(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_special_ed_tutoring_staff
  ON special_ed_tutoring(special_ed_staff_id);

-- Backfill: link existing tutoring rows whose free-text tutor_name
-- exactly matches an active staff member's name (case-insensitive).
-- Only touches rows that are not already linked.
UPDATE special_ed_tutoring t
SET special_ed_staff_id = s.id
FROM special_ed_staff s
WHERE t.special_ed_staff_id IS NULL
  AND s.is_active = TRUE
  AND lower(trim(t.tutor_name)) = lower(trim(s.name));
