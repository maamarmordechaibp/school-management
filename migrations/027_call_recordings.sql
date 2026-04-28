-- =====================================================
-- 027 — Call recordings library
-- Stores recorded audio messages used by Mass Phone Call.
-- Two sources: (1) upload from disk, (2) record by phone.
-- Files live in Supabase Storage bucket `call-audio` (public).
-- =====================================================

CREATE TABLE IF NOT EXISTS call_recordings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  label         TEXT NOT NULL,                -- friendly name shown in the picker
  audio_url     TEXT NOT NULL,                -- public URL to MP3/WAV in storage
  source        TEXT NOT NULL DEFAULT 'upload',  -- upload | phone
  duration_sec  INT,                          -- best-effort, may be null
  mime_type     TEXT,                         -- e.g. audio/mpeg
  size_bytes    BIGINT,
  provider_sid  TEXT,                         -- SignalWire RecordingSid (if phone)
  created_by    UUID                          -- app_users.id of the recorder
);

CREATE INDEX IF NOT EXISTS idx_call_recordings_created_at ON call_recordings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_recordings_created_by ON call_recordings (created_by);

ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "call_recordings_read_authenticated" ON call_recordings;
CREATE POLICY "call_recordings_read_authenticated" ON call_recordings
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can insert their own rows (uploads from frontend).
DROP POLICY IF EXISTS "call_recordings_insert_authenticated" ON call_recordings;
CREATE POLICY "call_recordings_insert_authenticated" ON call_recordings
  FOR INSERT TO authenticated WITH CHECK (true);

-- Authenticated users can rename / delete recordings (admin tidy-up).
DROP POLICY IF EXISTS "call_recordings_update_authenticated" ON call_recordings;
CREATE POLICY "call_recordings_update_authenticated" ON call_recordings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "call_recordings_delete_authenticated" ON call_recordings;
CREATE POLICY "call_recordings_delete_authenticated" ON call_recordings
  FOR DELETE TO authenticated USING (true);

-- =====================================================
-- Storage bucket for the audio files (public so SignalWire <Play> can fetch).
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('call-audio', 'call-audio', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies on storage.objects for this bucket
DROP POLICY IF EXISTS "call_audio_public_read" ON storage.objects;
CREATE POLICY "call_audio_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'call-audio');

DROP POLICY IF EXISTS "call_audio_authenticated_upload" ON storage.objects;
CREATE POLICY "call_audio_authenticated_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'call-audio');

DROP POLICY IF EXISTS "call_audio_authenticated_update" ON storage.objects;
CREATE POLICY "call_audio_authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'call-audio')
  WITH CHECK (bucket_id = 'call-audio');

DROP POLICY IF EXISTS "call_audio_authenticated_delete" ON storage.objects;
CREATE POLICY "call_audio_authenticated_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'call-audio');
