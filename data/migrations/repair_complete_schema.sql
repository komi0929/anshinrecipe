-- MASTER REPAIR SCRIPT
-- This script will:
-- 1. Create the 'menus' table if it is missing.
-- 2. Add the necessary granular allergy columns (allergens_contained, allergens_removable).
-- 3. Fix the Foreign Key relationship to 'restaurants'.
-- 4. Enable RLS and Indexes.

BEGIN;

-- 1. Create Table (Safe if exists)
CREATE TABLE IF NOT EXISTS menus (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER,
    image_url TEXT,
    allergens TEXT[] DEFAULT '{}', -- Legacy column
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add Granular Allergy Columns (Safe if exists)
ALTER TABLE menus ADD COLUMN IF NOT EXISTS allergens_contained TEXT[] DEFAULT '{}';
ALTER TABLE menus ADD COLUMN IF NOT EXISTS allergens_removable TEXT[] DEFAULT '{}';
ALTER TABLE menus ADD COLUMN IF NOT EXISTS child_status TEXT DEFAULT 'unknown'; -- extras
ALTER TABLE menus ADD COLUMN IF NOT EXISTS child_details JSONB DEFAULT '{}'; -- extras

-- 3. Fix Foreign Key Constraint (Force Recreation)
ALTER TABLE menus DROP CONSTRAINT IF EXISTS menus_restaurant_id_fkey;
ALTER TABLE menus 
    ADD CONSTRAINT menus_restaurant_id_fkey 
    FOREIGN KEY (restaurant_id) 
    REFERENCES restaurants(id) 
    ON DELETE CASCADE;

-- 4. Enable RLS
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Drop first to avoid duplication errors)
DROP POLICY IF EXISTS "Public menus are viewable by everyone" ON menus;
CREATE POLICY "Public menus are viewable by everyone" ON menus FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert menus" ON menus;
CREATE POLICY "Authenticated users can insert menus" ON menus FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. Indices (Safe if exists)
CREATE INDEX IF NOT EXISTS menus_restaurant_id_idx ON menus (restaurant_id);
CREATE INDEX IF NOT EXISTS menus_allergens_idx ON menus USING gin(allergens);

-- 7. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
