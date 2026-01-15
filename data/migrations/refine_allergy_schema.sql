-- Add granular allergy columns to menus table
ALTER TABLE menus ADD COLUMN IF NOT EXISTS allergens_contained TEXT[] DEFAULT '{}';
ALTER TABLE menus ADD COLUMN IF NOT EXISTS allergens_removable TEXT[] DEFAULT '{}';

-- Ensure candidates table also has these structure for editing if needed
-- Actually candidates stores menus as JSONB, so we don't need to alter candidates table schema for menus, 
-- but we need to ensure the JSON structure in the app handles it.

-- Comments for documentation
COMMENT ON COLUMN menus.allergens_contained IS 'Array of allergens contained in the menu item (e.g. {wheat, egg})';
COMMENT ON COLUMN menus.allergens_removable IS 'Array of allergens that can be removed from the menu item (e.g. {egg})';
