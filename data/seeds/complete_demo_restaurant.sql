-- ============================================
-- 完全版ダミー店舗データ（全フィールド網羅）
-- 手抜き禁止ルール適用版
-- ============================================

-- 既存データ完全削除
DELETE FROM review_comments WHERE review_id IN (SELECT id FROM reviews WHERE restaurant_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
DELETE FROM review_likes WHERE review_id IN (SELECT id FROM reviews WHERE restaurant_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
DELETE FROM reviews WHERE restaurant_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
DELETE FROM menus WHERE restaurant_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
DELETE FROM restaurant_compatibility WHERE restaurant_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
DELETE FROM restaurants WHERE id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

-- ============================================
-- 店舗情報（全フィールド）
-- ============================================
INSERT INTO restaurants (
  id, name, address, lat, lng, phone,
  website_url, instagram_url, takeout_url,
  tags, overview,
  features, classified_images, image_url,
  is_owner_verified, is_verified, reliability_score,
  contamination_level, sources, sns_urls,
  created_at, updated_at
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'アレルギーフリーキッチン ひまわり',
  '東京都渋谷区神南1-23-10 ひまわりビル1F',
  35.6614, 139.7009,
  '03-1234-5678',
  'https://himawari-allergy-free.example.com',
  'https://instagram.com/himawari_allergy_free',
  'https://himawari-shop.example.com/takeout',
  ARRAY['アレルギー対応', 'グルテンフリー', 'キッズ歓迎', 'カフェ', 'ランチ', '個室あり', 'ベビーカーOK', '駐車場あり'],
  'アレルギーっ子ママパパのために2020年にオープンした、完全アレルギーフリーのレストランです。小麦・卵・乳・ナッツの4大アレルゲンを使用しない専用キッチンで調理。コンタミネーション（混入）対策を徹底し、管理栄養士が監修した栄養バランス抜群のメニューをご提供。お子さま連れ大歓迎で、キッズスペースと個室もご用意しています。テイクアウトやUber Eatsでのデリバリーも対応中！',
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
    "multipurpose_toilet": "◯",
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
      {"url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800", "alt": "特製グルテンフリーピザ"},
      {"url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800", "alt": "カラフル野菜サラダボウル"},
      {"url": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800", "alt": "ふわふわ米粉パンケーキ"},
      {"url": "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800", "alt": "米粉クリームパスタ"},
      {"url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800", "alt": "グルテンフリーハンバーガー"}
    ],
    "interior": [
      {"url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800", "alt": "明るい店内"},
      {"url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800", "alt": "キッズスペース"},
      {"url": "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800", "alt": "個室席"}
    ],
    "exterior": [
      {"url": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800", "alt": "店舗外観"},
      {"url": "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800", "alt": "入口看板"}
    ]
  }'::jsonb,
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
  true, true, 95,
  'strict',
  '[{"type": "official_site", "url": "https://himawari-allergy-free.example.com", "verified": true}]'::jsonb,
  '[{"platform": "twitter", "url": "https://twitter.com/himawari_af"}, {"platform": "facebook", "url": "https://facebook.com/himawari.allergyfree"}]'::jsonb,
  NOW() - INTERVAL '180 days',
  NOW()
);

-- ============================================
-- メニュー（6品、全フィールド）
-- ============================================
INSERT INTO menus (restaurant_id, name, description, price, image_url, allergens_contained, allergens_removable, tags) VALUES
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
 '【人気No.1】米粉のクリームパスタ',
 '自家製の米粉麺はもちもち食感！濃厚な豆乳クリームソースと季節の野菜をたっぷり使用。小麦・卵・乳製品を一切使用していません。お子様からお年寄りまで大人気の看板メニューです。',
 1280,
 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600',
 ARRAY[]::text[], ARRAY[]::text[],
 ARRAY['人気No.1', '4大アレルゲンフリー', 'ランチおすすめ', 'ディナーおすすめ']),

('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
 'ひまわりキッズプレート',
 'お子様に大人気！ミニハンバーグ、ポテトフライ、季節の野菜サラダ、ふりかけご飯のワンプレート。7大アレルゲン不使用で安心。ミニデザート付き。3歳〜小学生向け。',
 880,
 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600',
 ARRAY[]::text[], ARRAY[]::text[],
 ARRAY['キッズメニュー', '4大アレルゲンフリー', 'おすすめ']),

('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
 'グルテンフリーハンバーガー',
 '国産牛100%のジューシーパティを特製米粉バンズでサンド。自家製トマトソースとオニオン、レタスをたっぷり。ポテト付き。ボリューム満点で男性にも大人気！',
 1480,
 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
 ARRAY[]::text[], ARRAY[]::text[],
 ARRAY['ボリューム満点', 'ランチ人気', 'テイクアウト可']),

('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
 '季節の野菜たっぷりサラダボウル',
 '契約農家から届く新鮮な有機野菜を15種類以上使用。自家製の米油ドレッシングは完全アレルゲンフリー。ヴィーガンの方にもおすすめ。ハーフサイズ(680円)もあります。',
 980,
 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
 ARRAY[]::text[], ARRAY[]::text[],
 ARRAY['ヘルシー', 'ヴィーガン対応', 'ハーフサイズあり', 'サイドメニュー']),

('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
 'ふわふわ米粉パンケーキ',
 '卵・乳・小麦不使用なのに驚くほどふわふわ！秘密は独自配合の米粉と豆乳ホイップ。メープルシロップと季節のフルーツを添えて。お子様のおやつにも、大人のデザートにも。',
 780,
 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600',
 ARRAY[]::text[], ARRAY[]::text[],
 ARRAY['デザート', 'おやつ', 'キッズ人気', 'インスタ映え']),

('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
 '濃厚豆乳ショコラケーキ',
 'カカオ70%の本格チョコレートを使用した濃厚ケーキ。乳製品・小麦・卵を使わずにこの濃厚さを実現。お誕生日ホールケーキ(要予約・2500円)もあります。',
 580,
 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
 ARRAY[]::text[], ARRAY[]::text[],
 ARRAY['デザート', '誕生日ケーキ可', 'テイクアウト可', 'ギフト対応']);

-- ============================================
-- アレルゲン対応情報（7大アレルゲン全て）
-- ============================================
INSERT INTO restaurant_compatibility (restaurant_id, allergen, status, details) VALUES
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'wheat', 'safe', '全メニュー小麦不使用。専用工場で製造した米粉製品を使用。製造ラインでの混入リスクなし。'),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'egg', 'safe', '全メニュー卵不使用。代替材料として豆腐やアクアファバを使用。調理器具は卵専用と完全分離。'),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'milk', 'safe', '全メニュー乳製品不使用。豆乳、ココナッツミルク、オーツミルクを代替使用。バターの代わりに米油を使用。'),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'nut', 'safe', 'ナッツ類完全除去。施設内での取り扱いなし。ナッツアレルギーの方も安心してご来店いただけます。'),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'buckwheat', 'safe', 'そば不使用。施設内での取り扱いなし。麺類は全て米粉麺を使用しています。'),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'shrimp', 'removable', '一部メニューでエビを使用。ご注文時にお申し付けいただければ除去対応いたします。'),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'crab', 'removable', '一部メニューでカニを使用。ご注文時にお申し付けいただければ除去対応いたします。');

