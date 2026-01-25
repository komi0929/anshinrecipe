"use client";

import React, { useState } from "react";
import {
  Utensils,
  ChevronDown,
  AlertTriangle,
  Check,
  X,
  Tag,
  ExternalLink,
} from "lucide-react";

/**
 * メニュー詳細表示コンポーネント（92件改善 Phase3）
 * 3.11 メニューカード詳細表示実装
 */

// 4大アレルゲン
const MAJOR_ALLERGENS = ["egg", "milk", "wheat", "peanut"];
const ALLERGEN_LABELS = {
  egg: "卵",
  milk: "乳",
  wheat: "小麦",
  peanut: "落花生",
  shrimp: "えび",
  crab: "かに",
  soba: "そば",
};
const ALLERGEN_EMOJIS = {
  egg: "🥚",
  milk: "🥛",
  wheat: "🌾",
  peanut: "🥜",
};

export const MenuCard = ({ menu, onSelect, selected = false }) => {
  const [expanded, setExpanded] = useState(false);

  const {
    name,
    price,
    description,
    image_url,
    allergens_contained = [],
    allergens_removable = [],
    source,
    source_url,
  } = menu;

  // 4大アレルゲン判定
  const containsMajor = allergens_contained.some((a) =>
    MAJOR_ALLERGENS.includes(a),
  );
  const removableMajor = allergens_removable.filter((a) =>
    MAJOR_ALLERGENS.includes(a),
  );

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden transition-all ${
        selected
          ? "border-orange-400 ring-2 ring-orange-200"
          : "border-slate-100 hover:border-slate-200"
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start gap-3 text-left"
      >
        {/* Image */}
        {image_url && (
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
            <img
              src={image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-800 text-sm leading-tight">
              {name}
            </h3>
            <span className="text-sm font-bold text-orange-600 flex-shrink-0">
              ¥{price?.toLocaleString()}
            </span>
          </div>

          {/* Allergen Status */}
          <div className="flex flex-wrap gap-1 mt-2">
            {MAJOR_ALLERGENS.map((allergen) => {
              const contained = allergens_contained.includes(allergen);
              const removable = allergens_removable.includes(allergen);

              return (
                <div
                  key={allergen}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 ${
                    removable
                      ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                      : contained
                        ? "bg-red-100 text-red-600 border border-red-200"
                        : "bg-green-100 text-green-600 border border-green-200"
                  }`}
                >
                  {ALLERGEN_EMOJIS[allergen]}
                  {removable ? "除去可" : contained ? "含む" : "なし"}
                </div>
              );
            })}
          </div>

          {/* Expand Indicator */}
          <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
            <ChevronDown
              size={12}
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            />
            詳細を見る
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 animate-fadeIn">
          {/* Description */}
          {description && (
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              {description}
            </p>
          )}

          {/* Allergen Details */}
          <div className="mt-3 space-y-2">
            {allergens_contained.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <X size={14} className="text-red-500 mt-0.5" />
                <div>
                  <span className="font-bold text-red-600">
                    含まれるアレルゲン:
                  </span>
                  <span className="text-slate-600 ml-1">
                    {allergens_contained
                      .map((a) => ALLERGEN_LABELS[a] || a)
                      .join("、")}
                  </span>
                </div>
              </div>
            )}

            {allergens_removable.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <Check size={14} className="text-yellow-600 mt-0.5" />
                <div>
                  <span className="font-bold text-yellow-700">除去可能:</span>
                  <span className="text-slate-600 ml-1">
                    {allergens_removable
                      .map((a) => ALLERGEN_LABELS[a] || a)
                      .join("、")}
                  </span>
                </div>
              </div>
            )}

            {allergens_contained.length === 0 &&
              allergens_removable.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check size={14} />
                  <span className="font-bold">
                    アレルゲン情報なし（詳細は店舗に確認）
                  </span>
                </div>
              )}
          </div>

          {/* Source */}
          {source && (
            <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
              <Tag size={10} />
              <span>情報源: {source}</span>
              {source_url && (
                <a
                  href={source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline flex items-center gap-0.5"
                >
                  参照元 <ExternalLink size={8} />
                </a>
              )}
            </div>
          )}

          {/* Select Button */}
          {onSelect && (
            <button
              onClick={() => onSelect(menu)}
              className={`mt-4 w-full py-2 rounded-xl font-bold text-sm transition-colors ${
                selected
                  ? "bg-orange-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {selected ? "選択中" : "選択する"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// メニューリストコンポーネント
export const MenuList = ({ menus = [], onSelect, selectedIds = [] }) => {
  if (menus.length === 0) {
    return (
      <div className="bg-slate-50 rounded-2xl p-8 text-center border border-dashed border-slate-200">
        <Utensils size={32} className="text-slate-300 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">メニュー情報はまだありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {menus.map((menu, i) => (
        <MenuCard
          key={menu.id || i}
          menu={menu}
          onSelect={onSelect}
          selected={selectedIds.includes(menu.id || i)}
        />
      ))}
    </div>
  );
};

export default MenuList;
