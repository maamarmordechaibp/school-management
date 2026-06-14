-- =====================================================
-- 036: Special-Ed evaluation requests ("needs evaluation" queue)
--
-- When a child is added (either in the main Students form or
-- in the Special Education "Add Student" form) the user can flag
-- that the child needs an evaluation. Every such flag drops a row
-- into this table, which powers the new "Evaluations" tab — a
-- pending queue that can be assigned to a special-ed staff member
-- and tracked through to completion.
--
-- Idempotent and safe to re-run.
-- =====================================================

CREATE TABLE IF NOT EXISTS special_ed_evaluation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  -- Optional link to the special_ed_students record (may not exist yet
  -- when the request is created straight from the main Students form).
  special_ed_student_id UUID REFERENCES special_ed_students(id) ON DELETE SET NULL,
  reason TEXT,                       -- why this child needs to be evaluated
  evaluation_type TEXT,              -- optional desired evaluation type
  priority TEXT DEFAULT 'normal',    -- 'low', 'normal', 'high', 'urgent'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'
  assigned_staff_id UUID REFERENCES special_ed_staff(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  requested_by UUID REFERENCES app_users(id),
  requested_by_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_special_ed_eval_req_student
  ON special_ed_evaluation_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_special_ed_eval_req_status
  ON special_ed_evaluation_requests(status);
CREATE INDEX IF NOT EXISTS idx_special_ed_eval_req_staff
  ON special_ed_evaluation_requests(assigned_staff_id);

-- Lock access to authenticated users only (no anon/public).
ALTER TABLE special_ed_evaluation_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS special_ed_eval_requests_authenticated_all ON special_ed_evaluation_requests;
CREATE POLICY special_ed_eval_requests_authenticated_all
  ON special_ed_evaluation_requests
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

REVOKE ALL ON special_ed_evaluation_requests FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON special_ed_evaluation_requests TO authenticated;
