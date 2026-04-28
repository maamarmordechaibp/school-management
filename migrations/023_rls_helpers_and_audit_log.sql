-- =====================================================
-- 023 — RLS helpers + API audit log
-- Adds reusable role-check SQL helpers and a server-side
-- audit log table for the Cloudflare Functions.
--
-- NOTE: Mass policy rewrite (replacing USING(true)) is
-- deferred to migration 024 to avoid breaking existing
-- flows. This migration is purely additive.
-- =====================================================

-- ----- Helpers -----
CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION current_app_user_role()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT role FROM app_users WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION has_role(required TEXT[])
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_users
    WHERE id = auth.uid()
      AND role = ANY(required)
  );
$$;

GRANT EXECUTE ON FUNCTION current_app_user_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION current_app_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION has_role(TEXT[]) TO authenticated;

-- ----- API audit log -----
-- Tracks every Cloudflare Function call (auth + denials).
CREATE TABLE IF NOT EXISTS api_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,             -- e.g. 'create-user', 'send-email'
  caller_user_id UUID,                -- auth.uid() of caller (if any)
  caller_email TEXT,                  -- email of caller (if any)
  caller_role TEXT,                   -- role at the time of call
  status TEXT NOT NULL,               -- 'allowed' | 'denied' | 'error'
  status_code INTEGER,                -- HTTP status returned
  reason TEXT,                        -- 'missing_jwt' | 'invalid_jwt' | 'forbidden_role' | 'ok' | 'rate_limited' | etc.
  request_meta JSONB DEFAULT '{}'::jsonb,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_audit_log_created_at ON api_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_audit_log_endpoint ON api_audit_log(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_audit_log_caller_user_id ON api_audit_log(caller_user_id);
CREATE INDEX IF NOT EXISTS idx_api_audit_log_status ON api_audit_log(status);

ALTER TABLE api_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins/principals may read; nobody writes via PostgREST (Cloudflare Functions
-- write with service-role key, which bypasses RLS).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'api_audit_log_admin_read' AND tablename = 'api_audit_log') THEN
    CREATE POLICY api_audit_log_admin_read ON api_audit_log
      FOR SELECT
      USING (has_role(ARRAY['admin','principal','principal_hebrew','principal_english']));
  END IF;
END $$;

GRANT SELECT ON api_audit_log TO authenticated;
