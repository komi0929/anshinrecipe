-- Migration: Create collections tables for recipe folder feature
-- Allows users to organize saved recipes into custom collections

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📁',
    color TEXT DEFAULT '#f97316', -- Orange-500
    is_default BOOLEAN DEFAULT false,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection recipes junction table
CREATE TABLE IF NOT EXISTS collection_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    position INTEGER DEFAULT 0,
    UNIQUE(collection_id, recipe_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_position ON collections(user_id, position);
CREATE INDEX IF NOT EXISTS idx_collection_recipes_collection_id ON collection_recipes(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_recipes_recipe_id ON collection_recipes(recipe_id);

-- Enable Row Level Security
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collections
CREATE POLICY "Users can view own collections" ON collections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own collections" ON collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON collections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON collections
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for collection_recipes
CREATE POLICY "Users can view own collection recipes" ON collection_recipes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collections 
            WHERE collections.id = collection_recipes.collection_id 
            AND collections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add recipes to own collections" ON collection_recipes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM collections 
            WHERE collections.id = collection_recipes.collection_id 
            AND collections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove recipes from own collections" ON collection_recipes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM collections 
            WHERE collections.id = collection_recipes.collection_id 
            AND collections.user_id = auth.uid()
        )
    );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER collections_updated_at_trigger
    BEFORE UPDATE ON collections
    FOR EACH ROW
    EXECUTE FUNCTION update_collections_updated_at();

-- Comment for documentation
COMMENT ON TABLE collections IS 'User-created folders to organize saved recipes';
COMMENT ON TABLE collection_recipes IS 'Junction table linking recipes to collections';
