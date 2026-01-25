-- candidate_restaurants に photo_refs と place_id カラムを追加
-- Supabase SQL Editor で実行してください

BEGIN;

-- 1. photo_refs - Google Photos の参照IDリスト
ALTER TABLE candidate_restaurants
  ADD COLUMN IF NOT EXISTS photo_refs JSONB DEFAULT '[]';

-- 2. place_id - Google Places ID
ALTER TABLE candidate_restaurants
  ADD COLUMN IF NOT EXISTS place_id TEXT;

-- 3. website_url - 公式サイトURL
ALTER TABLE candidate_restaurants
  ADD COLUMN IF NOT EXISTS website_url TEXT;

-- 4. phone - 電話番号
ALTER TABLE candidate_restaurants
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 5. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;
