-- Fix Foreign Key Relationship for Menus
-- This script ensures the relationship exists and forces a schema cache reload

BEGIN;

-- 1. Ensure the constraint exists (Drop first to be safe if it's broken)
ALTER TABLE menus DROP CONSTRAINT IF EXISTS menus_restaurant_id_fkey;

ALTER TABLE menus
    ADD CONSTRAINT menus_restaurant_id_fkey
    FOREIGN KEY (restaurant_id)
    REFERENCES restaurants(id)
    ON DELETE CASCADE;

-- 2. Explicitly comment on the column to help PostgREST discovery (sometimes needed)
COMMENT ON CONSTRAINT menus_restaurant_id_fkey ON menus IS 'Links menu items to their parent restaurant';

-- 3. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;
