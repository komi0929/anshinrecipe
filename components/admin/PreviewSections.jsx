"use client";

import React from "react";
import Link from "next/link";
import {
  Star,
  MapPin,
  Clock,
  BadgeCheck,
  ChevronRight,
  Phone,
} from "lucide-react";

/**
 * レビューセクション統合コンポーネント（92件改善 Phase2）
 * 2.5 プレビューにレビューセクション追加
 */

export const PreviewReviewSection = ({
  reviews = [],
  rating,
  reviewCount,
  compact = false,
}) => {
  if (!reviews.length && !rating) return null;

  const displayReviews = reviews.slice(0, compact ? 2 : 3);
  const avgRating =
    rating ||
    (reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : null);

  return (
    <div className="space-y-3">
      {/* Rating Summary */}
      {avgRating && (
        <div className="flex items-center gap-3 bg-amber-50 rounded-xl p-3 border border-amber-100">
          <div className="text-center">
            <div className="text-2xl font-black text-slate-800 flex items-center gap-1">
              {avgRating}
              <Star size={20} fill="#FBBF24" className="text-amber-400" />
            </div>
            <div className="text-xs text-slate-500">
              {reviewCount || reviews.length}件の評価
            </div>
          </div>
          <div className="flex-1 flex gap-0.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviews.filter(
                (r) => Math.round(r.rating) === stars,
              ).length;
              const percentage =
                reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={stars} className="flex-1 flex flex-col items-center">
                  <div className="h-8 w-full bg-slate-100 rounded-full overflow-hidden flex flex-col-reverse">
                    <div
                      className="bg-amber-400 w-full rounded-full"
                      style={{ height: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-[8px] text-slate-400 mt-0.5">
                    {stars}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews List */}
      {displayReviews.length > 0 && (
        <div className="space-y-2">
          {displayReviews.map((review, i) => (
            <div key={review.id || i} className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-start gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                  {review.profiles?.avatar_url ? (
                    <img
                      src={review.profiles.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-500 text-xs font-bold">
                      {(review.profiles?.username || "U").charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-700">
                      {review.is_anonymous
                        ? "匿名"
                        : review.profiles?.username || "ゲスト"}
                    </span>
                    <div className="flex">
                      {[...Array(5)].map((_, j) => (
                        <Star
                          key={j}
                          size={8}
                          fill={j < review.rating ? "#FBBF24" : "none"}
                          className={
                            j < review.rating
                              ? "text-amber-400"
                              : "text-slate-200"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                    {review.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View All Link */}
      {reviews.length > displayReviews.length && (
        <button className="w-full py-2 text-sm text-orange-600 font-bold flex items-center justify-center gap-1 hover:bg-orange-50 rounded-xl transition-colors">
          すべての口コミを見る ({reviews.length}件)
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
};

/**
 * 画像ギャラリーセクション（92件改善 Phase2）
 * 2.6 プレビューに画像ギャラリー追加
 */
export const PreviewImageGallery = ({
  images = [],
  classifiedImages = {},
  onImageClick,
}) => {
  // 全画像を統合
  const allImages =
    images.length > 0
      ? images
      : [
          ...(classifiedImages.exterior || []),
          ...(classifiedImages.interior || []),
          ...(classifiedImages.food || []),
          ...(classifiedImages.other || []),
        ];

  if (allImages.length === 0) return null;

  const displayImages = allImages.slice(0, 4);
  const remainingCount = allImages.length - 4;

  return (
    <div className="grid grid-cols-4 gap-1 rounded-xl overflow-hidden">
      {displayImages.map((img, i) => (
        <div
          key={i}
          className="aspect-square relative cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => onImageClick?.(i)}
        >
          <img src={img} alt="" className="w-full h-full object-cover" />
          {i === 3 && remainingCount > 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold">
              +{remainingCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * FAB・アクションボタン群（92件改善 Phase2）
 * 2.10 プレビューにFAB追加
 */
export const PreviewActionBar = ({
  restaurantId,
  phone,
  onCall,
  onShare,
  onBookmark,
  isBookmarked = false,
}) => {
  return (
    <div className="flex gap-2">
      {phone && (
        <button
          onClick={onCall}
          className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
        >
          <Phone size={18} /> 電話
        </button>
      )}
      <button
        onClick={onShare}
        className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200"
      >
        シェア
      </button>
      <button
        onClick={onBookmark}
        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
          isBookmarked
            ? "bg-orange-500 text-white"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
        }`}
      >
        ★
      </button>
    </div>
  );
};

export default { PreviewReviewSection, PreviewImageGallery, PreviewActionBar };
