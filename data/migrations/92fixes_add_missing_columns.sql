-- ============================================
-- 92件改善: 必須カラム追加マイグレーション
-- restaurants テーブルに不足しているカラムを追加
-- ============================================

-- Step 1: 不足カラムを追加
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_owner_verified BOOLEAN DEFAULT false;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS takeout_url TEXT;

-- Step 2: 既存カラムの確認（既に存在する場合はスキップ）
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS overview TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS classified_images JSONB DEFAULT '{}';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS place_id TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Step 3: PostgRESTスキーマをリロード
NOTIFY pgrst, 'reload schema';

-- 確認
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'restaurants'
AND column_name IN ('is_owner_verified', 'takeout_url', 'overview', 'classified_images')
ORDER BY column_name;
