"use client";

import React, { useState, useMemo } from "react";
import { Filter, X, Check } from "lucide-react";

/**
 * MenuGalleryカテゴリフィルタ（92件改善 Phase3）
 * 3.14 MenuGalleryカテゴリフィルタ実装
 */

// カテゴリ定義
const MENU_CATEGORIES = [
  { id: "all", label: "すべて", icon: "🍽️" },
  { id: "main", label: "メイン", icon: "🍖" },
  { id: "side", label: "サイド", icon: "🥗" },
  { id: "dessert", label: "デザート", icon: "🍰" },
  { id: "drink", label: "ドリンク", icon: "🥤" },
  { id: "kids", label: "キッズ", icon: "👶" },
];

// アレルゲンフィルタ
const ALLERGEN_FILTERS = [
  { id: "egg_free", label: "卵不使用", icon: "🥚❌" },
  { id: "milk_free", label: "乳不使用", icon: "🥛❌" },
  { id: "wheat_free", label: "小麦不使用", icon: "🌾❌" },
  { id: "peanut_free", label: "落花生不使用", icon: "🥜❌" },
];

export const MenuFilter = ({
  menus = [],
  onFilter,
  showAllergenFilter = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // フィルタ適用
  const filteredMenus = useMemo(() => {
    let result = [...menus];

    // カテゴリフィルタ
    if (selectedCategory !== "all") {
      result = result.filter((m) => m.category === selectedCategory);
    }

    // アレルゲンフィルタ
    if (selectedAllergens.length > 0) {
      result = result.filter((menu) => {
        return selectedAllergens.every((filter) => {
          const allergen = filter.replace("_free", "");
          return !menu.allergens_contained?.includes(allergen);
        });
      });
    }

    return result;
  }, [menus, selectedCategory, selectedAllergens]);

  // フィルタ変更時にコールバック
  React.useEffect(() => {
    onFilter?.(filteredMenus);
  }, [filteredMenus]);

  const toggleAllergen = (id) => {
    setSelectedAllergens((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedAllergens([]);
  };

  const hasActiveFilters =
    selectedCategory !== "all" || selectedAllergens.length > 0;

  return (
    <div className="space-y-3">
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {MENU_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Filter Toggle & Active Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
            >
              <X size={12} /> クリア
            </button>
          )}
          {selectedAllergens.map((id) => {
            const filter = ALLERGEN_FILTERS.find((f) => f.id === id);
            return (
              <span
                key={id}
                className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1"
              >
                {filter?.label}
                <button onClick={() => toggleAllergen(id)}>
                  <X size={10} />
                </button>
              </span>
            );
          })}
        </div>

        {showAllergenFilter && (
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
              showFilterPanel
                ? "bg-orange-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Filter size={14} />
            アレルゲン
            {selectedAllergens.length > 0 && (
              <span className="ml-1 w-5 h-5 bg-white text-orange-500 rounded-full text-xs flex items-center justify-center">
                {selectedAllergens.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Allergen Filter Panel */}
      {showFilterPanel && (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 animate-fadeIn">
          <h4 className="font-bold text-sm text-slate-700 mb-3">
            アレルゲンで絞り込み
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {ALLERGEN_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => toggleAllergen(filter.id)}
                className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold transition-colors ${
                  selectedAllergens.includes(filter.id)
                    ? "bg-green-500 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-green-300"
                }`}
              >
                <span>{filter.icon}</span>
                {filter.label}
                {selectedAllergens.includes(filter.id) && (
                  <Check size={14} className="ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-xs text-slate-400">
        {filteredMenus.length} / {menus.length} 件のメニュー
      </div>
    </div>
  );
};

export default MenuFilter;
