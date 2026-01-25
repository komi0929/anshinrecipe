"use client";

import React from "react";
import {
  MapPin,
  Phone,
  Globe,
  Instagram,
  ShieldCheck,
  BadgeCheck,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Home,
  Camera,
  UtensilsCrossed,
} from "lucide-react";

/**
 * 共通プレビューコンポーネント（92件改善 Phase2）
 * 2.1 共通プレビューコンポーネント作成
 * 管理画面と本番ページで同じUIを使用
 */
export const RestaurantPreview = ({
  data,
  currentImageIndex = 0,
  onPrevImage,
  onNextImage,
  selectedMenus = [],
  compact = false,
}) => {
  if (!data) return null;

  const {
    name,
    shopName,
    shop_name,
    address,
    phone,
    website_url,
    website,
    instagram_url,
    overview,
    takeout_url,
    menus = [],
    features = {},
    classified_images = {},
    images = [],
    is_owner_verified,
  } = data;

  // 店舗名の取得（複数フィールド対応）
  const displayName = name || shopName || shop_name || "店舗名未設定";

  // 画像の取得
  const allImages =
    images.length > 0
      ? images
      : [
          ...(classified_images.exterior || []),
          ...(classified_images.interior || []),
          ...(classified_images.food || []),
          ...(classified_images.other || []),
        ];

  // 表示するメニュー
  const displayMenus =
    selectedMenus.length > 0
      ? menus.filter((_, i) => selectedMenus.includes(i))
      : menus;

  // 画像カテゴリ取得
  const getImageCategory = (url) => {
    if (classified_images?.exterior?.includes(url))
      return { icon: Home, label: "外観" };
    if (classified_images?.interior?.includes(url))
      return { icon: Camera, label: "内観" };
    if (classified_images?.food?.includes(url))
      return { icon: UtensilsCrossed, label: "料理" };
    return { icon: null, label: "その他" };
  };

  // アレルギー/キッズ対応のラベル
  const ALLERGY_LABELS = {
    allergen_label: "メニュー表記",
    contamination: "コンタミ対策",
    removal: "除去食対応",
    chart: "アレルギー表",
  };
  const KIDS_LABELS = {
    kids_chair: "キッズチェア",
    stroller: "ベビーカー",
    diaper: "おむつ交換",
    baby_food: "離乳食持込",
  };

  const allergyFeatures = features?.allergy || {};
  const kidsFeatures = features?.child || {};

  return (
    <div
      className={`bg-white ${compact ? "rounded-2xl" : "rounded-[40px]"} overflow-hidden shadow-2xl flex flex-col ${compact ? "h-auto" : "h-[750px]"}`}
    >
      {/* Status Bar Mock (非コンパクト時のみ) */}
      {!compact && (
        <div className="h-6 bg-slate-800 w-full flex justify-between px-6 items-center">
          <span className="text-[10px] text-white font-bold">9:41</span>
          <div className="flex gap-1">
            <span className="w-3 h-3 bg-white rounded-full opacity-20"></span>
            <span className="w-3 h-3 bg-white rounded-full text-white text-[8px] flex items-center justify-center">
              🔋
            </span>
          </div>
        </div>
      )}

      {/* Image Hero */}
      <div className={`${compact ? "h-40" : "h-56"} relative bg-slate-200`}>
        {allImages.length > 0 ? (
          <>
            <img
              src={
                allImages[currentImageIndex]?.startsWith("http")
                  ? allImages[currentImageIndex]
                  : `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${allImages[currentImageIndex]}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
              }
              className="w-full h-full object-cover"
              alt=""
            />
            {/* Navigation */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={onPrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-lg"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={onNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-lg"
                >
                  <ChevronRight size={16} />
                </button>
                {/* Dots */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1">
                  {allImages.slice(0, 5).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${i === currentImageIndex ? "bg-white" : "bg-white/50"}`}
                    />
                  ))}
                  {allImages.length > 5 && (
                    <span className="text-white text-[8px]">
                      +{allImages.length - 5}
                    </span>
                  )}
                </div>
              </>
            )}
            {/* Category Label */}
            {classified_images && (
              <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                {getImageCategory(allImages[currentImageIndex]).label}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            No Image
          </div>
        )}

        {/* Gradient & Title */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-xs font-bold bg-orange-500 w-fit px-2 py-0.5 rounded">
              飲食店
            </div>
            {is_owner_verified && (
              <div className="flex items-center gap-1 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded">
                <BadgeCheck size={10} /> 公認
              </div>
            )}
          </div>
          <h1
            className={`${compact ? "text-lg" : "text-xl"} font-black leading-tight`}
          >
            {displayName}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div
        className={`flex-1 overflow-y-auto ${compact ? "p-3" : "p-4"} space-y-4`}
      >
        {/* Action Bar */}
        <div className="flex gap-2">
          {phone && (
            <div className="flex-1 py-2 bg-slate-50 rounded-xl flex items-center justify-center gap-1 text-[10px] font-bold text-slate-600 border border-slate-100">
              <Phone size={10} /> 電話
            </div>
          )}
          {instagram_url && (
            <div className="flex-1 py-2 bg-pink-50 rounded-xl flex items-center justify-center gap-1 text-[10px] font-bold text-pink-600 border border-pink-100">
              <Instagram size={10} /> Insta
            </div>
          )}
          {(website_url || website) && (
            <div className="flex-1 py-2 bg-slate-50 rounded-xl flex items-center justify-center gap-1 text-[10px] font-bold text-slate-600 border border-slate-100">
              <Globe size={10} /> Web
            </div>
          )}
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 text-[10px] text-slate-500">
          <MapPin size={12} className="text-orange-500 shrink-0" />
          <span>{address}</span>
        </div>

        {/* Overview */}
        {overview && (
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-4 border border-slate-100">
            <h3 className="font-bold text-xs text-slate-800 mb-2 flex items-center gap-2">
              <span className="text-base">💡</span> このお店について
            </h3>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              {overview}
            </p>
          </div>
        )}

        {/* Takeout */}
        {takeout_url && (
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-100">
            <h3 className="font-bold text-xs text-emerald-800 mb-2 flex items-center gap-2">
              <ShoppingBag size={14} /> お取り寄せ・オンラインショップ
            </h3>
            <div className="text-[10px] text-emerald-600 truncate">
              {takeout_url}
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Allergy */}
          <div className="p-3 rounded-2xl border bg-orange-50/50 border-orange-100">
            <h3 className="font-bold mb-2 flex items-center gap-2 text-xs text-orange-800">
              <ShieldCheck size={14} /> アレルギー対応
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(ALLERGY_LABELS).map(([key, label]) => {
                const isActive = allergyFeatures[key];
                return (
                  <div
                    key={key}
                    className={`bg-white p-1.5 rounded-lg border text-center ${isActive ? "border-orange-200 bg-orange-50 text-orange-600" : "border-slate-100 opacity-60"}`}
                  >
                    <div className="text-[9px] font-bold text-slate-500">
                      {label}
                    </div>
                    <div className="font-bold text-[10px]">
                      {isActive ? "◯" : "-"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kids */}
          <div className="p-3 rounded-2xl border bg-blue-50/50 border-blue-100">
            <h3 className="font-bold mb-2 flex items-center gap-2 text-xs text-blue-800">
              <span className="text-base">👶</span> キッズ対応
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(KIDS_LABELS).map(([key, label]) => {
                const isActive = kidsFeatures[key];
                return (
                  <div
                    key={key}
                    className={`bg-white p-1.5 rounded-lg border text-center ${isActive ? "border-blue-200 bg-blue-50 text-blue-600" : "border-slate-100 opacity-60"}`}
                  >
                    <div className="text-[9px] font-bold text-slate-500">
                      {label}
                    </div>
                    <div className="font-bold text-[10px]">
                      {isActive ? "◯" : "-"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Menu List */}
        <div>
          <div className="flex items-center gap-2 font-bold mb-2 text-sm">
            <span className="text-base">🍽️</span> 食べられるメニュー
          </div>
          {displayMenus.length > 0 ? (
            <div className="space-y-2">
              {displayMenus.slice(0, compact ? 2 : 3).map((menu, i) => (
                <div
                  key={i}
                  className="bg-slate-50 rounded-xl p-3 border border-slate-100"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-slate-800">
                      {menu.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ¥{menu.price}
                    </span>
                  </div>
                </div>
              ))}
              {displayMenus.length > (compact ? 2 : 3) && (
                <div className="text-center text-[10px] text-slate-400">
                  他 {displayMenus.length - (compact ? 2 : 3)} 件のメニュー
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-4 text-center border border-dashed border-slate-200">
              <p className="text-[10px] text-slate-400">
                メニュー情報はまだありません
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav Mock (非コンパクト時のみ) */}
      {!compact && (
        <div className="h-16 bg-white border-t border-slate-100 flex justify-around items-center px-6">
          <div className="w-6 h-6 rounded bg-orange-100"></div>
          <div className="w-6 h-6 rounded bg-slate-100"></div>
          <div className="w-6 h-6 rounded bg-slate-100"></div>
        </div>
      )}
    </div>
  );
};

export default RestaurantPreview;
