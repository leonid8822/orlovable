-- Add gems and engraving fields to applications table

-- Add gems field (array of gem placements)
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS gems JSONB DEFAULT '[]'::jsonb;

-- Add back engraving fields
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS back_engraving TEXT;

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS has_back_engraving BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN applications.gems IS 'Array of gem placements: [{id, gemId, x, y}]';
COMMENT ON COLUMN applications.back_engraving IS 'Text for back engraving';
COMMENT ON COLUMN applications.has_back_engraving IS 'Whether back engraving is enabled';

-- Create index for querying applications with gems
CREATE INDEX IF NOT EXISTS idx_applications_has_gems ON applications ((jsonb_array_length(gems) > 0));
