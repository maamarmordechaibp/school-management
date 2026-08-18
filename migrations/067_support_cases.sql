-- =====================================================
-- 067: General support / case management (Phase 16)
--
-- A broader case layer for students who need attention but are NOT
-- necessarily in special education. It does NOT duplicate special-ed
-- data: a case may OPTIONALLY link to an existing special_ed_students
-- record (special_ed_student_id) so special education is represented as
-- a specialized, linked case type rather than a competing module.
--
--   support_cases        — one open matter per concern (status/priority/owner)
--   support_case_entries — the workflow trail (concern -> evaluation ->
--                          intervention -> communication -> follow-up ->
--                          outcome), generic so it never duplicates the
--                          detailed special-ed tables.
--
-- Purely ADDITIVE. RLS authenticated-only here (migration 059 scopes it by
-- student when applied). Idempotent and safe to re-run.
-- =====================================================

CREATE TABLE IF NOT EXISTS support_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  case_type TEXT NOT NULL DEFAULT 'general', -- 'general'|'academic'|'behavioral'|'attendance'|'social'|'special_ed'
  status TEXT NOT NULL DEFAULT 'open',       -- 'open'|'monitoring'|'resolved'|'closed'
  priority TEXT NOT NULL DEFAULT 'medium',   -- 'low'|'medium'|'high'
  summary TEXT,
  assigned_to UUID REFERENCES app_users(id) ON DELETE SET NULL,
  -- Optional link to an existing special-ed record (no duplication).
  special_ed_student_id UUID REFERENCES special_ed_students(id) ON DELETE SET NULL,
  outcome TEXT,
  opened_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_cases_student ON support_cases(student_id);
CREATE INDEX IF NOT EXISTS idx_support_cases_status ON support_cases(status);
CREATE INDEX IF NOT EXISTS idx_support_cases_assigned ON support_cases(assigned_to);

CREATE TABLE IF NOT EXISTS support_case_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES support_cases(id) ON DELETE CASCADE,
  -- Workflow step type.
  entry_type TEXT NOT NULL DEFAULT 'note', -- 'concern'|'evaluation'|'intervention'|'communication'|'followup'|'outcome'|'note'
  content TEXT NOT NULL,
  occurred_on DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_case_entries_case ON support_case_entries(case_id, created_at);

-- ---------- updated_at trigger ----------
CREATE OR REPLACE FUNCTION touch_support_cases_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_touch_support_cases ON support_cases;
CREATE TRIGGER trg_touch_support_cases
  BEFORE UPDATE ON support_cases
  FOR EACH ROW EXECUTE FUNCTION touch_support_cases_updated_at();

-- ---------- RLS (authenticated only; 059 scopes by student) ----------
ALTER TABLE support_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_case_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_cases_authenticated_all ON support_cases;
CREATE POLICY support_cases_authenticated_all
  ON support_cases FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS support_case_entries_authenticated_all ON support_case_entries;
CREATE POLICY support_case_entries_authenticated_all
  ON support_case_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

REVOKE ALL ON support_cases FROM anon;
REVOKE ALL ON support_case_entries FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON support_cases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON support_case_entries TO authenticated;

-- =====================================================
-- 067 COMPLETE
-- Rollback: DROP TABLE support_case_entries; DROP TABLE support_cases;
--           DROP FUNCTION touch_support_cases_updated_at();
-- =====================================================
