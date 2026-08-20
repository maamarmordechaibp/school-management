-- =====================================================
-- 063: Activity / accountability audit log (Phase 21)
--
-- A meaningful (not noisy) audit trail for sensitive operations:
-- document upload/delete, permission changes, student deletion,
-- report create/edit, etc. This is the table the existing
-- ActivityLogView already reads from (previously missing).
--
-- Distinct from api_audit_log (023), which records Cloudflare Function
-- calls. This one records in-app user actions written from the client.
--
-- Purely ADDITIVE. Idempotent and safe to re-run.
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,        -- short verb phrase, e.g. 'Document uploaded'
  details TEXT,                -- human-readable detail line
  actor_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  actor_name TEXT,
  entity_type TEXT,            -- 'student' | 'document' | 'permission' | 'report' | 'task' ...
  entity_id UUID,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reconcile with any pre-existing activity_logs table (older installs lacked these columns).
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES app_users(id) ON DELETE SET NULL;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS actor_name TEXT;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_student ON activity_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- ---------- RLS ----------
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Any authenticated staff may write an audit entry.
DROP POLICY IF EXISTS activity_logs_insert ON activity_logs;
CREATE POLICY activity_logs_insert
  ON activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Only admins/principals may read the audit trail. Falls back gracefully if
-- has_role() (migration 023) is not present by using a role subquery.
DROP POLICY IF EXISTS activity_logs_admin_read ON activity_logs;
CREATE POLICY activity_logs_admin_read
  ON activity_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
        AND role = ANY (ARRAY['admin','principal','principal_hebrew','principal_english'])
    )
  );

REVOKE ALL ON activity_logs FROM anon;
GRANT SELECT, INSERT ON activity_logs TO authenticated;

-- =====================================================
-- 063 COMPLETE
-- Rollback: DROP TABLE activity_logs;
-- =====================================================
