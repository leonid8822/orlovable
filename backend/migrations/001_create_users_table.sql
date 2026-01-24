-- Migration: Create users table for email verification and admin auth
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_code TEXT,
    verification_code_expires_at TIMESTAMPTZ,
    -- Admin fields
    is_admin BOOLEAN DEFAULT FALSE,
    admin_session_token TEXT,
    admin_session_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for service role (backend uses service key)
CREATE POLICY "Service role can do all" ON users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
