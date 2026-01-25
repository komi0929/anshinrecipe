/**
 * メニュー重複判定ロジック（92件改善 Phase1）
 * 1.7 メニュー重複ロジック修正
 */

/**
 * メニューの重複をチェック
 * @param {Object} newMenu - 新規メニュー
 * @param {Array} existingMenus - 既存メニュー一覧
 * @returns {Object|null} - 重複候補またはnull
 */
export const findDuplicateMenu = (newMenu, existingMenus = []) => {
  if (!newMenu || !existingMenus.length) return null;

  const normalizedNewName = normalizeMenuName(newMenu.name);
  const normalizedNewDesc = normalizeText(newMenu.description);

  for (const existing of existingMenus) {
    // 名前の類似度チェック
    const nameSimilarity = calculateSimilarity(
      normalizedNewName,
      normalizeMenuName(existing.name),
    );

    // 説明の類似度チェック
    const descSimilarity = calculateSimilarity(
      normalizedNewDesc,
      normalizeText(existing.description),
    );

    // 価格の一致チェック
    const priceMatch =
      existing.price && newMenu.price
        ? Math.abs(existing.price - newMenu.price) <= 100
        : true;

    // 重複判定: 名前が90%以上類似、または名前80%以上+説明70%以上
    if (
      nameSimilarity >= 0.9 ||
      (nameSimilarity >= 0.8 && descSimilarity >= 0.7)
    ) {
      return {
        ...existing,
        similarity: {
          name: nameSimilarity,
          description: descSimilarity,
          priceMatch,
        },
      };
    }
  }

  return null;
};

/**
 * メニュー名の正規化
 */
const normalizeMenuName = (name) => {
  if (!name) return "";
  return (
    name
      .toLowerCase()
      // 全角を半角に
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
        String.fromCharCode(s.charCodeAt(0) - 0xfee0),
      )
      // 括弧内を削除
      .replace(/[（(][^）)]*[）)]/g, "")
      // 余分な空白を削除
      .replace(/\s+/g, " ")
      .trim()
  );
};

/**
 * テキストの正規化
 */
const normalizeText = (text) => {
  if (!text) return "";
  return text.toLowerCase().replace(/\s+/g, " ").trim();
};

/**
 * 類似度計算（レーベンシュタイン距離ベース）
 */
const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
};

/**
 * レーベンシュタイン距離
 */
const levenshteinDistance = (str1, str2) => {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[m][n];
};

/**
 * メニューのマージ
 */
export const mergeMenus = (primary, secondary) => {
  return {
    ...primary,
    // 価格は低い方を採用
    price: Math.min(primary.price || Infinity, secondary.price || Infinity),
    // 説明は長い方を採用
    description:
      (primary.description?.length || 0) >= (secondary.description?.length || 0)
        ? primary.description
        : secondary.description,
    // 画像は両方をマージ
    images: [
      ...new Set([...(primary.images || []), ...(secondary.images || [])]),
    ],
    // アレルゲン情報はマージ
    allergens: [
      ...new Set([
        ...(primary.allergens || []),
        ...(secondary.allergens || []),
      ]),
    ],
    // ソースは両方記録
    sources: [
      ...new Set([
        ...(primary.sources || [primary.source]).filter(Boolean),
        ...(secondary.sources || [secondary.source]).filter(Boolean),
      ]),
    ],
  };
};

export default { findDuplicateMenu, mergeMenus };
