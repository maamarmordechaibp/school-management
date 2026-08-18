-- =====================================================
-- 055: Staff position categories (extensible) + special-ed flag
--
-- Positions were hard-coded in the UI. This makes them data so new
-- categories (tutor, mentor, therapist, …) can be added on the fly, and
-- each category can be flagged is_special_ed. The appointment scheduler
-- shows only staff whose position is flagged special-ed (plus the
-- dedicated special_ed_staff directory).
--
-- RLS authenticated-only, consistent with prior migrations. Idempotent.
-- =====================================================

CREATE TABLE IF NOT EXISTS staff_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT UNIQUE NOT NULL,          -- stored in staff_members.position
  label TEXT NOT NULL,
  hebrew_label TEXT,
  color TEXT,                          -- tailwind badge classes
  category TEXT,                       -- 'administration' | 'teaching' | 'support' | 'special_ed'
  is_special_ed BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_positions_special_ed ON staff_positions(is_special_ed) WHERE is_special_ed = TRUE;

-- ---------- RLS ----------
ALTER TABLE staff_positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS staff_positions_authenticated_all ON staff_positions;
CREATE POLICY staff_positions_authenticated_all
  ON staff_positions FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON staff_positions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_positions TO authenticated;

-- ---------- Seed existing + special-ed categories (dedup by value) ----------
INSERT INTO staff_positions (value, label, color, category, is_special_ed, sort_order) VALUES
  ('Vaad G',                 'Vaad Gabbai',    'bg-purple-100 text-purple-700',   'administration', FALSE, 10),
  ('Vaad R',                 'Vaad Ruchani',   'bg-indigo-100 text-indigo-700',   'administration', FALSE, 11),
  ('Menahal',                'Menahal',        'bg-blue-100 text-blue-700',       'administration', FALSE, 12),
  ('Sgan Menahal',           'Sgan Menahal',   'bg-blue-100 text-blue-700',       'administration', FALSE, 13),
  ('Principal',              'Principal',      'bg-blue-100 text-blue-700',       'administration', FALSE, 14),
  ('Manager',                'Manager',        'bg-cyan-100 text-cyan-700',       'administration', FALSE, 15),
  ('Bus Manager',            'Bus Manager',    'bg-cyan-100 text-cyan-700',       'administration', FALSE, 16),
  ('Sec',                    'Secretary',      'bg-pink-100 text-pink-700',       'administration', FALSE, 17),
  ('Chinuch Mychud',         'Chinuch Meyuchad','bg-orange-100 text-orange-700',  'special_ed',     TRUE,  20),
  ('Melamed',                'Melamed',        'bg-green-100 text-green-700',      'teaching',       FALSE, 30),
  ('Melamed / Driver',       'Melamed/Driver', 'bg-green-100 text-green-700',      'teaching',       FALSE, 31),
  ('Helper',                 'Helper',         'bg-teal-100 text-teal-700',        'teaching',       FALSE, 32),
  ('English Teacher',        'English Teacher','bg-emerald-100 text-emerald-700',  'teaching',       FALSE, 33),
  ('Curriculum Implementer', 'Curriculum',     'bg-amber-100 text-amber-700',      'teaching',       FALSE, 34),
  ('Driver',                 'Driver',         'bg-slate-100 text-slate-700',      'support',        FALSE, 40),
  ('Tutor',                  'Tutor',          'bg-violet-100 text-violet-700',    'special_ed',     TRUE,  21),
  ('Mentor',                 'Mentor',         'bg-rose-100 text-rose-700',        'special_ed',     TRUE,  22),
  ('Therapist',              'Therapist',      'bg-fuchsia-100 text-fuchsia-700',  'special_ed',     TRUE,  23),
  ('Speech Therapist',       'Speech Therapist','bg-sky-100 text-sky-700',         'special_ed',     TRUE,  24),
  ('OT',                     'Occupational Therapist','bg-lime-100 text-lime-700', 'special_ed',     TRUE,  25)
ON CONFLICT (value) DO NOTHING;

-- =====================================================
-- 055 COMPLETE
-- =====================================================
