-- ============================================
-- Class Book Requirements
-- ============================================
-- Allows assigning books to specific classes (not just grades)
-- ============================================

-- Create class_book_requirements table
CREATE TABLE IF NOT EXISTS class_book_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  academic_year VARCHAR(20) DEFAULT '2024-2025',
  is_required BOOLEAN DEFAULT true,
  quantity_per_student INT DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, book_id, academic_year)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_class_book_req_class ON class_book_requirements(class_id);
CREATE INDEX IF NOT EXISTS idx_class_book_req_book ON class_book_requirements(book_id);
CREATE INDEX IF NOT EXISTS idx_class_book_req_year ON class_book_requirements(academic_year);

-- Enable RLS
ALTER TABLE class_book_requirements ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "class_book_requirements_all" ON class_book_requirements
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Add promotion tracking to students
-- ============================================
ALTER TABLE students ADD COLUMN IF NOT EXISTS previous_class_id UUID REFERENCES classes(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS promoted_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS promoted_by UUID REFERENCES app_users(id);

COMMIT;
