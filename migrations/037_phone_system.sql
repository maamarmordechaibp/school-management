-- =====================================================
-- 037 — Inbound Phone System (IVR, Extensions, Devices,
--        Voicemail, Inbound Call log + screen-pop)
--
-- Adds a full inbound telephony layer on top of the
-- existing SignalWire outbound setup (026/027). The IVR
-- is DATA-DRIVEN: menus + options live in these tables and
-- are rendered to LaML at call time by the voice Functions,
-- so the principal can edit the whole phone tree from the
-- app with no code changes.
--
-- Safe / idempotent: IF NOT EXISTS everywhere, re-runnable.
-- Additive only — does not touch call_log / call_logs /
-- call_recordings.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------
-- Helper: is the current user a principal/admin?
-- Used by RLS write policies so only the principal can
-- edit the phone system / IVR.
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION is_phone_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_users
    WHERE id = auth.uid()
      AND role IN ('admin', 'principal', 'principal_hebrew', 'principal_english')
  );
$$;

-- =====================================================
-- 1. EXTENSIONS — one per person/destination
-- =====================================================
CREATE TABLE IF NOT EXISTS phone_extensions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ext_number        TEXT NOT NULL UNIQUE,        -- e.g. "101"
  label             TEXT NOT NULL,               -- e.g. "Principal", "Assistant Principal"
  staff_member_id   UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  app_user_id       UUID REFERENCES app_users(id) ON DELETE SET NULL, -- screen-pop target (who answers)
  sip_endpoint      TEXT,                        -- e.g. "principal@school.sip.signalwire.com"
  forward_number    TEXT,                        -- E.164 cell/home, rung simultaneously with SIP
  ring_timeout      INTEGER NOT NULL DEFAULT 25, -- seconds before voicemail
  voicemail_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  voicemail_greeting_audio_url TEXT,             -- optional custom VM greeting
  voicemail_greeting_text      TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_extensions_ext     ON phone_extensions(ext_number);
CREATE INDEX IF NOT EXISTS idx_phone_extensions_user    ON phone_extensions(app_user_id);
CREATE INDEX IF NOT EXISTS idx_phone_extensions_active  ON phone_extensions(is_active);

