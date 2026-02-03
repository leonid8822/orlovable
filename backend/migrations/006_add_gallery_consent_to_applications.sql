-- Add gallery consent field to applications table

-- Add consent field
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS allow_gallery_use BOOLEAN DEFAULT true;

-- Add comment
COMMENT ON COLUMN applications.allow_gallery_use IS 'User consent to use their images in the gallery';

-- Create index for filtering applications that allow gallery use
CREATE INDEX IF NOT EXISTS idx_applications_allow_gallery_use ON applications(allow_gallery_use) WHERE allow_gallery_use = true;
