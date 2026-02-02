-- Migration: Add profile fields to users table
-- This makes users the source of truth for customer data (not applications)

-- Add phone field
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add profile fields (if not exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscribe_newsletter BOOLEAN DEFAULT FALSE;

-- Create index for phone lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_username);
