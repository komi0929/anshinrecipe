-- Migration: Fix Notifications RLS Policy for INSERT
-- The auth.role() function doesn't work as expected in Supabase v2
-- We need to use auth.uid() IS NOT NULL instead

-- 1. Drop the old INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;

-- 2. Create new INSERT policy using auth.uid()
CREATE POLICY "Authenticated users can insert notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Ensure metadata column exists (required for thanks feature)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 4. Add index for better query performance on metadata if not exists
CREATE INDEX IF NOT EXISTS idx_notifications_metadata 
ON notifications USING GIN (metadata);

-- 5. Add index for actor_id if not exists
CREATE INDEX IF NOT EXISTS idx_notifications_actor ON notifications(actor_id);

-- 6. Add index for type if not exists
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Comment for documentation
COMMENT ON TABLE notifications IS 'User notifications including thanks, likes, saves, reports, and system announcements';
