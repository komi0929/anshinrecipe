-- Add BAN functionality columns to profiles table
-- Execute this in Supabase SQL Editor

-- 1. Add is_banned column (default false)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- 2. Add ban_reason column (nullable text)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- 3. Add banned_at column (nullable timestamp)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;

-- 4. Create index for faster banned user queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned);

-- Verification query (run after migration to confirm)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND column_name IN ('is_banned', 'ban_reason', 'banned_at');
