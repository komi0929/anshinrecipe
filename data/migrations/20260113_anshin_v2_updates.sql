-- Anshin Map V2 Updates
-- 1. Menus table enhancements
ALTER TABLE menus ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE menus ADD COLUMN IF NOT EXISTS allergy_note TEXT;
ALTER TABLE menus ADD COLUMN IF NOT EXISTS child_status TEXT DEFAULT 'checking' CHECK (child_status IN ('confirmed', 'checking'));
ALTER TABLE menus ADD COLUMN IF NOT EXISTS child_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE menus ADD COLUMN IF NOT EXISTS price_display TEXT; -- "1200円 (税込)" or "価格データなし"

-- 2. Reviews table link to specific menus
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS menu_id UUID REFERENCES menus(id) ON DELETE SET NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS price_paid INTEGER;

-- 3. User interactions (Visited / Wishlist)
CREATE TABLE IF NOT EXISTS user_restaurants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('visited', 'wishlist')),
    visited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, restaurant_id, status)
);

ALTER TABLE user_restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own restaurant lists" ON user_restaurants
    FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_restaurants_user_id ON user_restaurants(user_id);

-- 4. Deprecating some old fields/tags logic (optional but good to know)
-- We will move away from restaurant_compatibility in the UI logic.
