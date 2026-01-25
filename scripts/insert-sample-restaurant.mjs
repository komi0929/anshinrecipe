// サンプル店舗データ投入スクリプト
// 実行: node scripts/insert-sample-restaurant.mjs
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing SUPABASE env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SAMPLE_RESTAURANT_ID = "11111111-1111-1111-1111-111111111111";

async function insertSampleData() {
  console.log("🚀 サンプルデータ投入開始...\n");

  // 1. 既存データ削除（あれば）
  console.log("🧹 既存サンプルデータ削除中...");
  await supabase
    .from("reviews")
    .delete()
    .eq("restaurant_id", SAMPLE_RESTAURANT_ID);
  await supabase
    .from("menus")
    .delete()
    .eq("restaurant_id", SAMPLE_RESTAURANT_ID);
  await supabase.from("restaurants").delete().eq("id", SAMPLE_RESTAURANT_ID);

  // 2. レストラン投入
  console.log("🏪 レストラン投入中...");
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .insert({
      id: SAMPLE_RESTAURANT_ID,
      name: "【サンプル】あんしんキッチン 渋谷店",
      address: "東京都渋谷区渋谷1-2-3 あんしんビル1F",
      lat: 35.658,
      lng: 139.7016,
      phone: "03-1234-5678",
      website_url: "https://anshin-kitchen.example.com",
      instagram_url: "https://instagram.com/anshin_kitchen",
      image_url:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
      tags: [
        "アレルギー対応",
        "卵不使用メニュー",
        "乳不使用メニュー",
        "キッズ歓迎",
        "個室あり",
      ],
      features: {
        // 基本設備
        parking: "◯",
        wheelchair_accessible: "◯",
        kids_friendly: "◯",
        multipurpose_toilet: "◯",

        // アレルギー対応（FeatureList用）
        allergen_label: "メニューに全て表記",
        contamination: "専用調理器具使用",
        removal: "個別対応可能",
        chart: "原材料表あり",

        // 4大アレルゲン（FeatureCard用）
        egg_free: "◯",
        dairy_free: "◯",
        gluten_free: "△",
        nut_free: "◯",

        // キッズ対応（FeatureList用）
        kids_chair: "◯",
        stroller_ok: "◯",
        diaper_changing: "◯",
        baby_food: "持ち込みOK",

        // 営業時間
        opening_hours: {
          weekdayDescriptions: [
            "月曜日: 11:00 - 21:00",
            "火曜日: 11:00 - 21:00",
            "水曜日: 11:00 - 21:00",
            "木曜日: 11:00 - 21:00",
            "金曜日: 11:00 - 22:00",
            "土曜日: 10:00 - 22:00",
            "日曜日: 10:00 - 20:00",
          ],
        },
      },
      is_verified: true,
      is_owner_verified: true,
      contamination_level: "strict",
      reliability_score: 95,
      overview:
        "アレルギーをお持ちのお子様も安心してお食事いただけるレストランです。卵・乳製品・ナッツ不使用のメニューを多数ご用意。専用調理器具で調理し、コンタミ対策を徹底しています。キッズスペースも完備。",
      classified_images: {
        food: [
          {
            url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
            alt: "サラダプレート",
          },
          {
            url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
            alt: "ピザ",
          },
          {
            url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800",
            alt: "パンケーキ",
          },
        ],
        interior: [
          {
            url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
            alt: "店内",
          },
        ],
        exterior: [
          {
            url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
            alt: "外観",
          },
        ],
      },
    })
    .select()
    .single();

  if (restaurantError) {
    console.error("❌ レストラン投入エラー:", restaurantError.message);
    return;
  }
  console.log("✅ レストラン投入完了:", restaurant.name);

  // 3. メニュー投入
  console.log("🍽️ メニュー投入中...");
  const menus = [
    {
      id: "22222222-1111-1111-1111-111111111111",
      restaurant_id: SAMPLE_RESTAURANT_ID,
      name: "7大アレルゲンフリープレート",
      description:
        "卵・乳・小麦・そば・落花生・えび・かにを使用していません。お子様にも安心。グルテンフリー米粉パン付き。",
      price: 1480,
      image_url:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
      allergens: [],
      tags: ["low_allergen", "gluten_free", "egg_free", "dairy_free", "kids"],
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      restaurant_id: SAMPLE_RESTAURANT_ID,
      name: "卵不使用オムライス風（豆腐クリーム）",
      description:
        "卵を一切使用せず、豆腐ベースのふわふわクリームで仕上げたオムライス風プレート。",
      price: 1280,
      image_url:
        "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800",
      allergens: [],
      tags: ["egg_free", "kids"],
    },
    {
      id: "22222222-3333-3333-3333-333333333333",
      restaurant_id: SAMPLE_RESTAURANT_ID,
      name: "米粉パンケーキ（卵・乳・小麦不使用）",
      description:
        "もちもち食感の米粉パンケーキ。メープルシロップとフルーツ添え。",
      price: 980,
      image_url:
        "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800",
      allergens: [],
      tags: ["gluten_free", "egg_free", "dairy_free", "kids"],
    },
    {
      id: "22222222-4444-4444-4444-444444444444",
      restaurant_id: SAMPLE_RESTAURANT_ID,
      name: "あんしんキッズカレー",
      description:
        "甘口で食べやすい、7大アレルゲン不使用のお子様カレー。ミニサラダ・ジュース付き。",
      price: 780,
      image_url:
        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
      allergens: [],
      tags: ["low_allergen", "kids"],
    },
  ];

  const { error: menusError } = await supabase.from("menus").insert(menus);
  if (menusError) {
    console.error("❌ メニュー投入エラー:", menusError.message);
  } else {
    console.log("✅ メニュー投入完了: 4品");
  }

  // 4. レビュー投入（トリガー対策: is_own_menu を含める）
  console.log("⭐ レビュー投入中...");
  const reviews = [
    {
      id: "33333333-1111-1111-1111-111111111111",
      restaurant_id: SAMPLE_RESTAURANT_ID,
      user_id: null,
      rating: 5,
      content:
        "息子が卵アレルギーですが、こちらのお店では安心して食事ができました！スタッフの方がアレルギーについてとても詳しく、調理器具も分けて使用してくれています。キッズスペースもあり、子連れにはありがたいです。",
      allergens_safe: ["egg", "milk"],
      review_type: "shop_review",
      visit_type: "eat_in",
      is_own_menu: false,
    },
    {
      id: "33333333-2222-2222-2222-222222222222",
      restaurant_id: SAMPLE_RESTAURANT_ID,
      user_id: null,
      rating: 4,
      content:
        "米粉パンケーキを注文しました。もちもちでとても美味しかったです。卵・乳アレルギーの娘も大喜びでした。",
      allergens_safe: ["egg", "milk", "wheat"],
      review_type: "menu_post",
      menu_id: "22222222-3333-3333-3333-333333333333",
      price_paid: 980,
      visit_type: "eat_in",
      is_own_menu: false,
    },
    {
      id: "33333333-3333-3333-3333-333333333333",
      restaurant_id: SAMPLE_RESTAURANT_ID,
      user_id: null,
      rating: 5,
      content:
        "初めて行きましたが、アレルギー対応がしっかりしていて感動しました。メニューにアレルゲン表示がわかりやすく、スタッフさんに確認すると原材料表も見せてくれます。",
      allergens_safe: ["egg"],
      review_type: "shop_review",
      visit_type: "eat_in",
      is_own_menu: false,
    },
  ];

  const { error: reviewsError } = await supabase
    .from("reviews")
    .insert(reviews);
  if (reviewsError) {
    console.error("❌ レビュー投入エラー:", reviewsError.message);
  } else {
    console.log("✅ レビュー投入完了: 3件");
  }

  console.log("\n🎉 サンプルデータ投入完了！");
  console.log(
    `\n📍 確認URL: https://anshinrecipe.com/map/${SAMPLE_RESTAURANT_ID}`,
  );
}

insertSampleData().catch(console.error);