-- ============================================
-- 口コミ（7件、詳細かつ多様な評価）
-- ============================================
INSERT INTO reviews (id, restaurant_id, user_id, rating, content, allergens_safe, helpful_count, is_own_menu, review_type, visit_date, created_at) VALUES

-- レビュー1: 感動の5つ星
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', NULL, 5,
'卵・乳アレルギーの4歳の息子を連れて行きました。いつもは「これ食べられる？」と不安そうな息子が、ここでは「全部食べられるの！？」と目を輝かせていました。人生で初めて家族みんなで同じメニューを食べられた感動は、一生忘れられません。

スタッフさんは全員アレルギー対応について詳しく、質問にも丁寧に答えてくれました。個室を使わせていただいたので、周りを気にせずゆっくり食事ができました。

息子は米粉パスタを「おいしい！おかわり！」と大絶賛。私たちも普通に美味しくて、アレルギー対応のお店とは思えないクオリティでした。

絶対また来ます！同じようなお子さんを持つママさんにぜひおすすめしたいです。',
ARRAY['wheat', 'egg', 'milk', 'nut'], 47, false, 'shop_review', '2026-01-15', NOW() - INTERVAL '10 days'),

-- レビュー2: グルテンフリー愛好者
('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', NULL, 5,
'セリアック病でグルテンフリー生活を送っています。外食はいつも不安でしたが、ここは本当に安心！

特に米粉パスタが絶品です。普通のパスタより好きかも。モチモチ食感がたまりません。グルテンフリーハンバーガーも、バンズがちゃんと美味しい。よくあるパサパサのグルテンフリーパンとは全然違います。

店員さんに「調理器具は完全に分けていますか？」と聞いたら、「はい、グルテンを含む食材は施設内に一切ありません」との回答。プロ意識を感じました。

週末は混むので予約必須です！平日ランチがおすすめ。',
ARRAY['wheat'], 38, false, 'shop_review', '2026-01-10', NOW() - INTERVAL '15 days'),

