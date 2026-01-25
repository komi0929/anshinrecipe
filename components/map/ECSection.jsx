"use client";

import React from "react";
import {
  ShoppingBag,
  Package,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

/**
 * EC・お取り寄せ改善コンポーネント（92件改善 Phase3）
 * 3.15-3.16 お取り寄せ機能強化
 */

// ECリンクカード
export const ECLinkCard = ({ product, onTrack }) => {
  const statusConfig = {
    available: {
      icon: CheckCircle,
      color: "text-green-500",
      label: "在庫あり",
    },
    limited: {
      icon: AlertCircle,
      color: "text-amber-500",
      label: "残りわずか",
    },
    unavailable: {
      icon: AlertCircle,
      color: "text-red-500",
      label: "在庫切れ",
    },
  };

  const status = statusConfig[product.status] || statusConfig.available;
  const StatusIcon = status.icon;

  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onTrack?.(product)}
      className="block bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="flex">
        {/* 画像 */}
        <div className="w-24 h-24 flex-shrink-0 bg-slate-100">
          {product.image ? (
            <img
              src={product.image}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">
              📦
            </div>
          )}
        </div>

        {/* 情報 */}
        <div className="flex-1 p-3">
          <div className="flex items-start justify-between">
            <h4 className="font-bold text-sm text-slate-800 line-clamp-2 flex-1">
              {product.name}
            </h4>
            <ExternalLink
              size={14}
              className="text-slate-400 flex-shrink-0 ml-2"
            />
          </div>

          <div className="flex items-center gap-2 mt-1">
            <StatusIcon size={12} className={status.color} />
            <span className={`text-xs ${status.color}`}>{status.label}</span>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="font-bold text-orange-600">
              ¥{product.price?.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-100 rounded">
              {product.platform}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
};

// お取り寄せセクション強化版
export const EnhancedTakeoutSection = ({
  products = [],
  restaurant,
  onTrack,
}) => {
  if (!products.length) return null;

  // プラットフォーム別にグループ化
  const grouped = products.reduce((acc, p) => {
    const platform = p.platform || "その他";
    if (!acc[platform]) acc[platform] = [];
    acc[platform].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShoppingBag size={20} className="text-orange-500" />
        <h3 className="font-bold text-slate-800">お取り寄せ・通販</h3>
      </div>

      {/* アレルギー対応注意 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <strong>ご注意：</strong>
            お取り寄せ商品のアレルギー情報は、商品ページで必ずご確認ください。
          </div>
        </div>
      </div>

      {/* プラットフォーム別表示 */}
      {Object.entries(grouped).map(([platform, items]) => (
        <div key={platform} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
              {platform}
            </span>
            <span className="text-xs text-slate-400">{items.length}件</span>
          </div>
          <div className="space-y-2">
            {items.map((product, i) => (
              <ECLinkCard key={i} product={product} onTrack={onTrack} />
            ))}
          </div>
        </div>
      ))}

      {/* 配送情報 */}
      <div className="bg-slate-50 rounded-xl p-3">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Truck size={14} />
            <span>配送料別</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>2-5日でお届け</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default { ECLinkCard, EnhancedTakeoutSection };
