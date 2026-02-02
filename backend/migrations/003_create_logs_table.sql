-- Create application logs table for debugging
CREATE TABLE IF NOT EXISTS app_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(20) NOT NULL DEFAULT 'info',  -- debug, info, warning, error
    source VARCHAR(100),                         -- e.g., 'gem_upload', 'generation', 'payment'
    message TEXT NOT NULL,
    details JSONB,                               -- Additional context (stack trace, request data, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_app_logs_created_at ON app_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON app_logs(level);
CREATE INDEX IF NOT EXISTS idx_app_logs_source ON app_logs(source);

-- Auto-cleanup: keep only last 7 days of logs
-- Run this periodically or set up a cron job
-- DELETE FROM app_logs WHERE created_at < NOW() - INTERVAL '7 days';
