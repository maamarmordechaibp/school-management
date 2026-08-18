-- =====================================================
-- 061: External student ID (for imports / SIS sync)
--
-- Adds a stable external identifier so Excel imports and future
-- school-office syncs can UPSERT by a known key instead of creating
-- duplicate students. Purely ADDITIVE.
--
-- Idempotent and safe to re-run.
-- =====================================================

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS external_student_id TEXT;

-- One student per external id (only enforced for non-null values, so existing
-- students without an external id are unaffected).
CREATE UNIQUE INDEX IF NOT EXISTS uq_students_external_id
  ON students (external_student_id)
  WHERE external_student_id IS NOT NULL;

-- =====================================================
-- 061 COMPLETE
-- Rollback: DROP INDEX uq_students_external_id;
--           ALTER TABLE students DROP COLUMN external_student_id;
-- =====================================================
