"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  X,
  SlidersHorizontal,
} from "lucide-react";

/**
 * 管理画面用フィルター・検索コンポーネント（92件改善 Phase2）
 * 2.10-2.11 管理画面フィルター
 */

// 検索バー
export const AdminSearchBar = ({
  value,
  onChange,
  placeholder = "店舗名、住所で検索...",
  onClear,
}) => {
  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

// フィルターチップ
export const FilterChip = ({ label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 ${
      active
        ? "bg-orange-500 text-white"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    }`}
  >
    {label}
    {count !== undefined && (
      <span
        className={`px-1.5 py-0.5 rounded-full text-[10px] ${
          active ? "bg-white/20" : "bg-slate-200"
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

// ステータスフィルター
export const StatusFilter = ({ statuses = [], selected, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      <FilterChip
        label="すべて"
        active={!selected}
        onClick={() => onChange?.(null)}
      />
      {statuses.map((status) => (
        <FilterChip
          key={status.value}
          label={status.label}
          active={selected === status.value}
          onClick={() => onChange?.(status.value)}
          count={status.count}
        />
      ))}
    </div>
  );
};

// 高度なフィルターパネル
export const AdvancedFilterPanel = ({
  filters,
  onChange,
  onReset,
  open,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <SlidersHorizontal size={18} />
          詳細フィルター
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
        >
          <X size={18} />
        </button>
      </div>

      {/* 都道府県 */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-2">
          都道府県
        </label>
        <select
          value={filters.prefecture || ""}
          onChange={(e) =>
            onChange?.({ ...filters, prefecture: e.target.value })
          }
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
        >
          <option value="">すべて</option>
          <option value="東京都">東京都</option>
          <option value="大阪府">大阪府</option>
          <option value="神奈川県">神奈川県</option>
          {/* 他の都道府県 */}
        </select>
      </div>

      {/* ソース */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-2">
          データソース
        </label>
        <div className="flex flex-wrap gap-2">
          {["公式", "GoogleMaps", "ユーザー投稿", "ぐるなび"].map((source) => (
            <FilterChip
              key={source}
              label={source}
              active={filters.source === source}
              onClick={() =>
                onChange?.({
                  ...filters,
                  source: filters.source === source ? null : source,
                })
              }
            />
          ))}
        </div>
      </div>

      {/* 評価 */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-2">
          最低評価
        </label>
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={filters.minRating || 0}
          onChange={(e) =>
            onChange?.({ ...filters, minRating: parseFloat(e.target.value) })
          }
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>すべて</span>
          <span>{filters.minRating || 0}以上</span>
        </div>
      </div>

      {/* アクション */}
      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={onReset}
          className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold"
        >
          リセット
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold"
        >
          適用
        </button>
      </div>
    </div>
  );
};

// ソート選択
export const SortSelect = ({ value, onChange, options = [] }) => {
  const defaultOptions = [
    { value: "created_desc", label: "新しい順" },
    { value: "created_asc", label: "古い順" },
    { value: "name_asc", label: "名前順" },
    { value: "rating_desc", label: "評価順" },
  ];

  const allOptions = options.length > 0 ? options : defaultOptions;

  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
    >
      {allOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default {
  AdminSearchBar,
  FilterChip,
  StatusFilter,
  AdvancedFilterPanel,
  SortSelect,
};
