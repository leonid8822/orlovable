-- Add gems configuration to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS gems JSONB DEFAULT '[]';

-- Add admin user
INSERT INTO users (email, is_admin, created_at)
VALUES ('shauk@yandex.ru', true, NOW())
ON CONFLICT (email) DO UPDATE SET is_admin = true;
