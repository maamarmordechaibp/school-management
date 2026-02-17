-- =====================================================
-- 013: Fix app_users RLS policies and ensure columns
-- Ensures assigned_class column exists,
-- and that authenticated users can INSERT into app_users
-- (needed for user creation via service key and upserts)
-- =====================================================

-- 1. Add assigned_class column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'assigned_class') THEN
    ALTER TABLE app_users ADD COLUMN assigned_class VARCHAR(100);
  END IF;
END $$;

-- 2. Ensure RLS is enabled
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policies and recreate with proper permissions
DROP POLICY IF EXISTS "Users can view all app_users" ON app_users;
CREATE POLICY "Users can view all app_users"
  ON app_users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage app_users" ON app_users;
CREATE POLICY "Admins can manage app_users"
  ON app_users FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Allow service role to bypass RLS (this is default but making explicit)
-- Service role key already bypasses RLS, but let's also allow
-- authenticated users to insert their own profile row
DROP POLICY IF EXISTS "Users can insert own profile" ON app_users;
CREATE POLICY "Users can insert own profile"
  ON app_users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 5. Allow authenticated users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON app_users;
CREATE POLICY "Users can update own profile"
  ON app_users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
