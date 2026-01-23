// Centralized Blocklist for Garbage Filtering
// Used by: miner.js, verify_miner_logic.mjs

export const GARBAGE_BLOCKLIST = [
  // Visual noise
  "shadow",
  "影",
  "様子",
  "view",
  "scene",
  "interior",
  "exterior",

  // Non-food objects
  "bag",
  "袋",
  "package",
  "box",
  "箱",
  "plate",
  "dish",
  "皿",
  "table",
  "席",

  // UI elements / text
  "logo",
  "icon",
  "btn",
  "button",
  "arrow",
  "banner",
  "map",
  "spacer",
  "link",
  "tel",
  "mail",
  "line",
  "nav",
  "menu",
  "hero",
  "slide",
  "bg",
  "注が",
  "温め",
  "問合",
  "登録",
  "詳細",
  "クリック",
  "タップ",
  "ページ",
  "戻る",
  "次へ",
  "ホーム",
  "会社",
  "概要",
  "ポリシー",
  "規約",
  "特定商取引",
  "copyright",
  "all rights",
  "this is",
  "image",
  "行っておりません",
  "致しかねます", // Negative phrases often caught as text
];

export const GARBAGE_REGEX = new RegExp(GARBAGE_BLOCKLIST.join("|"), "i");
