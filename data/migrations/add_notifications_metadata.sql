-- Migration: Add metadata column to notifications table
-- Required for the "Thanks" feature to store emoji and message data

-- Add metadata column if it doesn't exist
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add index for better query performance on metadata
CREATE INDEX IF NOT EXISTS idx_notifications_metadata 
ON notifications USING GIN (metadata);

-- Comment for documentation
COMMENT ON COLUMN notifications.metadata IS 'Stores additional data like thanks messages, emojis, etc.';
