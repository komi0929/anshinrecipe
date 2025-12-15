-- Create saved_recipes table for bookmarks
CREATE TABLE IF NOT EXISTS saved_recipes (
    combined_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, -- Using text ID or composite key
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, recipe_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user ON saved_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_recipe ON saved_recipes(recipe_id);

-- Enable RLS
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their OWN saved recipes
CREATE POLICY "Users can view own saved_recipes" ON saved_recipes
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their OWN saved recipes
CREATE POLICY "Users can insert own saved_recipes" ON saved_recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their OWN saved recipes
CREATE POLICY "Users can delete own saved_recipes" ON saved_recipes
    FOR DELETE USING (auth.uid() = user_id);
