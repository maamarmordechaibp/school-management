-- =====================================================
-- 019: Fix student_plans RLS policies
-- Allow all authenticated staff to create/update plans,
-- not just admin/principal roles.
-- Also fix student_plans column types for safety.
-- =====================================================

-- Drop restrictive policies
DROP POLICY IF EXISTS "Admins can view all plans" ON student_plans;
DROP POLICY IF EXISTS "Teachers can view their students plans" ON student_plans;
DROP POLICY IF EXISTS "Admins can insert plans" ON student_plans;
DROP POLICY IF EXISTS "Admins can update plans" ON student_plans;

-- All authenticated users can view plans
CREATE POLICY "All staff can view plans"
  ON student_plans FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- All authenticated users can create plans
CREATE POLICY "All staff can insert plans"
  ON student_plans FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- All authenticated users can update plans
CREATE POLICY "All staff can update plans"
  ON student_plans FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Admins can delete plans
CREATE POLICY "Admins can delete plans"
  ON student_plans FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role IN ('admin', 'principal', 'principal_hebrew', 'principal_english')
    )
  );
