-- =====================================================
-- 035: Class report-card templates + entries
--
-- Lets staff build custom report-card templates (drag/drop
-- fields). A template can be GENERAL (class_id NULL) or
-- assigned to a specific class. Teachers then "go through"
-- the students of a class and record a mark/value for each
-- field per grading period.
--
--   report_card_templates : the form definition (fields JSONB)
--   report_card_entries   : one row per student per period,
--                           values JSONB keyed by field id
--
-- RLS is authenticated-only, consistent with migration 032.
-- Idempotent and safe to re-run.
-- =====================================================

-- ---------- TEMPLATES ----------
CREATE TABLE IF NOT EXISTS report_card_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL, -- NULL = general template
  grade_id UUID REFERENCES grades(id) ON DELETE SET NULL,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ id, type, label, options[], max, description }]
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_card_templates_class ON report_card_templates(class_id);

-- ---------- ENTRIES (one per student per period) ----------
CREATE TABLE IF NOT EXISTS report_card_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES report_card_templates(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  period TEXT NOT NULL DEFAULT 'Term 1', -- e.g. 'Term 1', 'Q2 2025-2026'
  values JSONB NOT NULL DEFAULT '{}'::jsonb, -- { [fieldId]: value }
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'final'
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, student_id, period)
);

CREATE INDEX IF NOT EXISTS idx_report_card_entries_template ON report_card_entries(template_id);
CREATE INDEX IF NOT EXISTS idx_report_card_entries_student ON report_card_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_report_card_entries_period ON report_card_entries(period);

-- ---------- RLS (authenticated only) ----------
ALTER TABLE report_card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_card_entries  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS report_card_templates_authenticated_all ON report_card_templates;
CREATE POLICY report_card_templates_authenticated_all
  ON report_card_templates FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS report_card_entries_authenticated_all ON report_card_entries;
CREATE POLICY report_card_entries_authenticated_all
  ON report_card_entries FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

REVOKE ALL ON report_card_templates FROM anon;
REVOKE ALL ON report_card_entries  FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON report_card_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON report_card_entries  TO authenticated;
