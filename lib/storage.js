/**
 * ストレージバケット管理ユーティリティ（92件改善 Phase1）
 * 1.8-1.9 バケット分離
 */

import { supabase } from "./supabaseClient";

// バケット定義
export const STORAGE_BUCKETS = {
  // 店舗関連
  RESTAURANTS: "restaurants",
  RESTAURANT_IMAGES: "restaurant-images",
  MENU_IMAGES: "menu-images",

  // ユーザー関連
  AVATARS: "avatars",
  REVIEW_IMAGES: "review-images",

  // レシピ関連
  RECIPE_IMAGES: "recipe-images",

  // 一般
  PUBLIC: "public",
};

/**
 * 画像をアップロード
 * @param {File} file - アップロードするファイル
 * @param {string} bucket - バケット名
 * @param {string} path - ファイルパス
 * @param {Object} options - オプション
 * @returns {Promise<string>} - 公開URL
 */
export const uploadImage = async (file, bucket, path, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ["image/jpeg", "image/png", "image/webp"],
    quality = 0.8,
    resize = null,
  } = options;

  // ファイルサイズチェック
  if (file.size > maxSize) {
    throw new Error(
      `ファイルサイズは${maxSize / 1024 / 1024}MB以下にしてください`,
    );
  }

  // ファイルタイプチェック
  if (!allowedTypes.includes(file.type)) {
    throw new Error("対応していないファイル形式です");
  }

  // ファイル名生成
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const fullPath = path ? `${path}/${fileName}` : fileName;

  // アップロード
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fullPath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    throw new Error("アップロードに失敗しました");
  }

  // 公開URLを取得
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

/**
 * 画像を削除
 * @param {string} url - 画像URL
 * @param {string} bucket - バケット名
 */
export const deleteImage = async (url, bucket) => {
  // URLからパスを抽出
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split("/");
  const bucketIndex = pathParts.findIndex((p) => p === bucket);

  if (bucketIndex === -1) {
    throw new Error("Invalid image URL");
  }

  const filePath = pathParts.slice(bucketIndex + 1).join("/");

  const { error } = await supabase.storage.from(bucket).remove([filePath]);

  if (error) {
    console.error("Delete error:", error);
    throw new Error("削除に失敗しました");
  }
};

/**
 * 店舗画像をアップロード
 */
export const uploadRestaurantImage = async (
  file,
  restaurantId,
  category = "general",
) => {
  return uploadImage(
    file,
    STORAGE_BUCKETS.RESTAURANT_IMAGES,
    `${restaurantId}/${category}`,
  );
};

/**
 * メニュー画像をアップロード
 */
export const uploadMenuImage = async (file, restaurantId, menuId) => {
  return uploadImage(
    file,
    STORAGE_BUCKETS.MENU_IMAGES,
    `${restaurantId}/${menuId || "new"}`,
  );
};

/**
 * レビュー画像をアップロード
 */
export const uploadReviewImage = async (file, userId, reviewId) => {
  return uploadImage(
    file,
    STORAGE_BUCKETS.REVIEW_IMAGES,
    `${userId}/${reviewId || "new"}`,
  );
};

/**
 * アバターをアップロード
 */
export const uploadAvatar = async (file, userId) => {
  return uploadImage(
    file,
    STORAGE_BUCKETS.AVATARS,
    userId,
    { maxSize: 2 * 1024 * 1024 }, // 2MB制限
  );
};

/**
 * レシピ画像をアップロード
 */
export const uploadRecipeImage = async (file, userId, recipeId) => {
  return uploadImage(
    file,
    STORAGE_BUCKETS.RECIPE_IMAGES,
    `${userId}/${recipeId || "new"}`,
  );
};

export default {
  STORAGE_BUCKETS,
  uploadImage,
  deleteImage,
  uploadRestaurantImage,
  uploadMenuImage,
  uploadReviewImage,
  uploadAvatar,
  uploadRecipeImage,
};
