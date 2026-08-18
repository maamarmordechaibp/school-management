-- =====================================================
-- 051: Narrative "Child Reports" + ready-made templates
--
-- Lets a principal write longer narrative write-ups on a single
-- child ("give the father at PTA a clear detailed report") using
-- ready-made section templates, save them, and print/hand them out.
--
--   child_report_templates : reusable section layouts (sections JSONB)
--   child_reports          : one saved narrative report per student
--
-- RLS is authenticated-only, consistent with migrations 032 / 035.
-- Idempotent and safe to re-run.
-- =====================================================

-- ---------- TEMPLATES ----------
CREATE TABLE IF NOT EXISTS child_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  -- [{ id, heading, prompt }] — an ordered list of narrative sections
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- REPORTS (one narrative write-up per student) ----------
CREATE TABLE IF NOT EXISTS child_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  template_id UUID REFERENCES child_report_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Report',
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- [{ heading, text }] — the filled-in narrative sections
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'final'
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_reports_student ON child_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_child_reports_date ON child_reports(report_date);

-- ---------- RLS (authenticated only) ----------
ALTER TABLE child_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_reports          ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS child_report_templates_authenticated_all ON child_report_templates;
CREATE POLICY child_report_templates_authenticated_all
  ON child_report_templates FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS child_reports_authenticated_all ON child_reports;
CREATE POLICY child_reports_authenticated_all
  ON child_reports FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

REVOKE ALL ON child_report_templates FROM anon;
REVOKE ALL ON child_reports          FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON child_report_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON child_reports          TO authenticated;

-- ---------- SEED: ready-made templates (only if none exist) ----------
INSERT INTO child_report_templates (name, description, sections)
SELECT * FROM (VALUES
  (
    'פ.ט.אי. באריכט · PTA Report',
    'A clear detailed report to hand a parent at PTA.',
    '[
      {"id":"overview","heading":"איבערבליק · Overview","prompt":"A short picture of where the child is holding."},
      {"id":"strengths","heading":"שטארקייטן · Strengths","prompt":"What the child does well."},
      {"id":"needs","heading":"וואו ער דארף הילף · Areas needing help","prompt":"The points the child struggles with."},
      {"id":"done","heading":"וואס מיר האבן געטון · What we have done","prompt":"Steps, tutoring, therapy, calls home already taken."},
      {"id":"plan","heading":"פלאן אויף ווייטער · Plan going forward","prompt":"The plan and next steps for this child."}
    ]'::jsonb
  ),
  (
    'ספעציעל חינוך אפדעיט · Special-Ed Update',
    'Progress update for a child receiving extra help.',
    '[
      {"id":"status","heading":"יעצטיגער מצב · Current status","prompt":"Current standing and services in place."},
      {"id":"progress","heading":"פראגרעס · Therapy / tutoring progress","prompt":"How the sessions are going and progress seen."},
      {"id":"recommend","heading":"המלצות · Recommendations","prompt":"Recommendations for staff and parents."}
    ]'::jsonb
  ),
  (
    'בלאנקא · Blank report',
    'A single free-form section.',
    '[
      {"id":"body","heading":"באריכט · Report","prompt":"Write the report here."}
    ]'::jsonb
  )
) AS seed(name, description, sections)
WHERE NOT EXISTS (SELECT 1 FROM child_report_templates);

-- =====================================================
-- 051 COMPLETE
-- =====================================================
