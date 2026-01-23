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

/**
 * Check if a menu name should be blocked (garbage filtering)
 * @param {string} menuName - The menu name to check
 * @returns {boolean} - True if the menu should be blocked
 */
export function isBlockedMenu(menuName) {
  if (!menuName || typeof menuName !== "string") return true;

  // Check against blocklist
  if (GARBAGE_REGEX.test(menuName)) return true;

  // Too short names are likely garbage
  if (menuName.length < 2) return true;

  // Too long names are likely descriptions, not menu items
  if (menuName.length > 50) return true;

  return false;
}
