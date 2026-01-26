-- ============================================
-- 完全版ダミー店舗データ（92件改善検証用）
-- 全ての機能を網羅した完全なテストデータ
-- ============================================

-- ============================================
-- Step 1: 既存のテストデータを削除
-- ============================================
DELETE FROM reviews WHERE restaurant_id IN (
  SELECT id FROM restaurants WHERE name LIKE '%テスト%' OR name LIKE '%サンプル%' OR name LIKE '%ダミー%'
);
DELETE FROM menus WHERE restaurant_id IN (
  SELECT id FROM restaurants WHERE name LIKE '%テスト%' OR name LIKE '%サンプル%' OR name LIKE '%ダミー%'
);
DELETE FROM restaurant_compatibility WHERE restaurant_id IN (
  SELECT id FROM restaurants WHERE name LIKE '%テスト%' OR name LIKE '%サンプル%' OR name LIKE '%ダミー%'
);
DELETE FROM restaurants WHERE name LIKE '%テスト%' OR name LIKE '%サンプル%' OR name LIKE '%ダミー%';

-- ============================================
-- Step 2: 完全版ダミー店舗を挿入
-- ============================================
INSERT INTO restaurants (
  id,
  name,
  address,
  lat,
  lng,
  phone,
  website_url,
  tags,
  overview,
  is_owner_verified,
  instagram_url,
  takeout_url,
  features,
  classified_images,
  image_url,
  created_at,
  updated_at
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'アレルギーフリーキッチン ひまわり',
  '東京都渋谷区神南1-23-10 ひまわりビル1F',
  35.6614,
  139.7009,
  '03-1234-5678',
  'https://himawari-allergy-free.example.com',
  ARRAY['アレルギー対応', 'キッズ歓迎', 'カフェ', 'ランチ', '個室あり'],
  'アレルギーっ子ママパパのために生まれた、完全アレルギーフリーのレストランです。小麦・卵・乳・ナッツの4大アレルゲン完全除去メニューを提供。専用キッチンで調理し、コンタミネーションのリスクを最小限に。お子さま連れ大歓迎、個室もご用意しています。管理栄養士が監修した栄養バランス抜群のメニューで安心してお食事いただけます。',
  true,
  'https://instagram.com/himawari_allergy_free',
  'https://himawari-shop.example.com',
  '{
    "allergen_label": "◯",
    "contamination": "◯",
    "removal": "◯",
    "chart": "◯",
    "kids_chair": "◯",
    "stroller": "◯",
    "diaper": "◯",
    "baby_food": "◯",
    "wheelchair_accessible": "◯",
    "parking": "◯",
    "kids_friendly": "◯",
    "gluten_free": "◯",
    "egg_free": "◯",
    "dairy_free": "◯",
    "nut_free": "◯",
    "opening_hours": {
      "weekdayDescriptions": [
        "月曜日: 11:00〜21:00",
        "火曜日: 11:00〜21:00",
        "水曜日: 定休日",
        "木曜日: 11:00〜21:00",
        "金曜日: 11:00〜22:00",
        "土曜日: 10:00〜22:00",
        "日曜日: 10:00〜20:00"
      ]
    }
  }'::jsonb,
  '{
    "food": [
      {"url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800", "alt": "アレルギーフリーパスタ"},
      {"url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800", "alt": "カラフルサラダボウル"},
      {"url": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800", "alt": "グルテンフリーパンケーキ"}
    ],
    "interior": [
      {"url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800", "alt": "店内の様子"},
      {"url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800", "alt": "キッズスペース"}
    ],
    "exterior": [
      {"url": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800", "alt": "外観"}
    ]
  }'::jsonb,
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
  NOW() - INTERVAL '60 days',
  NOW()
);

-- ============================================
-- Step 3: メニュー情報を挿入
-- ============================================
INSERT INTO menus (restaurant_id, name, description, price, image_url, allergens_contained, allergens_removable, tags) VALUES
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '米粉のクリームパスタ', '自家製米粉麺と豆乳クリームソース。小麦・卵・乳不使用。', 1280, 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600', ARRAY[]::text[], ARRAY[]::text[], ARRAY['人気No.1', '4大アレルゲンフリー']),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'ひまわりキッズプレート', 'お子様向けワンプレート。ミニハンバーグ・ポテト・サラダ・ご飯セット。', 880, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600', ARRAY[]::text[], ARRAY[]::text[], ARRAY['キッズ', '4大アレルゲンフリー']),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'グルテンフリーハンバーガー', '米粉バンズと国産牛100%パティ。特製ソースも完全アレルゲンフリー。', 1480, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600', ARRAY[]::text[], ARRAY[]::text[], ARRAY['人気', 'ボリューム満点']),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '季節野菜のサラダボウル', '新鮮な有機野菜たっぷり。ドレッシングも手作りでアレルゲンフリー。', 980, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600', ARRAY[]::text[], ARRAY[]::text[], ARRAY['ヘルシー', 'ヴィーガン対応']),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'ふわふわ米粉パンケーキ', 'メープルシロップ添え。卵・乳・小麦不使用なのにふわふわ食感。', 780, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600', ARRAY[]::text[], ARRAY[]::text[], ARRAY['デザート', 'おやつタイム']),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '豆乳ショコラケーキ', '濃厚チョコレート風味。乳製品・小麦・卵不使用の特製ケーキ。', 580, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600', ARRAY[]::text[], ARRAY[]::text[], ARRAY['デザート', '誕生日OK']);

