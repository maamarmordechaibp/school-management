-- =====================================================
-- 024 — School identity settings (name, subtitle, logo)
-- Stored in app_settings so they apply everywhere (letters,
-- emails, daily summary, announcements) and can be edited later.
-- =====================================================

-- Ensure app_settings exists (no-op if already there)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES
  ('school_name_yi',      'תלמוד תורה תולדות יעקב יוסף דחסידי סקווירא - מאנסי'),
  ('school_subtitle_yi',  'בנשיאות כ"ק מרן אדמו"ר שליט"א'),
  ('school_logo_url',     '/school-logo.png')
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = NOW();
