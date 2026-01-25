"use client";

import React from "react";
import { ShoppingBag, ExternalLink, Truck, Clock } from "lucide-react";

/**
 * お取り寄せセクション（92件改善 Phase3）
 * 3.12 お取り寄せセクション条件表示
 * takeout_url が存在する場合のみ表示
 */

export const TakeoutSection = ({
  takeoutUrl,
  storeName,
  deliveryInfo,
  compact = false,
}) => {
  // takeout_url が無ければ表示しない
  if (!takeoutUrl) return null;

  const handleClick = () => {
    window.open(takeoutUrl, "_blank", "noopener,noreferrer");
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-200 transition-colors"
      >
        <ShoppingBag size={16} />
        お取り寄せ
        <ExternalLink size={12} />
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 border border-emerald-100">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
          <ShoppingBag size={28} className="text-emerald-600" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="font-bold text-lg text-emerald-800 mb-1">
            オンラインショップ
          </h3>
          <p className="text-sm text-slate-600 mb-3">
            {storeName ? `${storeName}の商品を` : "このお店の商品を"}
            ご自宅でお楽しみいただけます
          </p>

          {/* Delivery Info */}
          {deliveryInfo && (
            <div className="flex flex-wrap gap-2 mb-3">
              {deliveryInfo.shipping && (
                <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs text-slate-600">
                  <Truck size={12} className="text-emerald-500" />
                  {deliveryInfo.shipping}
                </div>
              )}
              {deliveryInfo.leadTime && (
                <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs text-slate-600">
                  <Clock size={12} className="text-emerald-500" />
                  {deliveryInfo.leadTime}
                </div>
              )}
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={handleClick}
            className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag size={18} />
            オンラインショップを見る
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* URL Preview */}
      <div className="mt-3 px-3 py-2 bg-white/50 rounded-lg">
        <p className="text-xs text-slate-400 truncate">{takeoutUrl}</p>
      </div>
    </div>
  );
};

export default TakeoutSection;
