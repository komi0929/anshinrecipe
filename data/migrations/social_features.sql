-- Social Features Database Schema Migration
-- Execute this in Supabase SQL Editor

-- 1. Create tried_reports table
CREATE TABLE IF NOT EXISTS tried_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    image_url TEXT,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_tried_reports_recipe ON tried_reports(recipe_id);
CREATE INDEX IF NOT EXISTS idx_tried_reports_user ON tried_reports(user_id);

-- 2. Create likes table with reaction_type
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('yummy', 'helpful', 'ate_it')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, recipe_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_likes_recipe ON likes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);

-- 3. Add positive_ingredients column to recipes table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'positive_ingredients'
    ) THEN
        ALTER TABLE recipes ADD COLUMN positive_ingredients JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Index for searching by ingredients
CREATE INDEX IF NOT EXISTS idx_recipes_positive_ingredients ON recipes USING GIN (positive_ingredients);

-- 4. Create function to get reaction counts
CREATE OR REPLACE FUNCTION get_reaction_counts(recipe_uuid UUID)
RETURNS TABLE (reaction_type TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT l.reaction_type, COUNT(*)::BIGINT
    FROM likes l
    WHERE l.recipe_id = recipe_uuid
    GROUP BY l.reaction_type;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE tried_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for tried_reports
-- Allow users to read all reports
CREATE POLICY "Anyone can view tried reports" ON tried_reports
    FOR SELECT USING (true);

-- Allow authenticated users to create reports
CREATE POLICY "Authenticated users can create reports" ON tried_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own reports
CREATE POLICY "Users can delete own reports" ON tried_reports
    FOR DELETE USING (auth.uid() = user_id);

-- 7. RLS Policies for likes
-- Allow users to read all likes
CREATE POLICY "Anyone can view likes" ON likes
    FOR SELECT USING (true);

-- Allow authenticated users to create likes
CREATE POLICY "Authenticated users can create likes" ON likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own likes
CREATE POLICY "Users can update own likes" ON likes
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own likes
CREATE POLICY "Users can delete own likes" ON likes
    FOR DELETE USING (auth.uid() = user_id);

-- Verification queries (optional - run these to verify)
-- SELECT * FROM information_schema.tables WHERE table_name IN ('tried_reports', 'likes');
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'positive_ingredients';
-- SELECT * FROM get_reaction_counts('00000000-0000-0000-0000-000000000000');
