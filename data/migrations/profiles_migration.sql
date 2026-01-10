-- Profiles Table Migration for LINE Login
-- Execute this in Supabase SQL Editor

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    line_user_id TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_line_user_id ON profiles(line_user_id);

-- 3. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to update updated_at on profile updates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for profiles (Optimized with SELECT auth.uid())
-- Allow anyone to read profiles
CREATE POLICY "profiles_select_all" ON profiles
    FOR SELECT USING (true);

-- Allow users to insert their own profile (Support upsert)
CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING ((SELECT auth.uid()) = id);

-- Allow users to delete their own profile
CREATE POLICY "profiles_delete_own" ON profiles
    FOR DELETE USING ((SELECT auth.uid()) = id);

-- Verification query (optional - run this to verify)
-- SELECT * FROM information_schema.tables WHERE table_name = 'profiles';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';
