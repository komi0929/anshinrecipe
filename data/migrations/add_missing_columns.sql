-- =============================================================
-- 事前準備: 不足カラムを追加するマイグレーション
-- サンプルデータ投入前に実行してください
-- =============================================================

BEGIN;

-- restaurants テーブルに不足カラムを追加
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_owner_verified BOOLEAN DEFAULT false;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS overview TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS classified_images JSONB DEFAULT '{}';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS place_id TEXT;

-- reviews テーブルに不足カラムを追加（念のため）
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_type TEXT DEFAULT 'shop_review';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS visit_type TEXT DEFAULT 'eat_in';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS menu_id UUID;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS price_paid INTEGER;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS allergy_status TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_own_menu BOOLEAN DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS custom_menu_name TEXT;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;

-- 確認クエリ
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'restaurants';
