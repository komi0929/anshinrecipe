-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    phone TEXT,
    opening_hours JSONB DEFAULT '{}'::jsonb,
    place_id TEXT,
    contamination_level TEXT CHECK (contamination_level IN ('strict', 'normal', 'unknown')),
    website_url TEXT,
    tags TEXT[] DEFAULT '{}',
    features JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create restaurant_compatibility table (Allergen status)
CREATE TABLE IF NOT EXISTS restaurant_compatibility (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    allergen TEXT NOT NULL, -- 'wheat', 'milk', 'egg', 'nut', 'buckwheat', 'shrimp', 'crab'
    status TEXT NOT NULL CHECK (status IN ('safe', 'removable', 'contaminated', 'unknown')),
    details TEXT, -- Optional details about the specific allergen handling
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(restaurant_id, allergen)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for possible anon reviews if decided later, currently usually auth
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    visit_date DATE DEFAULT CURRENT_DATE,
    allergens_safe TEXT[] DEFAULT '{}', -- Which allergens were safe for this user
    images JSONB[] DEFAULT '{}',
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies for restaurants (Public Read, Admin Write - assuming admin check logic or open for now seed)
CREATE POLICY "Public restaurants are viewable by everyone" ON restaurants
    FOR SELECT USING (true);

-- Allow authenticated users to insert restaurants (UGC model) or restrict to admin?
-- For now, let's allow authenticated users to propose/insert for growth
CREATE POLICY "Authenticated users can insert restaurants" ON restaurants
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
-- Policies for compatibility
CREATE POLICY "Public compatibility info is viewable by everyone" ON restaurant_compatibility
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert compatibility" ON restaurant_compatibility
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for reviews
CREATE POLICY "Public reviews are viewable by everyone" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for geo-search and filtering
CREATE INDEX IF NOT EXISTS restaurants_lat_lng_idx ON restaurants (lat, lng);
CREATE INDEX IF NOT EXISTS restaurant_compatibility_restaurant_id_idx ON restaurant_compatibility (restaurant_id);
CREATE INDEX IF NOT EXISTS restaurant_compatibility_allergen_status_idx ON restaurant_compatibility (allergen, status);
CREATE INDEX IF NOT EXISTS reviews_restaurant_id_idx ON reviews (restaurant_id);
