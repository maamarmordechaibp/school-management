-- =====================================================
-- 058: In-app notification center
--
-- Adds an in-app notification feed WITHOUT removing the
-- existing email notifications (email flows are untouched).
-- Each row is addressed to a single recipient (user_id) and
-- can deep-link to any record via link_type / link_id.
--
-- Security: a user may only READ and UPDATE their OWN
-- notifications. Any authenticated staff member may CREATE a
-- notification (e.g. when assigning a task to a colleague).
-- This is stricter than the legacy permissive tables and is
-- safe because no existing feature depends on this new table.
--
-- Purely ADDITIVE. Idempotent and safe to re-run.
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Recipient (must be an app_users row / auth user).
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  -- Category, e.g. 'task_assigned' | 'task_due' | 'task_overdue' |
  -- 'followup_due' | 'appointment_soon' | 'appointment_changed' |
  -- 'comment_added' | 'student_flagged' | 'admin_alert'.
  type TEXT NOT NULL DEFAULT 'admin_alert',
  title TEXT NOT NULL,
  body TEXT,
  priority TEXT NOT NULL DEFAULT 'normal', -- 'low' | 'normal' | 'high'
  -- Deep-link target. link_type maps to a Dashboard view id
  -- (e.g. 'todos', 'students', 'meetings') and link_id is the record id.
  link_type TEXT,
  link_id UUID,
  related_student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast "my unread, newest first" lookups.
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_student
  ON notifications(related_student_id);

-- ---------- RLS ----------
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Read only your own notifications.
DROP POLICY IF EXISTS notifications_select_own ON notifications;
CREATE POLICY notifications_select_own
  ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Update (mark read) only your own notifications.
DROP POLICY IF EXISTS notifications_update_own ON notifications;
CREATE POLICY notifications_update_own
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Any authenticated staff member may create a notification (for self or a colleague).
DROP POLICY IF EXISTS notifications_insert_any ON notifications;
CREATE POLICY notifications_insert_any
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Delete only your own notifications.
DROP POLICY IF EXISTS notifications_delete_own ON notifications;
CREATE POLICY notifications_delete_own
  ON notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON notifications FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;

-- =====================================================
-- 058 COMPLETE
-- Rollback: DROP TABLE notifications;
-- =====================================================
