-- Migration: Add theme column to applications and pendant_generations tables
-- Run this in Supabase SQL Editor

-- Add theme column to applications table
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'main';

-- Add theme column to pendant_generations table
ALTER TABLE pendant_generations
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'main';

-- Update all existing records to use 'kids' theme
UPDATE applications SET theme = 'kids' WHERE theme IS NULL OR theme = 'main';
UPDATE pendant_generations SET theme = 'kids' WHERE theme IS NULL OR theme = 'main';

-- Verify the migration
SELECT 'applications' as table_name, theme, COUNT(*) as count
FROM applications
GROUP BY theme
UNION ALL
SELECT 'pendant_generations' as table_name, theme, COUNT(*) as count
FROM pendant_generations
GROUP BY theme;
