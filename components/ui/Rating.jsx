"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

/**
 * 評価・レーティングコンポーネント（92件改善 Phase5）
 * 5.91 レーティング入力
 */

export const StarRating = ({
  value = 0,
  onChange,
  max = 5,
  size = "md",
  readonly = false,
  showValue = false,
  className = "",
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const starSize = sizeClasses[size];

  const handleClick = (rating) => {
    if (!readonly && onChange) {
      onChange(rating === value ? 0 : rating);
    }
  };

  const displayValue = hoverValue || value;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex">
        {[...Array(max)].map((_, i) => {
          const rating = i + 1;
          const isFilled = rating <= displayValue;
          const isHalf = displayValue > i && displayValue < rating;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(rating)}
              onMouseEnter={() => !readonly && setHoverValue(rating)}
              onMouseLeave={() => !readonly && setHoverValue(0)}
              disabled={readonly}
              className={`transition-transform ${!readonly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
            >
              <Star
                size={starSize}
                fill={isFilled ? "#FBBF24" : "none"}
                className={isFilled ? "text-amber-400" : "text-slate-300"}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="ml-2 font-bold text-slate-700">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
};

// レーティングサマリー表示
export const RatingSummary = ({
  average,
  total,
  distribution = {}, // { 5: 10, 4: 8, 3: 5, 2: 2, 1: 1 }
  className = "",
}) => {
  const totalReviews =
    Object.values(distribution).reduce((a, b) => a + b, 0) || total;

  return (
    <div className={`bg-slate-50 rounded-2xl p-4 ${className}`}>
      <div className="flex items-center gap-4">
        {/* Average Score */}
        <div className="text-center">
          <div className="text-4xl font-black text-slate-800">
            {average?.toFixed(1) || "0.0"}
          </div>
          <StarRating value={Math.round(average || 0)} readonly size="sm" />
          <p className="text-xs text-slate-500 mt-1">{totalReviews}件の評価</p>
        </div>

        {/* Distribution */}
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = distribution[stars] || 0;
            const percentage =
              totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            return (
              <div key={stars} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-slate-500">{stars}</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-slate-400">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default { StarRating, RatingSummary };
