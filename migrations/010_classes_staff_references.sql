-- ============================================
-- Add Staff Member References to Classes
-- ============================================
-- Links classes directly to staff_members for teacher assignment
-- ============================================

-- Add columns to reference staff_members instead of app_users
ALTER TABLE classes ADD COLUMN IF NOT EXISTS hebrew_staff_id UUID REFERENCES staff_members(id);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS english_staff_id UUID REFERENCES staff_members(id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_classes_hebrew_staff ON classes(hebrew_staff_id);
CREATE INDEX IF NOT EXISTS idx_classes_english_staff ON classes(english_staff_id);

COMMIT;
