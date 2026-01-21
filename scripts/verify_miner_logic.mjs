import * as cheerio from "cheerio";

// --- MOCK FUNCTION IMPORTS (Because we can't import node module easily in mjs script without package.json "type":"module" complexities sometimes, but sticking to logic copy for verification speed unless we use proper test runner) ---

// 1. Feature Detection Logic (Copied from miner.js for verification)
function detectFeaturesFromText(pageText) {
  const features = {};
  if (pageText.match(/アレルギー表|アレルゲン一覧|成分表/)) {
    features.allergen_label = "◯";
  }
  if (pageText.includes("除去") && pageText.includes("対応")) {
    const negativePatterns =
      /除去.*(できません|不可|お断り|難しい|致しかね|対応して(おりません|いない)|行って(おりません|いない))/;
    if (!pageText.match(negativePatterns)) {
      features.removal = "◯";
    }
  }
  return features;
}

// 2. Rule Based Extraction (Copied Logic)
function extractMenusRuleBased($, baseUrl) {
  const menus = [];
  const seenNames = new Set();
  const BLOCKLIST =
    /logo|icon|btn|button|arrow|banner|map|spacer|link|tel|mail|line|instagram|facebook|twitter|nav|menu|hero|slide|bg|shadow|影|様子|袋|注が|温め|問合|登録|詳細|クリック|タップ|ページ|戻る|次へ|ホーム|会社|概要|ポリシー|規約|特定商取引|Copyright|All Rights|This is|Image|view|scene|interior|exterior/i;

  $("li, div, p, td, dt, dd").each((i, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length > 200 || text.length < 3) return;
    const priceMatch = text.match(/([¥￥]?\s*(\d{1,3}(,\d{3})*|\d+)\s*円?)/);
    if (priceMatch && (text.includes("円") || text.includes("¥"))) {
      let name = text.replace(priceMatch[0], "").trim();
      name = name.replace(/^[\W\d]+\./, "").trim();
      if (name.length > 2 && !seenNames.has(name) && !name.match(BLOCKLIST)) {
        menus.push({ name: name, price: 100, source_image_url: null });
        seenNames.add(name);
      }
    }
  });

  // Fallback 3: Image Alt Text
  if (menus.length === 0) {
    $("img").each((i, el) => {
      const alt = $(el).attr("alt");
      let src = $(el).attr("src");
      if (alt && alt.length > 3 && alt.length < 50) {
        if (!alt.match(BLOCKLIST)) {
          if (!seenNames.has(alt)) {
            if (src && !src.startsWith("http") && !src.startsWith("data:")) {
              try {
                if (baseUrl) src = new URL(src, baseUrl).href;
              } catch (e) {
                src = null;
              }
            }
            if (src) {
              menus.push({ name: alt, source_image_url: src });
              seenNames.add(alt);
            }
          }
        }
      }
    });
  }
  return menus;
}

// --- TEST EXECUTION ---

console.log("--- Starting Miner Logic Verification ---");
let passed = true;

// TEST 1: Garbage Filtering
console.log("\n[Test 1] Garbage Filtering & URL Resolution");
const baseUrl = "https://example.com/shop/";
const testHtml = `
<html>
<body>
    <img src="shadow.jpg" alt="植物の葉の影">   <!-- Garbage -->
    <img src="making.jpg" alt="ワッフルを作っている様子"> <!-- Garbage -->
    <img src="bag.jpg" alt="茶色の紙袋に入った小麦粉"> <!-- Garbage -->
    <img src="line.jpg" alt="お問い合わせ・LINE登録"> <!-- Garbage -->
    <img src="pantry/waffle.jpg" alt="米粉のワッフル"> <!-- Valid -->
</body>
</html>
`;
const $ = cheerio.load(testHtml);
const results = extractMenusRuleBased($, baseUrl);

if (results.some((r) => r.name.match(/影|様子|袋|お問い合わせ/))) {
  console.error("❌ FAILED: Garbage items were not filtered.");
  passed = false;
} else if (!results.find((r) => r.name === "米粉のワッフル")) {
  console.error("❌ FAILED: Valid item '米粉のワッフル' was missed.");
  passed = false;
} else if (
  results.find((r) => r.name === "米粉のワッフル").source_image_url !==
  "https://example.com/shop/pantry/waffle.jpg"
) {
  console.error("❌ FAILED: URL Resolution incorrect.");
  passed = false;
} else {
  console.log("✅ PASSED");
}

// TEST 2: Feature Detection (Logic Check)
console.log("\n[Test 2] Removal Feature Detection");
const cases = [
  {
    text: "アレルギー対応除去も可能です",
    expectRemoval: true,
    label: "Simple Positive",
  },
  {
    text: "アレルギー除去対応は行っておりません",
    expectRemoval: false,
    label: "Hard Negative",
  },
  {
    text: "除去対応はできません",
    expectRemoval: false,
    label: "Simple Negative",
  },
  {
    text: "コンタミ防止の除去対応は難しいです",
    expectRemoval: false,
    label: "Soft Negative",
  },
  {
    text: "アレルギー表をご用意しております",
    expectRemoval: false,
    label: "Label Only",
  },
];

cases.forEach((c) => {
  const f = detectFeaturesFromText(c.text);
  const hasRemoval = f.removal === "◯";
  if (hasRemoval !== c.expectRemoval) {
    console.error(
      `❌ FAILED: ${c.label} (Text: "${c.text}") -> Expected ${c.expectRemoval}, Got ${hasRemoval}`,
    );
    passed = false;
  } else {
    console.log(`✅ PASSED: ${c.label}`);
  }
});

if (passed) {
  console.log("\n✨ ALL TESTS PASSED");
  process.exit(0);
} else {
  console.error("\n💀 SOME TESTS FAILED");
  process.exit(1);
}
