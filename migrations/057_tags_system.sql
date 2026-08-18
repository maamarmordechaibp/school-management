-- =====================================================
-- 057: Administrator-managed tags / labels
--
-- Adds a proper tag system so administrators can classify
-- students (e.g. "Needs Follow-Up", "New Intake", "At Risk").
-- Tags are NOT hardcoded — they are fully CRUD-managed.
--
--   tags          — the label catalog (name, color, description)
--   student_tags  — many-to-many link student <-> tag
--
-- Purely ADDITIVE. No existing table is modified. RLS is
-- authenticated-only, consistent with migrations 032/053.
-- Idempotent and safe to re-run.
-- =====================================================

-- ---------- tags catalog ----------
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  -- Hex color used for the badge (e.g. '#F59E0B'). Kept as free text so
  -- the UI palette can evolve without a migration.
  color TEXT NOT NULL DEFAULT '#64748B',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case-insensitive unique tag name so we never get "Urgent" and "urgent".
CREATE UNIQUE INDEX IF NOT EXISTS uq_tags_name_lower ON tags (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_tags_active ON tags(is_active);

-- ---------- student <-> tag link ----------
CREATE TABLE IF NOT EXISTS student_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_student_tags_student ON student_tags(student_id);
CREATE INDEX IF NOT EXISTS idx_student_tags_tag ON student_tags(tag_id);

-- ---------- updated_at trigger for tags ----------
CREATE OR REPLACE FUNCTION touch_tags_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_touch_tags_updated_at ON tags;
CREATE TRIGGER trg_touch_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW EXECUTE FUNCTION touch_tags_updated_at();

-- ---------- RLS (authenticated only) ----------
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tags_authenticated_all ON tags;
CREATE POLICY tags_authenticated_all
  ON tags FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS student_tags_authenticated_all ON student_tags;
CREATE POLICY student_tags_authenticated_all
  ON student_tags FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

REVOKE ALL ON tags FROM anon;
REVOKE ALL ON student_tags FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON student_tags TO authenticated;

-- ---------- a few sensible starter tags (safe: skipped if any exist) ----------
INSERT INTO tags (name, color, description, sort_order)
SELECT * FROM (VALUES
  ('Needs Follow-Up', '#F59E0B', 'Requires a follow-up action', 1),
  ('At Risk',         '#EF4444', 'Student needs close attention', 2),
  ('New Intake',      '#3B82F6', 'Recently enrolled', 3),
  ('Special Ed',      '#8B5CF6', 'Receiving special-education support', 4),
  ('Financial Hold',  '#0EA5E9', 'Outstanding balance / fee hold', 5)
) AS seed(name, color, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM tags);

-- =====================================================
-- 057 COMPLETE
-- Rollback: DROP TABLE student_tags; DROP TABLE tags;
--           DROP FUNCTION touch_tags_updated_at();
-- =====================================================
