-- =============================================================
-- フルデータサンプル店舗作成スクリプト
-- あんしんレシピ UI検証用
-- =============================================================
-- 実行手順: Supabase SQL Editorにコピペして実行

BEGIN;

-- =============================================================
-- 1. サンプル店舗（オーナー確認済み・フル機能テスト用）
-- =============================================================
INSERT INTO restaurants (
    id,
    name,
    address,
    lat,
    lng,
    phone,
    website_url,
    instagram_url,
    image_url,
    tags,
    features,
    is_verified,
    is_owner_verified,
    contamination_level,
    reliability_score,
    overview,
    classified_images,
    opening_hours,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '【サンプル】あんしんキッチン 渋谷店',
    '東京都渋谷区渋谷1-2-3 あんしんビル1F',
    35.6580,
    139.7016,
    '03-1234-5678',
    'https://anshin-kitchen.example.com',
    'https://instagram.com/anshin_kitchen',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    ARRAY['アレルギー対応', '卵不使用メニュー', '乳不使用メニュー', 'キッズ歓迎', '個室あり'],
    '{
        "parking": "◯",
        "wheelchair_accessible": "◯",
        "kids_friendly": "◯",
        "allergen_label": "アレルギー対応メニュー多数",
        "egg_free": "◯",
        "dairy_free": "◯",
        "gluten_free": "△",
        "nut_free": "◯",
        "multipurpose_toilet": "◯",
        "opening_hours": {
            "weekdayDescriptions": [
                "月曜日: 11:00 - 21:00",
                "火曜日: 11:00 - 21:00",
                "水曜日: 11:00 - 21:00",
                "木曜日: 11:00 - 21:00",
                "金曜日: 11:00 - 22:00",
                "土曜日: 10:00 - 22:00",
                "日曜日: 10:00 - 20:00"
            ]
        }
    }'::jsonb,
    true,
    true,
    'strict',
    95,
    'アレルギーをお持ちのお子様も安心してお食事いただけるレストランです。卵・乳製品・ナッツ不使用のメニューを多数ご用意。専用調理器具で調理し、コンタミ対策を徹底しています。キッズスペースも完備。',
    '{
        "food": [
            {"url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800", "alt": "サラダプレート"},
            {"url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800", "alt": "ピザ"},
            {"url": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800", "alt": "パンケーキ"}
        ],
        "interior": [
            {"url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800", "alt": "店内"}
        ],
        "exterior": [
            {"url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800", "alt": "外観"}
        ]
    }'::jsonb,
    '{}'::jsonb,
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    features = EXCLUDED.features,
    overview = EXCLUDED.overview,
    classified_images = EXCLUDED.classified_images,
    is_owner_verified = EXCLUDED.is_owner_verified;

-- =============================================================
-- 2. メニューデータ（店舗オーナー登録メニュー）
-- =============================================================

-- メニュー1: 卵・乳不使用プレート
INSERT INTO menus (
    id,
    restaurant_id,
    name,
    description,
    price,
    image_url,
    allergens,
    tags,
    created_at
) VALUES (
    '22222222-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '7大アレルゲンフリープレート',
    '卵・乳・小麦・そば・落花生・えび・かにを使用していません。お子様にも安心。グルテンフリー米粉パン付き。',
    1480,
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    '{}',
    ARRAY['low_allergen', 'gluten_free', 'egg_free', 'dairy_free', 'kids'],
    NOW()
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- メニュー2: 卵不使用オムライス風
INSERT INTO menus (
    id,
    restaurant_id,
    name,
    description,
    price,
    image_url,
    allergens,
    tags,
    created_at
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '卵不使用オムライス風（豆腐クリーム）',
    '卵を一切使用せず、豆腐ベースのふわふわクリームで仕上げたオムライス風プレート。',
    1280,
    'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800',
    '{}',
    ARRAY['egg_free', 'kids'],
    NOW()
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- メニュー3: 米粉パンケーキ
INSERT INTO menus (
    id,
    restaurant_id,
    name,
    description,
    price,
    image_url,
    allergens,
    tags,
    created_at
) VALUES (
    '22222222-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    '米粉パンケーキ（卵・乳・小麦不使用）',
    'もちもち食感の米粉パンケーキ。メープルシロップとフルーツ添え。',
    980,
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    '{}',
    ARRAY['gluten_free', 'egg_free', 'dairy_free', 'kids'],
    NOW()
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- メニュー4: キッズカレー
INSERT INTO menus (
    id,
    restaurant_id,
    name,
    description,
    price,
    image_url,
    allergens,
    tags,
    created_at
) VALUES (
    '22222222-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'あんしんキッズカレー',
    '甘口で食べやすい、7大アレルゲン不使用のお子様カレー。ミニサラダ・ジュース付き。',
    780,
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
    '{}',
    ARRAY['low_allergen', 'kids'],
    NOW()
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- =============================================================
-- 3. ユーザーレビュー（口コミ）
-- 注意: reviews テーブルのカラム名に合わせて修正
--   - content (NOT comment)
--   - images (JSONB[], NOT image_url)
--   - allergens_safe (NOT allergy_status)
-- =============================================================

-- レビュー1: 高評価
INSERT INTO reviews (
    id,
    restaurant_id,
    user_id,
    rating,
    content,
    allergens_safe,
    review_type,
    visit_type,
    created_at
) VALUES (
    '33333333-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    NULL,
    5,
    '息子が卵アレルギーですが、こちらのお店では安心して食事ができました！スタッフの方がアレルギーについてとても詳しく、調理器具も分けて使用してくれています。キッズスペースもあり、子連れにはありがたいです。',
    ARRAY['egg', 'milk'],
    'shop_review',
    'eat_in',
    NOW() - INTERVAL '3 days'
)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;

-- レビュー2: メニュー投稿
INSERT INTO reviews (
    id,
    restaurant_id,
    user_id,
    rating,
    content,
    allergens_safe,
    review_type,
    menu_id,
    price_paid,
    visit_type,
    created_at
) VALUES (
    '33333333-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    NULL,
    4,
    '米粉パンケーキを注文しました。もちもちでとても美味しかったです。卵・乳アレルギーの娘も大喜びでした。',
    ARRAY['egg', 'milk', 'wheat'],
    'menu_post',
    '22222222-3333-3333-3333-333333333333',
    980,
    'eat_in',
    NOW() - INTERVAL '1 week'
)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;

-- レビュー3: 別のユーザーからの口コミ
INSERT INTO reviews (
    id,
    restaurant_id,
    user_id,
    rating,
    content,
    allergens_safe,
    review_type,
    visit_type,
    created_at
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    NULL,
    5,
    '初めて行きましたが、アレルギー対応がしっかりしていて感動しました。メニューにアレルゲン表示がわかりやすく、スタッフさんに確認すると原材料表も見せてくれます。',
    ARRAY['egg'],
    'shop_review',
    'eat_in',
    NOW() - INTERVAL '2 weeks'
)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;

COMMIT;

-- =============================================================
-- 確認クエリ
-- =============================================================
-- SELECT * FROM restaurants WHERE id = '11111111-1111-1111-1111-111111111111';
-- SELECT * FROM menus WHERE restaurant_id = '11111111-1111-1111-1111-111111111111';
-- SELECT * FROM reviews WHERE restaurant_id = '11111111-1111-1111-1111-111111111111';
