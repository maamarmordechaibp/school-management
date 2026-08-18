-- =====================================================
-- 052: Threaded student notes (chat-style conversations)
--
-- Lets any note be a reply to another note so a single topic reads as a
-- full conversation (like a text-message thread). Idempotent / safe to re-run.
-- =====================================================

ALTER TABLE student_notes
  ADD COLUMN IF NOT EXISTS parent_note_id UUID REFERENCES student_notes(id) ON DELETE CASCADE;

-- Fast lookup of all replies belonging to a thread root.
CREATE INDEX IF NOT EXISTS idx_student_notes_parent
  ON student_notes (parent_note_id)
  WHERE parent_note_id IS NOT NULL;

-- =====================================================
-- 052 COMPLETE
-- =====================================================
