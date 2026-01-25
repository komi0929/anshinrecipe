/**
 * アナリティクス・トラッキングユーティリティ（92件改善 Phase5）
 * 5.99 アナリティクス基盤
 */

// イベントタイプ定義
export const EVENTS = {
  // ページビュー
  PAGE_VIEW: "page_view",

  // 検索
  SEARCH: "search",
  SEARCH_FILTER: "search_filter",

  // 店舗
  RESTAURANT_VIEW: "restaurant_view",
  RESTAURANT_CALL: "restaurant_call",
  RESTAURANT_SHARE: "restaurant_share",
  RESTAURANT_BOOKMARK: "restaurant_bookmark",
  RESTAURANT_DIRECTION: "restaurant_direction",

  // レビュー
  REVIEW_SUBMIT: "review_submit",
  REVIEW_LIKE: "review_like",
  REVIEW_REPORT: "review_report",

  // 投稿
  POST_START: "post_start",
  POST_COMPLETE: "post_complete",
  POST_ABANDON: "post_abandon",

  // レシピ
  RECIPE_VIEW: "recipe_view",
  RECIPE_SAVE: "recipe_save",
  RECIPE_SHARE: "recipe_share",

  // ユーザー
  SIGNUP: "signup",
  LOGIN: "login",
  LOGOUT: "logout",
  PROFILE_UPDATE: "profile_update",

  // EC
  EC_CLICK: "ec_click",
  EC_CONVERSION: "ec_conversion",

  // エラー
  ERROR: "error",
};

// Google Analytics イベント送信
export const trackEvent = (eventName, params = {}) => {
  if (typeof window === "undefined") return;

  // Google Analytics
  if (window.gtag) {
    window.gtag("event", eventName, {
      ...params,
      timestamp: new Date().toISOString(),
    });
  }

  // Debug mode
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", eventName, params);
  }
};

// ページビュー
export const trackPageView = (path, title) => {
  trackEvent(EVENTS.PAGE_VIEW, { page_path: path, page_title: title });
};

// 検索トラッキング
export const trackSearch = (query, resultCount, filters = {}) => {
  trackEvent(EVENTS.SEARCH, {
    search_term: query,
    result_count: resultCount,
    ...filters,
  });
};

// 店舗アクション
export const trackRestaurantAction = (action, restaurant) => {
  trackEvent(action, {
    restaurant_id: restaurant.id,
    restaurant_name: restaurant.name,
    prefecture: restaurant.prefecture,
  });
};

// レビューアクション
export const trackReviewAction = (action, review, restaurant) => {
  trackEvent(action, {
    review_id: review.id,
    restaurant_id: restaurant?.id,
    rating: review.rating,
  });
};

// 投稿トラッキング
export const trackPost = (action, data = {}) => {
  trackEvent(action, {
    post_type: data.type,
    has_images: data.images?.length > 0,
    ...data,
  });
};

// ECクリック
export const trackECClick = (product, restaurant) => {
  trackEvent(EVENTS.EC_CLICK, {
    product_name: product.name,
    product_price: product.price,
    platform: product.platform,
    restaurant_id: restaurant?.id,
  });
};

// エラートラッキング
export const trackError = (error, context = {}) => {
  trackEvent(EVENTS.ERROR, {
    error_message: error.message || error,
    error_stack: error.stack,
    ...context,
  });
};

// タイミング計測
export const trackTiming = (category, variable, value, label) => {
  if (typeof window === "undefined" || !window.gtag) return;

  window.gtag("event", "timing_complete", {
    event_category: category,
    name: variable,
    value: Math.round(value),
    event_label: label,
  });
};

// パフォーマンス計測開始
export const startPerformanceMark = (name) => {
  if (typeof performance !== "undefined") {
    performance.mark(`${name}_start`);
  }
};

// パフォーマンス計測終了
export const endPerformanceMark = (name, category = "Performance") => {
  if (typeof performance === "undefined") return;

  performance.mark(`${name}_end`);
  performance.measure(name, `${name}_start`, `${name}_end`);

  const measure = performance.getEntriesByName(name)[0];
  if (measure) {
    trackTiming(category, name, measure.duration);
  }
};

export default {
  EVENTS,
  trackEvent,
  trackPageView,
  trackSearch,
  trackRestaurantAction,
  trackReviewAction,
  trackPost,
  trackECClick,
  trackError,
  trackTiming,
  startPerformanceMark,
  endPerformanceMark,
};
