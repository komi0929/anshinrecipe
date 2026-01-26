-- ============================================
-- 92件改善: 全不足カラム一括追加マイグレーション
-- コードが参照する全カラムをDBに追加
--
-- 実行前に必ずバックアップを取ってください
-- ============================================

BEGIN;

-- ============================================
-- RESTAURANTS テーブル
-- ============================================
-- 基本情報
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS overview TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS takeout_url TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS place_id TEXT;

-- オーナー認証
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_owner_verified BOOLEAN DEFAULT false;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 画像分類
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS classified_images JSONB DEFAULT '{}';

-- 信頼性スコア
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS reliability_score INTEGER DEFAULT 0;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS last_collected_at TIMESTAMPTZ;

-- SNS関連
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS sns_urls JSONB DEFAULT '[]';

-- ============================================
-- MENUS テーブル（コードで参照されている）
-- ============================================
CREATE TABLE IF NOT EXISTS menus (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER,
    image_url TEXT,
    allergens_contained TEXT[] DEFAULT '{}',
    allergens_removable TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    is_user_submitted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MENUS RLS
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public menus are viewable" ON menus;
CREATE POLICY "Public menus are viewable" ON menus FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can insert menus" ON menus;
CREATE POLICY "Authenticated can insert menus" ON menus FOR INSERT WITH CHECK (true);

-- ============================================
-- STORE_OWNERS テーブル（92件改善 Phase1）
-- ============================================
CREATE TABLE IF NOT EXISTS store_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'staff')),
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    verification_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, restaurant_id)
);

ALTER TABLE store_owners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view verified owners" ON store_owners;
CREATE POLICY "Public can view verified owners" ON store_owners FOR SELECT USING (is_verified = true);
DROP POLICY IF EXISTS "Users can view own ownership" ON store_owners;
CREATE POLICY "Users can view own ownership" ON store_owners FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- OWNER_INVITATIONS テーブル（92件改善 Phase1）
-- ============================================
CREATE TABLE IF NOT EXISTS owner_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    restaurant_name TEXT,
    inviter_user_id UUID REFERENCES auth.users(id),
    inviter_type TEXT DEFAULT 'user',
    target_email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'expired', 'rejected')),
    sent_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

ALTER TABLE owner_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own invitations" ON owner_invitations;
CREATE POLICY "Users can view own invitations" ON owner_invitations FOR SELECT USING (auth.uid() = inviter_user_id);
DROP POLICY IF EXISTS "Authenticated can create invitations" ON owner_invitations;
CREATE POLICY "Authenticated can create invitations" ON owner_invitations FOR INSERT WITH CHECK (true);

-- ============================================
-- REVIEW_COMMENTS テーブル（92件改善 Phase1）
-- ============================================
CREATE TABLE IF NOT EXISTS review_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES review_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_owner_response BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view comments" ON review_comments;
CREATE POLICY "Public can view comments" ON review_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can comment" ON review_comments;
CREATE POLICY "Authenticated can comment" ON review_comments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can edit own comments" ON review_comments;
CREATE POLICY "Users can edit own comments" ON review_comments FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own comments" ON review_comments;
CREATE POLICY "Users can delete own comments" ON review_comments FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- REVIEW_LIKES テーブル（コードで参照）
-- ============================================
CREATE TABLE IF NOT EXISTS review_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view likes" ON review_likes;
CREATE POLICY "Public can view likes" ON review_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can like" ON review_likes;
CREATE POLICY "Authenticated can like" ON review_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can unlike" ON review_likes;
CREATE POLICY "Users can unlike" ON review_likes FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CANDIDATE_RESTAURANTS 追加カラム
-- ============================================
ALTER TABLE candidate_restaurants ADD COLUMN IF NOT EXISTS photo_refs TEXT[] DEFAULT '{}';
ALTER TABLE candidate_restaurants ADD COLUMN IF NOT EXISTS place_id TEXT;
ALTER TABLE candidate_restaurants ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE candidate_restaurants ADD COLUMN IF NOT EXISTS phone TEXT;

-- ============================================
-- インデックス作成
-- ============================================
CREATE INDEX IF NOT EXISTS idx_menus_restaurant ON menus(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_store_owners_user ON store_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_store_owners_restaurant ON store_owners(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_review ON review_comments(review_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_review ON review_likes(review_id);
CREATE INDEX IF NOT EXISTS idx_owner_invitations_token ON owner_invitations(token);

-- ============================================
-- スキーマリロード
-- ============================================
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================
-- 確認クエリ（成功確認用）
-- ============================================
SELECT
    'restaurants' as table_name,
    array_agg(column_name ORDER BY column_name) as columns
FROM information_schema.columns
WHERE table_name = 'restaurants'
AND column_name IN (
    'is_owner_verified', 'takeout_url', 'overview',
    'classified_images', 'image_url', 'instagram_url', 'place_id'
);
