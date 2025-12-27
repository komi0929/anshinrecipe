-- Migration: Add reaction column to tried_reports table
-- Allows capturing child's reaction (e.g. "ate all", "refused")

ALTER TABLE tried_reports 
ADD COLUMN IF NOT EXISTS reaction TEXT;

-- Comment for documentation
COMMENT ON COLUMN tried_reports.reaction IS 'Child reaction: ate_all, ate_some, not_today, etc.';
