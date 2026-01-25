"use client";

import React from "react";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Phone,
  AlertCircle,
} from "lucide-react";

/**
 * 店舗情報セクション統合コンポーネント（92件改善 Phase3）
 * 3.7-3.8 概要・アレルギー情報重複削除
 *
 * 店舗詳細ページで情報を整理し、重複を排除
 */

export const RestaurantInfoSection = ({
  restaurant,
  collapsed = false,
  showAllByDefault = false,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(showAllByDefault);

  // 情報の存在チェック
  const hasOverview = restaurant.overview && restaurant.overview.trim();
  const hasDescription =
    restaurant.description && restaurant.description.trim();
  const hasAddress = restaurant.address;
  const hasPhone = restaurant.phone;
  const hasBusinessHours = restaurant.business_hours?.length > 0;
  const hasFeatures = restaurant.features?.length > 0;
  const hasAllergenInfo =
    restaurant.allergen_info || restaurant.allergen_features?.length > 0;

  // 概要と説明が同じ場合は概要のみ表示
  const displayOverview = hasOverview ? restaurant.overview : null;
  const displayDescription =
    hasDescription &&
    (!hasOverview || restaurant.overview !== restaurant.description)
      ? restaurant.description
      : null;

  // アレルゲン特徴を重複なく表示
  const allergenFeatures = [
    ...new Set([
      ...(restaurant.allergen_features || []),
      ...(restaurant.features?.filter(
        (f) =>
          f.includes("アレルギー") || f.includes("対応") || f.includes("除去"),
      ) || []),
    ]),
  ];

  // 一般特徴（アレルゲン関連を除く）
  const generalFeatures =
    restaurant.features?.filter(
      (f) =>
        !f.includes("アレルギー") && !f.includes("対応") && !f.includes("除去"),
    ) || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* ヘッダー: 常に表示 */}
      <div className="p-4">
        {/* 店舗名 */}
        <h2 className="font-bold text-lg text-slate-800">{restaurant.name}</h2>

        {/* 住所 */}
        {hasAddress && (
          <p className="text-sm text-slate-500 mt-1 flex items-start gap-1">
            <MapPin size={14} className="mt-0.5 flex-shrink-0" />
            {restaurant.address}
          </p>
        )}

        {/* 概要（長い場合は省略） */}
        {displayOverview && (
          <p
            className={`text-sm text-slate-600 mt-3 ${!isExpanded ? "line-clamp-3" : ""}`}
          >
            {displayOverview}
          </p>
        )}

        {/* アレルゲン対応バッジ */}
        {allergenFeatures.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {allergenFeatures
              .slice(0, isExpanded ? undefined : 4)
              .map((feature, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold"
                >
                  ✓ {feature}
                </span>
              ))}
            {!isExpanded && allergenFeatures.length > 4 && (
              <span className="text-xs text-slate-400">
                +{allergenFeatures.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 展開時: 詳細情報 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4">
          {/* 詳細説明 */}
          {displayDescription && (
            <div>
              <h4 className="font-bold text-sm text-slate-700 mb-2">詳細</h4>
              <p className="text-sm text-slate-600">{displayDescription}</p>
            </div>
          )}

          {/* アレルギー対応詳細 */}
          {restaurant.allergen_info && (
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <h4 className="font-bold text-sm text-amber-800 mb-2 flex items-center gap-1">
                <AlertCircle size={14} />
                アレルギー対応について
              </h4>
              <p className="text-sm text-amber-700">
                {restaurant.allergen_info}
              </p>
            </div>
          )}

          {/* 営業時間 */}
          {hasBusinessHours && (
            <div>
              <h4 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-1">
                <Clock size={14} />
                営業時間
              </h4>
              <div className="text-sm text-slate-600 space-y-1">
                {restaurant.business_hours.map((hours, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{hours.day}</span>
                    <span>
                      {hours.open} - {hours.close}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 電話番号 */}
          {hasPhone && (
            <div>
              <h4 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-1">
                <Phone size={14} />
                電話番号
              </h4>
              <a
                href={`tel:${restaurant.phone}`}
                className="text-sm text-orange-600 font-bold"
              >
                {restaurant.phone}
              </a>
            </div>
          )}

          {/* 一般特徴 */}
          {generalFeatures.length > 0 && (
            <div>
              <h4 className="font-bold text-sm text-slate-700 mb-2">特徴</h4>
              <div className="flex flex-wrap gap-1">
                {generalFeatures.map((feature, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 展開/折りたたみボタン */}
      {!collapsed && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 border-t border-slate-100 flex items-center justify-center gap-1 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
        >
          {isExpanded ? (
            <>
              閉じる <ChevronUp size={16} />
            </>
          ) : (
            <>
              詳細を見る <ChevronDown size={16} />
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default RestaurantInfoSection;
