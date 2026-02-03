-- Add gems configuration column to applications table
-- Stores array of gem placements: [{id, gemId, x, y}, ...]

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS gems jsonb DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN applications.gems IS 'Array of gem placements: [{id, gemId, x, y}, ...]';

-- Verify
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'applications'
AND column_name = 'gems';
