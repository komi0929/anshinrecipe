-- Migration to add Pro User fields to profiles table
-- Execute this in Supabase SQL Editor

-- 1. Add Pro User columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS blog_url TEXT;

-- 2. Verify columns
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- AND column_name IN ('is_pro', 'bio', 'instagram_url', 'twitter_url', 'youtube_url', 'blog_url');
