-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON likes;
DROP POLICY IF EXISTS "Users can update their own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;
DROP POLICY IF EXISTS "Anyone can view tried reports" ON tried_reports;
DROP POLICY IF EXISTS "Users can insert their own reports" ON tried_reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON tried_reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON tried_reports;

-- Create likes table for recipe reactions
CREATE TABLE IF NOT EXISTS likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('yummy', 'helpful', 'ate_it')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, recipe_id)
);

-- Create tried_reports table
CREATE TABLE IF NOT EXISTS tried_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    image_url TEXT,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_likes_recipe_id ON likes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_tried_reports_recipe_id ON tried_reports(recipe_id);
CREATE INDEX IF NOT EXISTS idx_tried_reports_user_id ON tried_reports(user_id);

-- Create function to get reaction counts
CREATE OR REPLACE FUNCTION get_reaction_counts(recipe_uuid UUID)
RETURNS TABLE(reaction_type TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT l.reaction_type, COUNT(*)::BIGINT
    FROM likes l
    WHERE l.recipe_id = recipe_uuid
    GROUP BY l.reaction_type;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tried_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for likes
CREATE POLICY "Anyone can view likes"
    ON likes FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own likes"
    ON likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own likes"
    ON likes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
    ON likes FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for tried_reports
CREATE POLICY "Anyone can view tried reports"
    ON tried_reports FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own reports"
    ON tried_reports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
    ON tried_reports FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
    ON tried_reports FOR DELETE
    USING (auth.uid() = user_id);