-- ============================================
-- Step 4: アレルゲン対応情報を挿入
-- ============================================
INSERT INTO restaurant_compatibility (restaurant_id, allergen, status, details) VALUES
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'wheat', 'safe', '全メニュー小麦不使用。専用キッチンで調理。'),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'egg', 'safe', '全メニュー卵不使用。代替食材を使用。'),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'milk', 'safe', '全メニュー乳製品不使用。豆乳・ココナッツミルクを使用。'),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'nut', 'safe', 'ナッツ類完全除去。同一施設内での取り扱いなし。'),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'shrimp', 'removable', '甲殻類は使用メニューあり。除去対応可能。'),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'crab', 'removable', '甲殻類は使用メニューあり。除去対応可能。'),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'buckwheat', 'safe', 'そば不使用。施設内での取り扱いなし。');

-- ============================================
-- Step 5: 口コミ（レビュー）を挿入
-- ユーザーIDは実際に存在するものに後で置き換え必要
-- 今回はNULLで挿入（user_idはNULL許容）
-- ============================================
INSERT INTO reviews (id, restaurant_id, user_id, rating, content, visit_date, allergens_safe, helpful_count, created_at) VALUES
-- レビュー1: 最高評価
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', NULL, 5,
'卵・乳アレルギーの4歳の息子を連れて行きました。初めてレストランで「全部食べられるよ！」と言えた感動は忘れられません。スタッフさんもアレルギー対応について詳しく説明してくれて、安心して食事できました。キッズチェアもあり、個室も使わせていただけて大満足です！また絶対行きます！',
'2026-01-15', ARRAY['wheat', 'egg', 'milk', 'nut'], 23, NOW() - INTERVAL '10 days'),

-- レビュー2: 高評価
('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', NULL, 5,
'グルテンフリーのお店を探していて見つけました。米粉パスタがモチモチで本当に美味しい！普通のパスタより好きかも。小麦アレルギーの私にとって、こういうお店は本当にありがたいです。価格も良心的で、週末はいつも混んでいます。予約必須です！',
'2026-01-10', ARRAY['wheat'], 18, NOW() - INTERVAL '15 days'),

-- レビュー3: 詳細レビュー
('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', NULL, 4,
'乳製品アレルギーの娘と行きました。◎良い点：・全メニューがアレルゲンフリー ・スタッフが詳しい知識を持っている ・キッズスペースあり △惜しい点：・週末は混雑するので予約推奨 ・駐車場が少ない 全体的には大満足です。次回は平日に行きたいと思います。',
'2026-01-05', ARRAY['milk', 'egg'], 12, NOW() - INTERVAL '20 days'),

-- レビュー4: メニュー投稿タイプ
('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', NULL, 5,
'ひまわりキッズプレートを注文しました！見た目もかわいくて、3歳の娘が大喜び。ハンバーグがジューシーで、大人が食べても美味しいレベル。量もちょうど良く、完食してくれました。お子様メニューがここまで充実しているお店は珍しいです。',
'2026-01-02', ARRAY['wheat', 'egg', 'milk'], 8, NOW() - INTERVAL '23 days'),

-- レビュー5: 新しいレビュー
('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', NULL, 5,
'昨日初めて行きました。ナッツアレルギーがあるのですが、「ナッツは施設内で一切取り扱っていない」と言われて感動しました。コンタミネーションの心配がないのは本当にありがたい。グルテンフリーハンバーガーを食べましたが、普通のハンバーガーと遜色ないクオリティでした。',
'2026-01-24', ARRAY['nut', 'wheat'], 5, NOW() - INTERVAL '1 day');

-- ============================================
-- Step 6: 口コミへのコメント（返信）を挿入
-- ============================================
-- オーナーからの返信
INSERT INTO review_comments (id, review_id, user_id, content, is_owner_response, created_at) VALUES
('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL,
'ご来店いただきありがとうございます！お子様に楽しんでいただけて、スタッフ一同とても嬉しく思います。アレルギー対応について、これからもご不明な点があればお気軽にお声がけください。またのご来店を心よりお待ちしております！ — 店長 山田',
true, NOW() - INTERVAL '9 days'),

-- 一般ユーザーからのコメント
('bbbb1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL,
'私も同じく卵乳アレルギーの子供がいます！この口コミを見て行ってみようと思います。情報ありがとうございます😊',
false, NOW() - INTERVAL '8 days'),

-- オーナーからの返信（別のレビュー）
('aaaa2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL,
'いつもご利用いただきありがとうございます！米粉パスタは当店の看板メニューです。週末は確かに混み合いますので、ネット予約がおすすめです。これからも美味しいアレルギーフリーメニューを提供していきます！',
true, NOW() - INTERVAL '14 days'),

-- ユーザー間の会話
('bbbb3333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NULL,
'駐車場の件、私は近くのコインパーキングを使っています。徒歩2分くらいのところに30分100円のがありますよ！',
false, NOW() - INTERVAL '18 days'),

-- 最新レビューへのコメント
('aaaa5555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', NULL,
'ご来店ありがとうございます！当店では開業時からナッツ類を一切使用しないポリシーを貫いています。安心してお食事を楽しんでいただけて何よりです。またぜひお越しください！',
true, NOW() - INTERVAL '12 hours');

-- ============================================
-- Step 7: 店舗オーナー情報を挿入（オプション）
-- ※ 実際のユーザーIDに置き換え必要
-- ============================================
-- INSERT INTO store_owners (restaurant_id, user_id, is_verified, role) VALUES
-- ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'actual-user-uuid', true, 'owner');

-- ============================================
-- 完了！
-- ============================================
SELECT 'ダミーデータ挿入完了: アレルギーフリーキッチン ひまわり' as result;