-- レビュー3: 詳細レビュー（4つ星）
('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', NULL, 4,
'乳製品アレルギーの小学生の娘と一緒に訪問しました。

【良い点】
・全メニューがアレルゲンフリーなので安心感が違う
・スタッフが知識豊富で、質問に即答してくれる
・キッズスペースがあり、子供が飽きない
・個室もあるので落ち着いて食事できる
・トイレにおむつ交換台あり

【惜しい点】
・週末は混雑するため、1時間待ちもある（予約推奨）
・駐車場が4台分しかない（近くにコインパーキングあり）
・価格は一般的なカフェより少し高め（品質を考えれば納得）

総合的には大満足です！次回は平日に行こうと思います。娘もまた行きたいと言っています。',
ARRAY['milk', 'egg'], 29, false, 'shop_review', '2026-01-05', NOW() - INTERVAL '20 days'),

-- レビュー4: キッズメニュー絶賛
('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', NULL, 5,
'3歳の娘と初訪問！キッズプレートを注文しました。

見た目がとっても可愛くて、娘が「わぁ〜！」と歓声を上げました。ひまわりの形のにんじんや、星型のポテトなど、細かいところまで工夫されています。

ハンバーグがジューシーで、大人が食べても美味しいレベル。むしろ私も食べたかった（笑）量もちょうど良く、完食してくれました。

デザートの米粉クッキーも「おいしい〜もっと食べたい〜」とおねだりされました。テイクアウトで買って帰りました。

お子様メニューがここまで充実しているアレルギー対応店は初めてです。本当にありがとうございます！',
ARRAY['wheat', 'egg', 'milk'], 22, false, 'shop_review', '2026-01-02', NOW() - INTERVAL '23 days'),

-- レビュー5: ナッツアレルギー
('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', NULL, 5,
'重度ナッツアレルギー持ちです。外食は本当に怖くて、ほとんど外で食べられませんでした。

このお店は「ナッツ類は施設内で一切取り扱っていない」と明言してくれて、初めて安心して外食できました。涙が出そうでした。

グルテンフリーハンバーガーを食べましたが、とても美味しかったです。普通のハンバーガーと遜色ないどころか、米粉バンズの方が好みかも。

アレルギー対応のお店って「安心」が売りで味は二の次...というイメージがありましたが、ここは両立しています。素晴らしいお店です。',
ARRAY['nut', 'wheat'], 31, false, 'shop_review', '2026-01-20', NOW() - INTERVAL '5 days'),

-- レビュー6: リピーター
('66666666-6666-6666-6666-666666666666', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', NULL, 5,
'もう10回以上通っています。我が家のホームレストランです。

毎回違うメニューを試していますが、どれも美味しい。最近のお気に入りは季節限定の「かぼちゃの豆乳ポタージュ」。濃厚でほっこりします。

スタッフさんも顔を覚えてくれて、「息子くん、大きくなったね！」と声をかけてくれます。アットホームな雰囲気も大好きです。

誕生日には特製のアレルギーフリーケーキを予約しました。ケーキ屋さんで買うより美味しかったです。

これからも通い続けます！',
ARRAY['wheat', 'egg', 'milk', 'nut'], 18, false, 'shop_review', '2026-01-22', NOW() - INTERVAL '3 days'),

-- レビュー7: 最新レビュー
('77777777-7777-7777-7777-777777777777', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', NULL, 4,
'昨日初めて行きました。事前にInstagramでチェックしていて、期待大で訪問。

期待通りの素敵なお店でした！店内は明るくて清潔感があり、子連れでも入りやすい雰囲気。

米粉パンケーキを注文。ふわふわで美味しかったです。ただ、少し甘さ控えめだったので、もう少し甘くても良いかな？（好みの問題です）

唯一の難点は、人気店なので土日は予約しないと入れないこと。次は平日に行きます！',
ARRAY['wheat', 'egg', 'milk'], 8, false, 'shop_review', '2026-01-24', NOW() - INTERVAL '1 day');

-- ============================================
-- コメント（10件、オーナー返信含む）
-- ============================================
INSERT INTO review_comments (review_id, user_id, content, is_owner_response, created_at) VALUES

