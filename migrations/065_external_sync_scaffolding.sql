-- =====================================================
-- 065: Generic external-system sync scaffolding (Phase 20)
--
-- Infrastructure ONLY — no specific SIS/office integration is implemented.
-- Provides the generic building blocks a future sync can use:
--   sync_connections — a configured external system (name, type, config)
--   sync_logs        — one row per sync run (status, counts, errors)
--   external_refs    — generic local-id <-> external-id map for any entity
--
-- Admin/principal only. Purely ADDITIVE. Idempotent and safe to re-run.
-- =====================================================

CREATE TABLE IF NOT EXISTS sync_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  system_type TEXT NOT NULL DEFAULT 'generic', -- 'generic' | 'sis' | 'office' | ...
  base_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,    -- credentials/refs live server-side; keep secrets OUT of here
  last_sync_at TIMESTAMPTZ,
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES sync_connections(id) ON DELETE CASCADE,
  direction TEXT NOT NULL DEFAULT 'inbound',    -- 'inbound' | 'outbound'
  entity_type TEXT,                             -- 'student' | 'parent' | 'class' | 'teacher' | ...
  status TEXT NOT NULL DEFAULT 'running',        -- 'running' | 'success' | 'error'
  records_processed INTEGER NOT NULL DEFAULT 0,
  records_failed INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  detail JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_connection ON sync_logs(connection_id, started_at DESC);

-- Generic mapping so ANY entity can carry an external id (students already
-- have external_student_id; this covers parents/classes/teachers/etc.).
CREATE TABLE IF NOT EXISTS external_refs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES sync_connections(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,   -- 'student' | 'parent' | 'class' | 'teacher' | ...
  local_id UUID NOT NULL,
  external_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (connection_id, entity_type, external_id)
);

CREATE INDEX IF NOT EXISTS idx_external_refs_local ON external_refs(entity_type, local_id);

-- ---------- RLS: admin / principal only ----------
ALTER TABLE sync_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_refs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['sync_connections','sync_logs','external_refs'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t||'_admin_all', t);
    EXECUTE format($f$
      CREATE POLICY %1$I ON %2$I FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid()
             AND role = ANY (ARRAY['admin','principal','principal_hebrew','principal_english'])))
      WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid()
             AND role = ANY (ARRAY['admin','principal','principal_hebrew','principal_english'])))
    $f$, t||'_admin_all', t);
    EXECUTE format('REVOKE ALL ON %I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO authenticated', t);
  END LOOP;
END $$;

-- =====================================================
-- 065 COMPLETE
-- Rollback: DROP TABLE external_refs; DROP TABLE sync_logs; DROP TABLE sync_connections;
-- =====================================================
