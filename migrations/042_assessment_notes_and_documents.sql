-- =====================================================
-- 042: Assessment authorship + notes, and Student Documents
--
-- Adds:
--   1. assessments.created_by / created_by_name  — who created the assessment
--   2. assessment_notes                          — comments other users can add
--                                                  to a (completed) assessment,
--                                                  each stamped with the author.
--   3. student_documents                         — uploaded files (PDF/JPEG/etc.)
--                                                  attached to a student and
--                                                  organised into folders.
--   4. Supabase Storage bucket "student-documents" + policies.
--
-- Idempotent and safe to re-run.
-- =====================================================

-- ---------- 1. ASSESSMENT AUTHORSHIP ----------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='assessments' AND column_name='created_by') THEN
    ALTER TABLE assessments ADD COLUMN created_by UUID REFERENCES app_users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='assessments' AND column_name='created_by_name') THEN
    ALTER TABLE assessments ADD COLUMN created_by_name TEXT;
  END IF;
END $$;

-- ---------- 2. ASSESSMENT NOTES ----------
CREATE TABLE IF NOT EXISTS assessment_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  author_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  author_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessment_notes_assessment
  ON assessment_notes(assessment_id);

ALTER TABLE assessment_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assessment_notes_authenticated_all ON assessment_notes;
CREATE POLICY assessment_notes_authenticated_all
  ON assessment_notes
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
REVOKE ALL ON assessment_notes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON assessment_notes TO authenticated;

-- ---------- 3. STUDENT DOCUMENTS ----------
CREATE TABLE IF NOT EXISTS student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  folder TEXT NOT NULL DEFAULT 'other', -- 'evaluations','reports','medical','plans','correspondence','forms','other'
  file_name TEXT NOT NULL,              -- original display name
  file_path TEXT NOT NULL,              -- path within the storage bucket
  file_type TEXT,                       -- mime type
  file_size BIGINT,                     -- bytes
  description TEXT,
  uploaded_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_documents_student
  ON student_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_folder
  ON student_documents(folder);

ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS student_documents_authenticated_all ON student_documents;
CREATE POLICY student_documents_authenticated_all
  ON student_documents
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
REVOKE ALL ON student_documents FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON student_documents TO authenticated;

-- ---------- 4. STORAGE BUCKET + POLICIES ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-documents', 'student-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "student docs read"   ON storage.objects;
DROP POLICY IF EXISTS "student docs insert" ON storage.objects;
DROP POLICY IF EXISTS "student docs update" ON storage.objects;
DROP POLICY IF EXISTS "student docs delete" ON storage.objects;

CREATE POLICY "student docs read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'student-documents');

CREATE POLICY "student docs insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-documents');

CREATE POLICY "student docs update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'student-documents');

CREATE POLICY "student docs delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'student-documents');
