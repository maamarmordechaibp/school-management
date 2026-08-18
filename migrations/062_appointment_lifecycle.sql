-- =====================================================
-- 062: Appointment lifecycle for tutoring_schedule (Phase 14)
--
-- Adds a status lifecycle and completion/cancellation details to the
-- shared appointment book so therapy/tutoring appointments can be
-- confirmed, completed, cancelled, marked no-show or rescheduled.
--
-- Purely ADDITIVE. Existing rows default to 'scheduled'. Idempotent.
-- =====================================================

ALTER TABLE tutoring_schedule
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'scheduled',
  -- 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completion_notes TEXT,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_tutoring_schedule_status ON tutoring_schedule(status);

-- =====================================================
-- 062 COMPLETE
-- Rollback:
--   ALTER TABLE tutoring_schedule
--     DROP COLUMN status, DROP COLUMN completed_at,
--     DROP COLUMN completion_notes, DROP COLUMN cancel_reason;
-- =====================================================
