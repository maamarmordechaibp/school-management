-- =====================================================
-- 060: Task collaboration — comments + activity history
--
-- Extends the existing `todos` work-item system (does NOT replace it) with:
--   todo_comments   — threaded discussion on a task
--   todo_activity   — lightweight audit trail (created/assigned/status/comment)
--
-- Purely ADDITIVE. RLS authenticated-only, consistent with prior migrations.
-- Idempotent and safe to re-run.
-- =====================================================

CREATE TABLE IF NOT EXISTS todo_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_todo_comments_todo ON todo_comments(todo_id, created_at);

CREATE TABLE IF NOT EXISTS todo_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  -- 'created' | 'assigned' | 'status' | 'comment' | 'edited' | 'completed'
  action TEXT NOT NULL,
  detail TEXT,
  actor_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  actor_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_todo_activity_todo ON todo_activity(todo_id, created_at);

-- ---------- RLS ----------
ALTER TABLE todo_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS todo_comments_authenticated_all ON todo_comments;
CREATE POLICY todo_comments_authenticated_all
  ON todo_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS todo_activity_authenticated_all ON todo_activity;
CREATE POLICY todo_activity_authenticated_all
  ON todo_activity FOR ALL TO authenticated USING (true) WITH CHECK (true);

REVOKE ALL ON todo_comments FROM anon;
REVOKE ALL ON todo_activity FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON todo_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON todo_activity TO authenticated;

-- =====================================================
-- 060 COMPLETE
-- Rollback: DROP TABLE todo_comments; DROP TABLE todo_activity;
-- =====================================================
