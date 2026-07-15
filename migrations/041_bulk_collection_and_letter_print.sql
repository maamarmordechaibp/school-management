-- Migration 041: Bulk class collection + late-letter print settings
-- Additive only. Safe to re-run.

-- 1) Track cash change handed back on a payment (e.g. a check given for more
--    than the amount owed, with the difference returned as cash).
ALTER TABLE payments ADD COLUMN IF NOT EXISTS change_given DECIMAL(10,2) DEFAULT 0;

-- 2) Seed default late-arrival letter print settings so the principal can
--    adjust paper width / margin / font to fit the physical printer.
INSERT INTO app_settings (key, value) VALUES
  ('late_letter_paper_width', '80'),
  ('late_letter_margin', '3'),
  ('late_letter_font', 'Frank Ruhl Libre'),
  ('late_letter_font_size', '11')
ON CONFLICT (key) DO NOTHING;
