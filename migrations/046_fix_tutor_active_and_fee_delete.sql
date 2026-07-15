-- =====================================================
-- 046: Fix tutor_assignments.is_active + fee-delete cascade
--
--  1. The app reads/writes tutor_assignments.is_active everywhere,
--     but the table only had a `status` column — every such query
--     returned HTTP 400. Add the boolean column the code expects.
--
--  2. Deleting a fee cascades to student_fees, but payments ->
--     student_fees had no ON DELETE rule, so the cascade was blocked
--     (HTTP 409). Make that FK ON DELETE CASCADE so removing a fee
--     (and its charges) also clears the related payment rows.
--
-- Idempotent and safe to re-run.
-- =====================================================

-- 1. tutor_assignments.is_active
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tutor_assignments' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE tutor_assignments ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    -- Backfill from status when present so existing rows stay meaningful.
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'tutor_assignments' AND column_name = 'status'
    ) THEN
      UPDATE tutor_assignments
         SET is_active = (COALESCE(status, 'active') = 'active');
    END IF;
  END IF;
END $$;

-- 2. payments -> student_fees ON DELETE CASCADE
DO $$
DECLARE
  v_conname TEXT;
BEGIN
  SELECT conname INTO v_conname
  FROM pg_constraint
  WHERE conrelid = 'payments'::regclass
    AND contype = 'f'
    AND confrelid = 'student_fees'::regclass
  LIMIT 1;

  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE payments DROP CONSTRAINT %I', v_conname);
  END IF;

  ALTER TABLE payments
    ADD CONSTRAINT payments_student_fee_id_fkey
    FOREIGN KEY (student_fee_id) REFERENCES student_fees(id) ON DELETE CASCADE;
END $$;