-- =====================================================
-- 2. DEVICES — physical desk phones (Yealink/SIP/ATA)
--    NO SIP passwords/secrets stored here — those live in
--    SignalWire. We only keep a reference/username + MAC.
-- =====================================================
CREATE TABLE IF NOT EXISTS phone_devices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label         TEXT NOT NULL,                   -- e.g. "Front desk Yealink T54W"
  device_type   TEXT NOT NULL DEFAULT 'sip',     -- yealink | sip | ata | softphone
  sip_username  TEXT,                            -- SIP auth username (reference only)
  mac_address   TEXT,
  extension_id  UUID REFERENCES phone_extensions(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'unknown', -- registered | offline | unknown
  notes         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_devices_extension ON phone_devices(extension_id);

-- =====================================================
-- 3. IVR MENUS — each node in the phone tree
-- =====================================================
CREATE TABLE IF NOT EXISTS ivr_menus (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,              -- e.g. "Main Menu", "Office Submenu"
  is_root            BOOLEAN NOT NULL DEFAULT FALSE, -- the menu the main number answers with
  greeting_audio_url TEXT,                       -- uploaded recording (call-audio bucket)
  greeting_text      TEXT,                       -- spoken via TTS when no audio
  greeting_voice     TEXT NOT NULL DEFAULT 'Polly.Joanna',
  greeting_language  TEXT NOT NULL DEFAULT 'en-US',
  invalid_retries    INTEGER NOT NULL DEFAULT 3, -- how many bad/no inputs before giving up
  timeout_sec        INTEGER NOT NULL DEFAULT 6, -- digit gather timeout
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by         UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one root menu — enforced with a partial unique index.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ivr_menus_single_root
  ON ivr_menus ((is_root)) WHERE is_root = TRUE;

-- =====================================================
-- 4. IVR OPTIONS — one row per dialable key on a menu
--    A key can: dial an extension, open a submenu
--    (unlimited nesting via target_submenu_id), play a
--    message, go to voicemail, forward, or hang up.
-- =====================================================
CREATE TABLE IF NOT EXISTS ivr_options (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id             UUID NOT NULL REFERENCES ivr_menus(id) ON DELETE CASCADE,
  digit               TEXT NOT NULL,             -- '1'..'9','0','*','#'
  label               TEXT,                      -- admin-facing description
  action_type         TEXT NOT NULL,             -- extension | submenu | message | voicemail | forward | hangup
  target_extension_id UUID REFERENCES phone_extensions(id) ON DELETE SET NULL,
  target_submenu_id   UUID REFERENCES ivr_menus(id) ON DELETE SET NULL,
  message_audio_url   TEXT,                      -- for action_type='message'
  message_text        TEXT,
  forward_number      TEXT,                      -- for action_type='forward'
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (menu_id, digit)
);

CREATE INDEX IF NOT EXISTS idx_ivr_options_menu    ON ivr_options(menu_id);
CREATE INDEX IF NOT EXISTS idx_ivr_options_submenu ON ivr_options(target_submenu_id);

-- =====================================================
-- 5. INBOUND CALLS — live call log + screen-pop source
--    The voice Function inserts a row (service role) the
--    moment a call is routed to an extension, with the
--    resolved caller + target user. The frontend listens
--    via Realtime to pop the matching profile.
-- =====================================================
CREATE TABLE IF NOT EXISTS inbound_calls (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_number   TEXT,                          -- E.164 caller ID
  extension_id    UUID REFERENCES phone_extensions(id) ON DELETE SET NULL,
  target_user_id  UUID REFERENCES app_users(id) ON DELETE SET NULL, -- whose screen pops
  -- Resolved caller identity (best-effort)
  matched_type    TEXT,                          -- parent | staff | tutor | unknown
  matched_id      UUID,                          -- student/staff/app_user id of primary match
  matched_name    TEXT,                          -- display label for the popup
  matched_student_ids UUID[],                    -- all students for a parent (multi-kid chooser)
  status          TEXT NOT NULL DEFAULT 'ringing', -- ringing | answered | missed | voicemail | completed
  provider_sid    TEXT,
  duration_sec    INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inbound_calls_target  ON inbound_calls(target_user_id);
CREATE INDEX IF NOT EXISTS idx_inbound_calls_created ON inbound_calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inbound_calls_status  ON inbound_calls(status);

-- =====================================================
-- 6. VOICEMAILS
-- =====================================================
CREATE TABLE IF NOT EXISTS voicemails (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_id    UUID REFERENCES phone_extensions(id) ON DELETE SET NULL,
  target_user_id  UUID REFERENCES app_users(id) ON DELETE SET NULL,
  caller_number   TEXT,
  matched_type    TEXT,
  matched_id      UUID,
  matched_name    TEXT,
  recording_url   TEXT,                          -- public call-audio URL
  duration_sec    INTEGER,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  provider_sid    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voicemails_target  ON voicemails(target_user_id);
CREATE INDEX IF NOT EXISTS idx_voicemails_unread  ON voicemails(is_read);
CREATE INDEX IF NOT EXISTS idx_voicemails_created ON voicemails(created_at DESC);

-- =====================================================
-- updated_at triggers
-- =====================================================
CREATE OR REPLACE FUNCTION touch_phone_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['phone_extensions','phone_devices','ivr_menus','ivr_options','inbound_calls'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_touch_%1$s ON %1$s;', t);
    EXECUTE format('CREATE TRIGGER trg_touch_%1$s BEFORE UPDATE ON %1$s
                    FOR EACH ROW EXECUTE FUNCTION touch_phone_updated_at();', t);
  END LOOP;
END $$;

-- =====================================================
-- RLS
--   Read: any authenticated staff member.
--   Write: principal/admin only (is_phone_admin()).
--   Inbound/voicemail inserts come from the Cloudflare
--   Function using the service role, which bypasses RLS.
-- =====================================================
ALTER TABLE phone_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_devices    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ivr_menus        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ivr_options      ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_calls    ENABLE ROW LEVEL SECURITY;
ALTER TABLE voicemails       ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['phone_extensions','phone_devices','ivr_menus','ivr_options'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_read"  ON %1$s;', t);
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_write" ON %1$s;', t);
    -- Any authenticated user can read the phone config
    EXECUTE format('CREATE POLICY "%1$s_read" ON %1$s
                    FOR SELECT TO authenticated USING (true);', t);
    -- Only principals/admins can insert/update/delete
    EXECUTE format('CREATE POLICY "%1$s_write" ON %1$s
                    FOR ALL TO authenticated
                    USING (is_phone_admin()) WITH CHECK (is_phone_admin());', t);
  END LOOP;
END $$;

-- inbound_calls: staff can read; only owner or admin can update status.
DROP POLICY IF EXISTS "inbound_calls_read" ON inbound_calls;
CREATE POLICY "inbound_calls_read" ON inbound_calls
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "inbound_calls_update" ON inbound_calls;
CREATE POLICY "inbound_calls_update" ON inbound_calls
  FOR UPDATE TO authenticated
  USING (target_user_id = auth.uid() OR is_phone_admin())
  WITH CHECK (target_user_id = auth.uid() OR is_phone_admin());

-- voicemails: owner sees their own; admins see all; owner/admin can update (mark read).
DROP POLICY IF EXISTS "voicemails_read" ON voicemails;
CREATE POLICY "voicemails_read" ON voicemails
  FOR SELECT TO authenticated
  USING (target_user_id = auth.uid() OR is_phone_admin());

DROP POLICY IF EXISTS "voicemails_update" ON voicemails;
CREATE POLICY "voicemails_update" ON voicemails
  FOR UPDATE TO authenticated
  USING (target_user_id = auth.uid() OR is_phone_admin())
  WITH CHECK (target_user_id = auth.uid() OR is_phone_admin());

DROP POLICY IF EXISTS "voicemails_delete" ON voicemails;
CREATE POLICY "voicemails_delete" ON voicemails
  FOR DELETE TO authenticated
  USING (target_user_id = auth.uid() OR is_phone_admin());

-- =====================================================
-- Enable Supabase Realtime on inbound_calls so the
-- frontend screen-pop receives INSERT events.
-- (Wrapped — re-running is a no-op if already added.)
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'inbound_calls'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE inbound_calls';
  END IF;
EXCEPTION WHEN undefined_object THEN
  -- supabase_realtime publication doesn't exist in this environment; ignore.
  NULL;
END $$;

-- =====================================================
-- Seed a default root IVR menu so the system answers
-- immediately. The principal can edit/replace it in-app.
-- =====================================================
INSERT INTO ivr_menus (name, is_root, greeting_text, greeting_voice, greeting_language)
SELECT 'Main Menu', TRUE,
       'Thank you for calling. If you know your party''s extension, you may dial it at any time. Otherwise, please stay on the line.',
       'Polly.Joanna', 'en-US'
WHERE NOT EXISTS (SELECT 1 FROM ivr_menus WHERE is_root = TRUE);
