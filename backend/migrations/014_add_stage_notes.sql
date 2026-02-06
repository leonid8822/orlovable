-- Migration 014: Add stage_notes JSONB column for per-stage notes/agreements
-- Format: {"design": "Client agreed to round shape", "casting": "Used 15g silver 925", ...}

ALTER TABLE orders ADD COLUMN IF NOT EXISTS stage_notes JSONB DEFAULT '{}';

COMMENT ON COLUMN orders.stage_notes IS 'Notes/agreements per production stage';
