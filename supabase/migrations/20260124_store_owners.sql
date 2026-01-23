-- 店舗オーナーシステム用マイグレーション
-- Migration: 20260124_store_owners.sql
-- Created: 2026-01-24

-- ============================================
-- 1. 店舗オーナーテーブル
-- ============================================
CREATE TABLE IF NOT EXISTS store_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL, -- References candidate_restaurants or restaurants
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verification_method TEXT, -- 'email_token', 'manual', 'document'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id) -- 1店舗につき1オーナー
);

-- オーナー検索用インデックス
CREATE INDEX IF NOT EXISTS idx_store_owners_user_id ON store_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_store_owners_restaurant_id ON store_owners(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_store_owners_verified ON store_owners(is_verified) WHERE is_verified = TRUE;

-- コメント
COMMENT ON TABLE store_owners IS '店舗オーナー管理テーブル';
COMMENT ON COLUMN store_owners.user_id IS 'オーナーのユーザーID（profiles参照）';
COMMENT ON COLUMN store_owners.restaurant_id IS '管理対象の店舗ID';
COMMENT ON COLUMN store_owners.is_verified IS 'オーナー認証完了フラグ';
COMMENT ON COLUMN store_owners.verification_method IS '認証方法（email_token/manual/document）';

-- ============================================
-- 2. オーナー招待テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS owner_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  inviter_user_id UUID REFERENCES profiles(id),
  inviter_type TEXT DEFAULT 'user', -- 'user', 'admin'
  target_email TEXT NOT NULL,
  restaurant_name TEXT, -- 招待メール用にキャッシュ
  status TEXT DEFAULT 'pending', -- pending/sent/accepted/expired/cancelled
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 招待トークン検索用インデックス
CREATE INDEX IF NOT EXISTS idx_owner_invitations_token ON owner_invitations(token);
CREATE INDEX IF NOT EXISTS idx_owner_invitations_restaurant ON owner_invitations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_owner_invitations_status ON owner_invitations(status);
CREATE INDEX IF NOT EXISTS idx_owner_invitations_email ON owner_invitations(target_email);

-- コメント
COMMENT ON TABLE owner_invitations IS 'オーナー招待管理テーブル';
COMMENT ON COLUMN owner_invitations.token IS '招待受諾用のユニークトークン（URL用）';
COMMENT ON COLUMN owner_invitations.inviter_type IS '招待者種別（user=一般ユーザー、admin=管理者）';
COMMENT ON COLUMN owner_invitations.status IS '招待ステータス（pending/sent/accepted/expired/cancelled）';

-- ============================================
-- 3. candidate_restaurants への追加カラム
-- ============================================
-- オーナー認証フラグ
ALTER TABLE candidate_restaurants ADD COLUMN IF NOT EXISTS is_owner_verified BOOLEAN DEFAULT FALSE;

-- AI生成の概要文
ALTER TABLE candidate_restaurants ADD COLUMN IF NOT EXISTS overview TEXT;

-- お取り寄せURL
ALTER TABLE candidate_restaurants ADD COLUMN IF NOT EXISTS takeout_url TEXT;

-- 分類済み画像（exterior/interior/food/other）
ALTER TABLE candidate_restaurants ADD COLUMN IF NOT EXISTS classified_images JSONB;

-- カラムコメント
COMMENT ON COLUMN candidate_restaurants.is_owner_verified IS 'オーナー認証済みフラグ（公認バッジ表示用）';
COMMENT ON COLUMN candidate_restaurants.overview IS 'AI生成またはオーナー入力の店舗概要';
COMMENT ON COLUMN candidate_restaurants.takeout_url IS 'お取り寄せ・通販サイトURL';
COMMENT ON COLUMN candidate_restaurants.classified_images IS '分類済み画像（{exterior:[], interior:[], food:[], other:[]}）';

-- 公認店舗優先表示用インデックス
CREATE INDEX IF NOT EXISTS idx_candidate_restaurants_verified ON candidate_restaurants(is_owner_verified) WHERE is_owner_verified = TRUE;

-- ============================================
-- 4. 更新日時自動更新トリガー
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- store_ownersテーブル用トリガー
DROP TRIGGER IF EXISTS update_store_owners_updated_at ON store_owners;
CREATE TRIGGER update_store_owners_updated_at
  BEFORE UPDATE ON store_owners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Row Level Security (RLS) ポリシー
-- ============================================
-- store_owners RLS
ALTER TABLE store_owners ENABLE ROW LEVEL SECURITY;

-- オーナー自身は自分のレコードを閲覧・編集可能
CREATE POLICY "owners_can_view_own" ON store_owners
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "owners_can_update_own" ON store_owners
  FOR UPDATE USING (auth.uid() = user_id);

-- 全員がオーナー情報を閲覧可能（公認バッジ表示用）
CREATE POLICY "public_can_view_verified" ON store_owners
  FOR SELECT USING (is_verified = TRUE);

-- owner_invitations RLS
ALTER TABLE owner_invitations ENABLE ROW LEVEL SECURITY;

-- 招待者は自分の招待を閲覧可能
CREATE POLICY "inviters_can_view_own" ON owner_invitations
  FOR SELECT USING (auth.uid() = inviter_user_id);

-- 招待トークン持参者は招待を閲覧可能（認証前でも）
CREATE POLICY "anyone_can_view_by_token" ON owner_invitations
  FOR SELECT USING (TRUE);

-- 認証済みユーザーは招待を作成可能
CREATE POLICY "authenticated_can_insert" ON owner_invitations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
