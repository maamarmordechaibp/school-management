-- =====================================================
-- 049: Custom mark categories ("kinds of things to track")
--
-- Lets staff define their own trackable mark categories, each with a colour,
-- on top of the built-in ones. Used by the Grades entry dropdown and the
-- student Progress graph.
--
-- Idempotent and safe to re-run.
-- =====================================================

CREATE TABLE IF NOT EXISTS mark_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,             -- stable key stored on grades.category
  label TEXT NOT NULL,                  -- English label
  he TEXT,                              -- Yiddish/Hebrew label
  color TEXT NOT NULL DEFAULT '#64748b',-- hex colour for the graph
  sort_order INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  is_builtin BOOLEAN DEFAULT FALSE,     -- built-ins can't be deleted
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mark_categories_active ON mark_categories(is_active);

ALTER TABLE mark_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mark_categories_authenticated_all ON mark_categories;
CREATE POLICY mark_categories_authenticated_all
  ON mark_categories
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
REVOKE ALL ON mark_categories FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON mark_categories TO authenticated;

-- Seed the built-in categories (colours match the frontend defaults).
INSERT INTO mark_categories (key, label, he, color, sort_order, is_builtin) VALUES
  ('learning', 'Learning', 'לימוד',     '#2563eb', 10, TRUE),
  ('davening', 'Davening', 'דאווענען',  '#7c3aed', 20, TRUE),
  ('test',     'Test',     'טעסט',       '#db2777', 30, TRUE),
  ('farher',   'Farher',   'פארהער',     '#0d9488', 40, TRUE),
  ('behavior', 'Behavior', 'הנהגות',     '#ea580c', 50, TRUE),
  ('review',   'Review',   'חזרה',        '#65a30d', 60, TRUE),
  ('midos',    'Midos',    'מידות',       '#ca8a04', 70, TRUE)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 049 COMPLETE
-- =====================================================
