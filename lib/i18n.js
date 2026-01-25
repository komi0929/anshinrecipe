/**
 * ローカライゼーション・多言語対応（92件改善 Phase5）
 * 5.98 多言語対応基盤
 */

// 日本語テキスト定義
export const ja = {
  // 共通
  common: {
    loading: "読み込み中...",
    error: "エラーが発生しました",
    retry: "再試行",
    cancel: "キャンセル",
    save: "保存",
    delete: "削除",
    edit: "編集",
    back: "戻る",
    next: "次へ",
    done: "完了",
    close: "閉じる",
    search: "検索",
    filter: "フィルター",
    sort: "並び替え",
    all: "すべて",
    none: "なし",
    yes: "はい",
    no: "いいえ",
  },

  // ナビゲーション
  nav: {
    home: "ホーム",
    map: "マップ",
    recipes: "レシピ",
    post: "投稿",
    profile: "プロフィール",
    settings: "設定",
  },

  // レストラン関連
  restaurant: {
    name: "店舗名",
    address: "住所",
    phone: "電話番号",
    hours: "営業時間",
    closed: "定休日",
    rating: "評価",
    reviews: "口コミ",
    photos: "写真",
    menu: "メニュー",
    allergyInfo: "アレルギー対応",
    features: "特徴",
    takeout: "お取り寄せ",
    reservation: "予約",
  },

  // アレルギー
  allergy: {
    egg: "卵",
    milk: "乳",
    wheat: "小麦",
    buckwheat: "そば",
    peanut: "落花生",
    shrimp: "えび",
    crab: "かに",
    almond: "アーモンド",
    abalone: "あわび",
    squid: "いか",
    salmon_roe: "いくら",
    orange: "オレンジ",
    cashew: "カシューナッツ",
    kiwi: "キウイ",
    beef: "牛肉",
    walnut: "くるみ",
    sesame: "ごま",
    mackerel: "さば",
    soy: "大豆",
    chicken: "鶏肉",
    banana: "バナナ",
    pork: "豚肉",
    matsutake: "まつたけ",
    peach: "もも",
    yam: "やまいも",
    apple: "りんご",
    gelatin: "ゼラチン",
  },

  // レビュー
  review: {
    write: "口コミを書く",
    helpful: "役に立った",
    report: "報告",
    reply: "返信",
    anonymous: "匿名",
    verified: "認証済み",
  },

  // エラーメッセージ
  errors: {
    network: "ネットワークエラーが発生しました",
    server: "サーバーエラーが発生しました",
    notFound: "ページが見つかりません",
    unauthorized: "ログインが必要です",
    forbidden: "アクセス権限がありません",
    validation: "入力内容をご確認ください",
  },

  // 成功メッセージ
  success: {
    saved: "保存しました",
    deleted: "削除しました",
    posted: "投稿しました",
    updated: "更新しました",
    copied: "コピーしました",
  },

  // 日時
  datetime: {
    today: "今日",
    yesterday: "昨日",
    daysAgo: "{n}日前",
    hoursAgo: "{n}時間前",
    minutesAgo: "{n}分前",
    justNow: "たった今",
  },
};

// 翻訳関数
export const t = (key, params = {}) => {
  const keys = key.split(".");
  let value = ja;

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      return key; // キーが見つからない場合はキーをそのまま返す
    }
  }

  if (typeof value !== "string") return key;

  // パラメータ置換
  return value.replace(
    /\{(\w+)\}/g,
    (_, param) => params[param] ?? `{${param}}`,
  );
};

// アレルゲン名取得
export const getAllergenName = (code) => {
  return ja.allergy[code] || code;
};

// アレルゲンリスト取得
export const getAllergenList = () => {
  return Object.entries(ja.allergy).map(([code, name]) => ({ code, name }));
};

export default { ja, t, getAllergenName, getAllergenList };
