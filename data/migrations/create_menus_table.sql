-- Create menus table for Menu-First Search
CREATE TABLE IF NOT EXISTS menus (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER,
    image_url TEXT,
    
    -- Array of allergens CONTAINED in this menu. 
    -- Empty array means likely safe (or check tags).
    -- e.g. ['egg', 'milk']
    allergens TEXT[] DEFAULT '{}',
    
    -- Special flags for "Anshin" discovery
    -- e.g. 'low_allergen', 'gluten_free', 'vegan', 'kids'
    tags TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public menus are viewable by everyone" ON menus
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert menus" ON menus
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS menus_restaurant_id_idx ON menus (restaurant_id);
CREATE INDEX IF NOT EXISTS menus_allergens_idx ON menus USING gin(allergens);
CREATE INDEX IF NOT EXISTS menus_tags_idx ON menus USING gin(tags);
