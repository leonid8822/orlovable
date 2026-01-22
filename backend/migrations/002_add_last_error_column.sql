-- Add last_error column to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Add index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
