-- =====================================================
-- 066: Report categories + author name (Phase 10)
--
-- Improves the existing narrative report system WITHOUT changing any
-- existing report/template behaviour:
--   * category on templates and reports (e.g. 'PTA', 'Special-Ed', 'General')
--   * created_by_name on reports so the history shows the author without a join
--
-- Purely ADDITIVE. Idempotent and safe to re-run.
-- =====================================================

ALTER TABLE child_report_templates
  ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE child_reports
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS created_by_name TEXT;

CREATE INDEX IF NOT EXISTS idx_child_reports_category ON child_reports(category);

-- =====================================================
-- 066 COMPLETE
-- Rollback:
--   ALTER TABLE child_reports DROP COLUMN category, DROP COLUMN created_by_name;
--   ALTER TABLE child_report_templates DROP COLUMN category;
-- =====================================================
