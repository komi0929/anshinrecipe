-- =========================================================
-- 92件改善 Phase5: Supabase RLS強化 (5.61-5.65)
-- =========================================================

-- =========================================================
-- 1. レビューテーブル RLS
-- =========================================================

-- 既存ポリシーを更新（存在しない場合は作成）
DROP POLICY IF EXISTS "reviews_select_public" ON reviews;
CREATE POLICY "reviews_select_public" ON reviews
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews_insert_authenticated" ON reviews;
CREATE POLICY "reviews_insert_authenticated" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
CREATE POLICY "reviews_delete_own" ON reviews
    FOR DELETE USING (auth.uid() = user_id);

-- =========================================================
-- 2. ブックマークテーブル RLS
-- =========================================================

DROP POLICY IF EXISTS "bookmarks_select_own" ON bookmarks;
CREATE POLICY "bookmarks_select_own" ON bookmarks
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_insert_own" ON bookmarks;
CREATE POLICY "bookmarks_insert_own" ON bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_delete_own" ON bookmarks;
CREATE POLICY "bookmarks_delete_own" ON bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- =========================================================
-- 3. プロフィールテーブル RLS
-- =========================================================

DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
CREATE POLICY "profiles_select_public" ON profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- =========================================================
-- 4. review_likesテーブル RLS
-- =========================================================

DROP POLICY IF EXISTS "review_likes_select_public" ON review_likes;
CREATE POLICY "review_likes_select_public" ON review_likes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "review_likes_insert_own" ON review_likes;
CREATE POLICY "review_likes_insert_own" ON review_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "review_likes_delete_own" ON review_likes;
CREATE POLICY "review_likes_delete_own" ON review_likes
    FOR DELETE USING (auth.uid() = user_id);

-- =========================================================
-- 5. review_commentsテーブル RLS
-- =========================================================

DROP POLICY IF EXISTS "review_comments_select_public" ON review_comments;
CREATE POLICY "review_comments_select_public" ON review_comments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "review_comments_insert_authenticated" ON review_comments;
CREATE POLICY "review_comments_insert_authenticated" ON review_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id OR is_owner_response = true);

DROP POLICY IF EXISTS "review_comments_update_own" ON review_comments;
CREATE POLICY "review_comments_update_own" ON review_comments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "review_comments_delete_own" ON review_comments;
CREATE POLICY "review_comments_delete_own" ON review_comments
    FOR DELETE USING (auth.uid() = user_id);

-- =========================================================
-- 6. オーナー関連テーブル RLS
-- =========================================================

-- store_owners
DROP POLICY IF EXISTS "store_owners_select_own" ON store_owners;
CREATE POLICY "store_owners_select_own" ON store_owners
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM auth.users WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
    ));

DROP POLICY IF EXISTS "store_owners_insert_admin" ON store_owners;
CREATE POLICY "store_owners_insert_admin" ON store_owners
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM auth.users WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
    ));

-- owner_invitations
DROP POLICY IF EXISTS "owner_invitations_select" ON owner_invitations;
CREATE POLICY "owner_invitations_select" ON owner_invitations
    FOR SELECT USING (
        auth.uid() = invited_by OR
        auth.email() = email OR
        EXISTS (
            SELECT 1 FROM auth.users WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- =========================================================
-- 7. レストランテーブル RLS (オーナー編集権限)
-- =========================================================

DROP POLICY IF EXISTS "restaurants_update_owner" ON restaurants;
CREATE POLICY "restaurants_update_owner" ON restaurants
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM store_owners
            WHERE store_owners.restaurant_id = restaurants.id
            AND store_owners.user_id = auth.uid()
            AND store_owners.status = 'approved'
        ) OR EXISTS (
            SELECT 1 FROM auth.users WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );
