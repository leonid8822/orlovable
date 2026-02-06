-- Migration: Add production role to users table
-- Run this in Supabase SQL Editor

-- Add is_production column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_production BOOLEAN DEFAULT FALSE;

-- Add production session fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS production_session_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS production_session_expires_at TIMESTAMPTZ;

-- Create index for production users
CREATE INDEX IF NOT EXISTS idx_users_is_production ON users(is_production) WHERE is_production = true;

-- Comment
COMMENT ON COLUMN users.is_production IS 'User has access to production workspace for manufacturing orders';
