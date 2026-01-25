-- ============================================
-- 92件改善 Phase 1: DBスキーマ修正
-- ============================================

-- 1.1 store_owners テーブル作成
CREATE TABLE IF NOT EXISTS public.store_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verification_method TEXT, -- 'email', 'phone', 'document', 'admin_manual'
  role TEXT DEFAULT 'owner', -- 'owner', 'manager', 'staff'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, restaurant_id)
);

-- RLS for store_owners
ALTER TABLE public.store_owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view verified owners" ON public.store_owners
  FOR SELECT USING (is_verified = true);

CREATE POLICY "Users can view own ownership" ON public.store_owners
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can request ownership" ON public.store_owners
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ownership" ON public.store_owners
  FOR UPDATE USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_store_owners_user ON public.store_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_store_owners_restaurant ON public.store_owners(restaurant_id);

-- ============================================
-- 1.2 owner_invitations テーブル作成
-- ============================================
CREATE TABLE IF NOT EXISTS public.owner_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  restaurant_name TEXT,
  inviter_user_id UUID REFERENCES auth.users(id),
  inviter_type TEXT DEFAULT 'user', -- 'user', 'admin', 'system'
  target_email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'accepted', 'expired', 'rejected'
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- RLS for owner_invitations
ALTER TABLE public.owner_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invitations" ON public.owner_invitations
  FOR SELECT USING (auth.uid() = inviter_user_id);

CREATE POLICY "Authenticated users can create invitations" ON public.owner_invitations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Invited users can accept" ON public.owner_invitations
  FOR UPDATE USING (status = 'sent' OR status = 'pending');

-- Index
CREATE INDEX IF NOT EXISTS idx_owner_invitations_token ON public.owner_invitations(token);
CREATE INDEX IF NOT EXISTS idx_owner_invitations_restaurant ON public.owner_invitations(restaurant_id);

-- ============================================
-- 1.3 review_comments テーブル作成
-- ============================================
CREATE TABLE IF NOT EXISTS public.review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.review_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_owner_response BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for review_comments
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view comments" ON public.review_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" ON public.review_comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can edit own comments" ON public.review_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.review_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_review_comments_review ON public.review_comments(review_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_user ON public.review_comments(user_id);

-- ============================================
-- 1.8 review-images バケット作成用SQL（参考）
-- ※ 実際のバケット作成はSupabase Dashboard or API経由
-- ============================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('review-images', 'review-images', true)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 1.10 review_likes view for aggregation (改善)
-- ============================================
CREATE OR REPLACE VIEW public.review_likes_count AS
SELECT
  review_id,
  COUNT(*) as like_count
FROM public.review_likes
GROUP BY review_id;

-- Grant access
GRANT SELECT ON public.review_likes_count TO anon, authenticated;
