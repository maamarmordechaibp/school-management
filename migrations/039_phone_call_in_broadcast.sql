-- =====================================================
-- 039 — Call-in voice broadcasts (principal-by-phone)
--
-- Lets an authorized principal CALL THE SCHOOL NUMBER, authenticate
-- (caller-ID match OR a numeric PIN), record a message, pick a group
-- (parents — all / by grade / by class — or staff — all / by position),
-- hear the recipient count, confirm, and blast it out — everything the
-- Mass Phone Call screen does on the website, from any phone.
--
-- This migration adds:
--   1. phone_broadcast_admins — the allowlist of who may trigger a phone
--      broadcast (number + optional hashed PIN), managed in the app.
--   2. phone_broadcasts — an audit log of every call-in broadcast
--      (who triggered it, how they authenticated, which group, how many,
--      status) so the principal can see "who made a call" on the website.
--   3. SECURITY DEFINER helper functions the public voice Functions call via
--      the service role:
--        - normalize_us_e164()           digits → +1XXXXXXXXXX
--        - phone_admin_by_number()       caller-ID → admin (or null)
--        - verify_phone_admin_pin()      PIN → admin (or null)
--        - resolve_broadcast_recipients()group → distinct phone list
--
-- Safe / idempotent. Additive only.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------
-- Normalize a messy US phone string to E.164 (+1XXXXXXXXXX).
-- Returns NULL when there aren't enough digits.
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION normalize_us_e164(p_raw TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  d TEXT;
BEGIN
  d := regexp_replace(COALESCE(p_raw, ''), '\D', '', 'g');
  IF length(d) = 10 THEN
    RETURN '+1' || d;
  ELSIF length(d) = 11 AND left(d, 1) = '1' THEN
    RETURN '+' || d;
  ELSIF length(d) > 11 THEN
    -- Take the last 10 digits, assume US.
    RETURN '+1' || right(d, 10);
  END IF;
  RETURN NULL;
END;
$$;

-- =====================================================
-- 1. ALLOWLIST — who may trigger a phone broadcast
-- =====================================================
CREATE TABLE IF NOT EXISTS phone_broadcast_admins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,                 -- display label, e.g. "Rabbi Klein (Principal)"
  phone           TEXT,                          -- E.164; caller-ID match
  pin_hash        TEXT,                          -- bcrypt hash of the numeric PIN (optional)
  app_user_id     UUID REFERENCES app_users(id) ON DELETE SET NULL,
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_broadcast_admins_active ON phone_broadcast_admins(is_active);

-- =====================================================
-- 2. AUDIT LOG — every call-in broadcast
-- =====================================================
CREATE TABLE IF NOT EXISTS phone_broadcasts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        UUID REFERENCES phone_broadcast_admins(id) ON DELETE SET NULL,
  admin_name      TEXT,                          -- snapshot of who triggered it
  caller_number   TEXT,                          -- the phone they called from
  auth_method     TEXT,                          -- 'caller_id' | 'pin'
  audience_type   TEXT,                          -- all_parents | grade | class | staff_all | staff_position
  audience_label  TEXT,                          -- human label, e.g. "Grade 3 — Parents"
  recording_url   TEXT,                          -- public audio that was sent
  recipient_count INTEGER NOT NULL DEFAULT 0,
  ok_count        INTEGER NOT NULL DEFAULT 0,
  failed_count    INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'sending', -- sending | completed | failed
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_broadcasts_created ON phone_broadcasts(created_at DESC);

-- updated_at touch for the admins table (reuse 037's helper if present).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'touch_phone_updated_at') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_touch_phone_broadcast_admins ON phone_broadcast_admins';
    EXECUTE 'CREATE TRIGGER trg_touch_phone_broadcast_admins
             BEFORE UPDATE ON phone_broadcast_admins
             FOR EACH ROW EXECUTE FUNCTION touch_phone_updated_at()';
  END IF;
END $$;

-- =====================================================
-- 3a. Resolve caller-ID → authorized admin (or null)
-- =====================================================
CREATE OR REPLACE FUNCTION phone_admin_by_number(p_number TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tail TEXT;
  rec  RECORD;
BEGIN
  tail := regexp_replace(COALESCE(p_number, ''), '\D', '', 'g');
  IF length(tail) < 10 THEN
    RETURN NULL;
  END IF;
  tail := right(tail, 10);

  SELECT id, name, app_user_id
    INTO rec
    FROM phone_broadcast_admins
   WHERE is_active = TRUE
     AND phone IS NOT NULL
     AND right(regexp_replace(phone, '\D', '', 'g'), 10) = tail
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', rec.id,
    'name', rec.name,
    'app_user_id', rec.app_user_id,
    'auth_method', 'caller_id'
  );
END;
$$;

-- =====================================================
-- 3b. Verify a typed PIN → authorized admin (or null)
-- =====================================================
CREATE OR REPLACE FUNCTION verify_phone_admin_pin(p_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  IF p_pin IS NULL OR length(btrim(p_pin)) < 3 THEN
    RETURN NULL;
  END IF;

  FOR rec IN
    SELECT id, name, app_user_id, pin_hash
      FROM phone_broadcast_admins
     WHERE is_active = TRUE AND pin_hash IS NOT NULL
  LOOP
    IF rec.pin_hash = crypt(p_pin, rec.pin_hash) THEN
      RETURN jsonb_build_object(
        'id', rec.id,
        'name', rec.name,
        'app_user_id', rec.app_user_id,
        'auth_method', 'pin'
      );
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$;

-- =====================================================
-- 3c. Hash a PIN (called from the app when the principal sets one).
--     Exposed as RPC; only principals can reach it through RLS-less
--     SECURITY DEFINER, but we still gate it on is_phone_admin().
-- =====================================================
CREATE OR REPLACE FUNCTION set_phone_admin_pin(p_admin_id UUID, p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_phone_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_pin IS NULL OR length(btrim(p_pin)) < 3 THEN
    -- Clearing the PIN.
    UPDATE phone_broadcast_admins SET pin_hash = NULL, updated_at = NOW()
     WHERE id = p_admin_id;
    RETURN TRUE;
  END IF;
  UPDATE phone_broadcast_admins
     SET pin_hash = crypt(btrim(p_pin), gen_salt('bf')), updated_at = NOW()
   WHERE id = p_admin_id;
  RETURN TRUE;
END;
$$;

-- =====================================================
-- 3d. Resolve a broadcast group → distinct E.164 phone list
--
-- p_audience_type: all_parents | grade | class | staff_all | staff_position
-- p_audience_id:   grade id (for 'grade') or class id (for 'class')
-- p_audience_text: staff position (for 'staff_position')
-- p_contact_type:  primary | father | mother | home | both | all
--                  (parents only; 'primary' = first available number/family)
-- =====================================================
CREATE OR REPLACE FUNCTION resolve_broadcast_recipients(
  p_audience_type TEXT,
  p_audience_id   UUID DEFAULT NULL,
  p_audience_text TEXT DEFAULT NULL,
  p_contact_type  TEXT DEFAULT 'primary'
)
RETURNS TABLE(phone TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_audience_type IN ('staff_all', 'staff_position') THEN
    RETURN QUERY
    SELECT DISTINCT e.num
    FROM staff_members s
    CROSS JOIN LATERAL (
      VALUES (normalize_us_e164(s.cell_phone)),
             (normalize_us_e164(s.home_phone))
    ) AS e(num)
    WHERE s.is_active = TRUE
      AND e.num IS NOT NULL
      AND (p_audience_type = 'staff_all'
           OR (p_audience_text IS NOT NULL AND s.position = p_audience_text));
    RETURN;
  END IF;

  -- Parent audiences: all_parents | grade | class
  RETURN QUERY
  WITH base AS (
    SELECT st.father_phone, st.mother_phone, st.home_phone
    FROM students st
    WHERE (
      p_audience_type = 'all_parents'
      OR (p_audience_type = 'class' AND st.class_id = p_audience_id)
      OR (p_audience_type = 'grade' AND st.class_id IN (
            SELECT c.id FROM classes c WHERE c.grade_id = p_audience_id))
    )
  ),
  expanded AS (
    SELECT CASE p_contact_type
             WHEN 'primary' THEN normalize_us_e164(
                                   COALESCE(NULLIF(btrim(b.father_phone), ''),
                                            NULLIF(btrim(b.mother_phone), ''),
                                            NULLIF(btrim(b.home_phone), '')))
             ELSE NULL
           END AS one,
           normalize_us_e164(b.father_phone) AS f,
           normalize_us_e164(b.mother_phone) AS m,
           normalize_us_e164(b.home_phone)   AS h
    FROM base b
  )
  SELECT DISTINCT x.num FROM expanded ex
  CROSS JOIN LATERAL (
    VALUES
      (CASE WHEN p_contact_type = 'primary'              THEN ex.one END),
      (CASE WHEN p_contact_type IN ('father','both','all') THEN ex.f END),
      (CASE WHEN p_contact_type IN ('mother','both','all') THEN ex.m END),
      (CASE WHEN p_contact_type IN ('home','all')          THEN ex.h END)
  ) AS x(num)
  WHERE x.num IS NOT NULL;
END;
$$;

-- =====================================================
-- RLS
--   phone_broadcast_admins: principal/admin only (contains PIN hashes).
--   phone_broadcasts:       principal/admin read; inserts/updates come from
--                           the voice Function via service role (bypasses RLS).
-- =====================================================
ALTER TABLE phone_broadcast_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_broadcasts       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "phone_broadcast_admins_rw" ON phone_broadcast_admins;
CREATE POLICY "phone_broadcast_admins_rw" ON phone_broadcast_admins
  FOR ALL TO authenticated
  USING (is_phone_admin()) WITH CHECK (is_phone_admin());

DROP POLICY IF EXISTS "phone_broadcasts_read" ON phone_broadcasts;
CREATE POLICY "phone_broadcasts_read" ON phone_broadcasts
  FOR SELECT TO authenticated USING (is_phone_admin());

-- =====================================================
-- Seed the allowlist from existing principal/admin accounts that already
-- have a phone on file, so caller-ID auth works out of the box. The principal
-- can add a PIN or more numbers from the app afterwards.
-- =====================================================
INSERT INTO phone_broadcast_admins (name, phone, app_user_id)
SELECT COALESCE(u.name, u.email, 'Principal'),
       normalize_us_e164(u.phone),
       u.id
FROM app_users u
WHERE u.role IN ('admin', 'principal', 'principal_hebrew', 'principal_english')
  AND u.phone IS NOT NULL
  AND normalize_us_e164(u.phone) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM phone_broadcast_admins a WHERE a.app_user_id = u.id
  );

-- =====================================================
-- Lock down the SECURITY DEFINER helpers.
--
-- By default Postgres grants EXECUTE on new functions to PUBLIC, which means
-- PostgREST would expose them to anon/authenticated browsers. These functions
-- read parent phone numbers and verify PINs, so they MUST NOT be callable from
-- the browser. Only the service role (used by the Cloudflare voice Functions)
-- may call them. set_phone_admin_pin is the one exception — the app calls it,
-- and it self-guards with is_phone_admin().
-- =====================================================
REVOKE EXECUTE ON FUNCTION normalize_us_e164(TEXT)                       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION phone_admin_by_number(TEXT)                   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION verify_phone_admin_pin(TEXT)                  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION resolve_broadcast_recipients(TEXT, UUID, TEXT, TEXT) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION normalize_us_e164(TEXT) FROM anon';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION phone_admin_by_number(TEXT) FROM anon';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION verify_phone_admin_pin(TEXT) FROM anon';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION resolve_broadcast_recipients(TEXT, UUID, TEXT, TEXT) FROM anon';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION set_phone_admin_pin(UUID, TEXT) FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION phone_admin_by_number(TEXT) FROM authenticated';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION verify_phone_admin_pin(TEXT) FROM authenticated';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION resolve_broadcast_recipients(TEXT, UUID, TEXT, TEXT) FROM authenticated';
    -- The app needs to set/clear PINs (function self-checks is_phone_admin()).
    EXECUTE 'GRANT EXECUTE ON FUNCTION set_phone_admin_pin(UUID, TEXT) TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION normalize_us_e164(TEXT) TO service_role';
    EXECUTE 'GRANT EXECUTE ON FUNCTION phone_admin_by_number(TEXT) TO service_role';
    EXECUTE 'GRANT EXECUTE ON FUNCTION verify_phone_admin_pin(TEXT) TO service_role';
    EXECUTE 'GRANT EXECUTE ON FUNCTION resolve_broadcast_recipients(TEXT, UUID, TEXT, TEXT) TO service_role';
    EXECUTE 'GRANT EXECUTE ON FUNCTION set_phone_admin_pin(UUID, TEXT) TO service_role';
  END IF;
END $$;
