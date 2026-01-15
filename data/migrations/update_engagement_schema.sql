-- ENGAGEMENT & COMMUNITY FEATURES MIGRATION
-- 1. Unify "Shop Reviews" and "Menu Posts" into the existing 'reviews' table.
-- 2. Create 'bookmarks' table for "Want to go" functionality.
-- 3. Create 'review_likes' table for "Like" functionality on posts.

BEGIN;

-- ============================================================
-- 1. UPDATE 'reviews' TABLE (The Core Post Entity)
-- ============================================================
-- Add columns to support Menu Posts
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS menu_id UUID REFERENCES menus(id) ON DELETE SET NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_own_menu BOOLEAN DEFAULT false; -- True if user typed a custom menu name
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS custom_menu_name TEXT; -- If not provided via menu_id
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS price_paid INTEGER;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_type TEXT DEFAULT 'shop_review' CHECK (review_type IN ('shop_review', 'menu_post'));
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS visit_type TEXT DEFAULT 'eat_in' CHECK (visit_type IN ('eat_in', 'takeout', 'delivery', 'other'));

-- Index for faster lookup of posts per menu
CREATE INDEX IF NOT EXISTS reviews_menu_id_idx ON reviews (menu_id);
-- Index for finding user's posts
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews (user_id);


-- ============================================================
-- 2. CREATE 'bookmarks' TABLE (Saved Restaurants / Want to Go)
-- ============================================================
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    note TEXT, -- Optional: "Want to go for birthday"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, restaurant_id) -- One bookmark per shop per user
);

-- RLS for bookmarks
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
CREATE POLICY "Users can view own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bookmarks" ON bookmarks;
CREATE POLICY "Users can insert own bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON bookmarks;
CREATE POLICY "Users can delete own bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 3. CREATE 'review_likes' TABLE (Like a Post)
-- ============================================================
CREATE TABLE IF NOT EXISTS review_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, review_id) -- One like per post per user
);

-- RLS for review_likes
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view likes" ON review_likes;
CREATE POLICY "Public can view likes" ON review_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can like" ON review_likes;
CREATE POLICY "Authenticated users can like" ON review_likes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can unlike" ON review_likes;
CREATE POLICY "Users can unlike" ON review_likes FOR DELETE USING (auth.uid() = user_id);

-- Helper to count likes on reviews (Optimized View or Function usually better, but for now client counts or simple function)
-- Let's create a simple function to toggle like (safety)
CREATE OR REPLACE FUNCTION toggle_review_like(target_review_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  exists_check BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM review_likes WHERE user_id = auth.uid() AND review_id = target_review_id) INTO exists_check;
  
  IF exists_check THEN
    DELETE FROM review_likes WHERE user_id = auth.uid() AND review_id = target_review_id;
    RETURN false; -- Unliked
  ELSE
    INSERT INTO review_likes (user_id, review_id) VALUES (auth.uid(), target_review_id);
    RETURN true; -- Liked
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 4. NOTIFY RELOAD
-- ============================================================
NOTIFY pgrst, 'reload schema';

COMMIT;
