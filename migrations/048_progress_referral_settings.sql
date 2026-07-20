-- =====================================================
-- 048: Progress tracking → special-ed referral settings
--
-- Adds two app_settings keys:
--   1. special_ed_recipients        — comma-separated emails notified when a
--                                     student is referred for evaluation.
--   2. progress_decline_threshold   — how many declines on one aspect trigger
--                                     the "send to special ed?" prompt.
--
-- Idempotent and safe to re-run.
-- =====================================================

INSERT INTO app_settings (key, value)
VALUES ('special_ed_recipients', '')
ON CONFLICT (key) DO NOTHING;

INSERT INTO app_settings (key, value)
VALUES ('progress_decline_threshold', '2')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 048 COMPLETE
-- =====================================================
