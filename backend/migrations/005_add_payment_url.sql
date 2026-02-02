-- Add payment_url column to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_url TEXT;

-- Add description column to gems table
ALTER TABLE gems ADD COLUMN IF NOT EXISTS description TEXT;
