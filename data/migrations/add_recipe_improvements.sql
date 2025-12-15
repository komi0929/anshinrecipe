-- Add new columns to recipes table for improved recipe registration

-- Child IDs (multiple children can be associated with a recipe)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS child_ids UUID[];

-- Scenes (multiple scenes can be selected)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS scenes TEXT[];

-- Memo field
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS memo TEXT;

-- Add comments
COMMENT ON COLUMN recipes.child_ids IS 'Array of child IDs this recipe is safe for';
COMMENT ON COLUMN recipes.scenes IS 'Array of meal scenes (おかず, おやつ, etc.)';
COMMENT ON COLUMN recipes.memo IS 'User notes about the recipe';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_recipes_child_ids ON recipes USING GIN (child_ids);
CREATE INDEX IF NOT EXISTS idx_recipes_scenes ON recipes USING GIN (scenes);
