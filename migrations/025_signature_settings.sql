-- =====================================================
-- 025 — Letter signature settings
-- Seeds the Principal's saved signature name and title,
-- printed on every late slip and similar letters.
-- (app_settings table already exists from migration 011,
--  with RLS + policies already in place.)
-- =====================================================

INSERT INTO app_settings (key, value) VALUES
  ('signature_name',  ''),
  ('signature_role',  'סגן המנהל')
ON CONFLICT (key) DO NOTHING;
