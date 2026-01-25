"use client";

import React from "react";
import {
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

/**
 * 管理画面用リストカード統一（92件改善 Phase2）
 * 2.2-2.4 管理画面プレビュー統合
 */

export const AdminRestaurantCard = ({
  restaurant,
  status = "pending", // 'pending' | 'approved' | 'rejected' | 'duplicate'
  onApprove,
  onReject,
  onEdit,
  onView,
  showActions = true,
}) => {
  const statusConfig = {
    pending: { label: "審査中", bg: "bg-amber-100", text: "text-amber-700" },
    approved: { label: "承認済", bg: "bg-green-100", text: "text-green-700" },
    rejected: { label: "却下", bg: "bg-red-100", text: "text-red-700" },
    duplicate: { label: "重複", bg: "bg-slate-100", text: "text-slate-700" },
  };

  const currentStatus = statusConfig[status] || statusConfig.pending;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">
        {/* Image */}
        <div className="w-32 h-32 flex-shrink-0 bg-slate-100 relative">
          {restaurant.images?.[0] ? (
            <img
              src={restaurant.images[0]}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">
              🍽️
            </div>
          )}
          <span
            className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${currentStatus.bg} ${currentStatus.text}`}
          >
            {currentStatus.label}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 truncate">
                {restaurant.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin size={10} />
                {restaurant.address || restaurant.prefecture}
              </p>
            </div>
            {restaurant.is_owner_verified && (
              <ShieldCheck size={16} className="text-blue-500 flex-shrink-0" />
            )}
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            {restaurant.rating && (
              <span className="flex items-center gap-0.5">
                <Star size={10} fill="#FBBF24" className="text-amber-400" />
                {restaurant.rating.toFixed(1)}
              </span>
            )}
            {restaurant.review_count > 0 && (
              <span>{restaurant.review_count}件の口コミ</span>
            )}
            {restaurant.source && (
              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">
                {restaurant.source}
              </span>
            )}
          </div>

          {/* Allergen Features */}
          {restaurant.features?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {restaurant.features.slice(0, 3).map((feature, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded text-[10px]"
                >
                  {feature}
                </span>
              ))}
              {restaurant.features.length > 3 && (
                <span className="text-[10px] text-slate-400">
                  +{restaurant.features.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex border-t border-slate-100">
          <button
            onClick={() => onView?.(restaurant)}
            className="flex-1 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1"
          >
            <ExternalLink size={12} /> 詳細
          </button>
          <button
            onClick={() => onEdit?.(restaurant)}
            className="flex-1 py-2 text-xs text-blue-600 hover:bg-blue-50 border-l border-slate-100"
          >
            編集
          </button>
          {status === "pending" && (
            <>
              <button
                onClick={() => onApprove?.(restaurant)}
                className="flex-1 py-2 text-xs text-green-600 hover:bg-green-50 border-l border-slate-100"
              >
                承認
              </button>
              <button
                onClick={() => onReject?.(restaurant)}
                className="flex-1 py-2 text-xs text-red-600 hover:bg-red-50 border-l border-slate-100"
              >
                却下
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// 重複候補カード
export const DuplicateCandidateCard = ({
  original,
  duplicate,
  onMerge,
  onKeepBoth,
  onDismiss,
}) => {
  return (
    <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-amber-500" />
        <span className="font-bold text-amber-700 text-sm">重複の可能性</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 border border-slate-200">
          <span className="text-[10px] text-slate-400">オリジナル</span>
          <h4 className="font-bold text-sm text-slate-800 truncate">
            {original.name}
          </h4>
          <p className="text-xs text-slate-500 truncate">{original.address}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-amber-200">
          <span className="text-[10px] text-amber-500">候補</span>
          <h4 className="font-bold text-sm text-slate-800 truncate">
            {duplicate.name}
          </h4>
          <p className="text-xs text-slate-500 truncate">{duplicate.address}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onMerge}
          className="flex-1 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold"
        >
          統合
        </button>
        <button
          onClick={onKeepBoth}
          className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold"
        >
          両方保持
        </button>
        <button
          onClick={onDismiss}
          className="py-2 px-3 bg-slate-100 text-slate-500 rounded-lg text-xs"
        >
          却下
        </button>
      </div>
    </div>
  );
};

export default { AdminRestaurantCard, DuplicateCandidateCard };