-- レビュー1へのコメント
('11111111-1111-1111-1111-111111111111', NULL,
'ご来店いただきありがとうございます！お子様に「全部食べられる！」と喜んでいただけて、スタッフ一同本当に嬉しく思っております。

当店はアレルギーをお持ちのお子様とご家族が、安心して楽しく食事できる場所を目指してオープンしました。その想いが伝わったようで何よりです。

またぜひご家族でお越しください。スタッフ一同、心よりお待ちしております！

店長 山田',
true, NOW() - INTERVAL '9 days'),

('11111111-1111-1111-1111-111111111111', NULL,
'私も同じく卵乳アレルギーの子供がいます！この口コミを見て行ってみようと思いました。素敵な情報をありがとうございます😊',
false, NOW() - INTERVAL '8 days'),

('11111111-1111-1111-1111-111111111111', NULL,
'↑ぜひ行ってみてください！期待を裏切らないお店ですよ✨ うちも月1で通ってます',
false, NOW() - INTERVAL '7 days'),

-- レビュー2へのコメント
('22222222-2222-2222-2222-222222222222', NULL,
'いつもご利用いただきありがとうございます！米粉パスタは当店のシェフが試行錯誤を重ねて開発したメニューです。お褒めいただき光栄です。

ご指摘の通り、当店では小麦を含む食材は一切使用しておりません。セリアック病の方にも安心してお召し上がりいただけます。

今後とも何卒よろしくお願いいたします。

店長 山田',
true, NOW() - INTERVAL '14 days'),

-- レビュー3へのコメント
('33333333-3333-3333-3333-333333333333', NULL,
'駐車場の件、私はいつも近くのタイムズを使っています！徒歩2分のところに30分100円のがありますよ。お店で1000円以上利用すると駐車券もらえます👍',
false, NOW() - INTERVAL '18 days'),

('33333333-3333-3333-3333-333333333333', NULL,
'貴重なご意見ありがとうございます！週末の混雑につきましては、ネット予約システムを導入いたしました。ぜひご活用ください。

駐車場については近隣にコインパーキングがございます。また、1000円以上ご利用のお客様には30分無料のサービス券をお渡ししております。

次回のご来店を心よりお待ちしております！

店長 山田',
true, NOW() - INTERVAL '19 days'),

-- レビュー5へのコメント
('55555555-5555-5555-5555-555555555555', NULL,
'ご来店ありがとうございます！重度のナッツアレルギーをお持ちとのこと、外食に対する恐怖や不安、よく理解できます。

当店では開業時から「ナッツ類は一切施設内に持ち込まない」というポリシーを貫いております。今後もこのポリシーを守り続けます。

安心してお食事を楽しんでいただけて、本当に嬉しい限りです。またぜひお越しくださいませ。

店長 山田',
true, NOW() - INTERVAL '4 days'),

-- レビュー6へのコメント
('66666666-6666-6666-6666-666666666666', NULL,
'10回以上もご来店いただいているとのこと、本当にありがとうございます！「ホームレストラン」と言っていただけて、スタッフ一同感激しております。

息子さんの成長を見守れることも、私たちの喜びです。これからもご家族の「安心できる居場所」であり続けられるよう、精進してまいります。

季節限定メニューもぜひ楽しみにしていてくださいね！

店長 山田',
true, NOW() - INTERVAL '2 days'),

-- レビュー7へのコメント
('77777777-7777-7777-7777-777777777777', NULL,
'ご来店ありがとうございます！米粉パンケーキの甘さについてのご意見、参考になります。

実は甘さ控えめにしているのは、お子様でも食べやすいようにという理由なのですが、大人の方には物足りないかもしれませんね。メープルシロップの追加（無料）も可能ですので、次回ぜひお申し付けください！

またのご来店をお待ちしております。

店長 山田',
true, NOW() - INTERVAL '12 hours'),

('77777777-7777-7777-7777-777777777777', NULL,
'私もパンケーキ好きです！シロップ追加できるの知らなかった、今度頼んでみます😋',
false, NOW() - INTERVAL '6 hours');

-- ============================================
-- 完了確認
-- ============================================
SELECT
  '完全版ダミーデータ作成完了' as status,
  (SELECT COUNT(*) FROM restaurants WHERE id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee') as restaurants,
  (SELECT COUNT(*) FROM menus WHERE restaurant_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee') as menus,
  (SELECT COUNT(*) FROM restaurant_compatibility WHERE restaurant_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee') as allergens,
  (SELECT COUNT(*) FROM reviews WHERE restaurant_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee') as reviews,
  (SELECT COUNT(*) FROM review_comments WHERE review_id IN (SELECT id FROM reviews WHERE restaurant_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')) as comments;
