"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, MapPin, Clock, TrendingUp, History } from "lucide-react";

/**
 * 検索サジェストコンポーネント（92件改善 Phase4）
 * 4.12 検索サジェスト実装
 */

// よく検索されるキーワード（仮データ）
const POPULAR_SEARCHES = [
  { text: "卵不使用", category: "allergy" },
  { text: "乳製品不使用", category: "allergy" },
  { text: "キッズチェアあり", category: "facility" },
  { text: "ファミレス", category: "genre" },
  { text: "回転寿司", category: "genre" },
];

export const SearchSuggest = ({
  value,
  onChange,
  onSearch,
  suggestions = [],
  recentSearches = [],
  onSelectSuggestion,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [localRecent, setLocalRecent] = useState([]);
  const inputRef = useRef(null);

  // ローカルストレージから検索履歴を取得
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("search_history");
      if (saved) {
        setLocalRecent(JSON.parse(saved).slice(0, 5));
      }
    }
  }, []);

  // 検索履歴を保存
  const saveSearch = (query) => {
    if (!query.trim()) return;
    const history = [query, ...localRecent.filter((h) => h !== query)].slice(
      0,
      10,
    );
    setLocalRecent(history);
    if (typeof window !== "undefined") {
      localStorage.setItem("search_history", JSON.stringify(history));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      saveSearch(value.trim());
      onSearch?.(value.trim());
      setShowDropdown(false);
    }
  };

  const handleSelect = (text) => {
    onChange?.(text);
    saveSearch(text);
    onSearch?.(text);
    setShowDropdown(false);
  };

  const clearHistory = () => {
    setLocalRecent([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("search_history");
    }
  };

  const displayRecent =
    recentSearches.length > 0 ? recentSearches : localRecent;

  return (
    <div className="relative">
      {/* Search Input */}
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder="店名・エリア・アレルゲンで検索..."
            className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 shadow-sm"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange?.("");
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-50"
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Suggestions (from API) */}
          {suggestions.length > 0 && value && (
            <div className="p-2">
              {suggestions.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(item.name || item)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-left"
                >
                  <MapPin size={16} className="text-orange-500" />
                  <span className="text-sm text-slate-700">
                    {item.name || item}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {displayRecent.length > 0 && !value && (
            <div className="p-2 border-b border-slate-100">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <History size={12} /> 最近の検索
                </span>
                <button
                  onClick={clearHistory}
                  className="text-xs text-orange-500 hover:underline"
                >
                  クリア
                </button>
              </div>
              {displayRecent.map((search, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(search)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-left"
                >
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-700">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Popular Searches */}
          {!value && (
            <div className="p-2">
              <div className="px-3 py-2">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <TrendingUp size={12} /> 人気のキーワード
                </span>
              </div>
              <div className="flex flex-wrap gap-2 px-3 pb-2">
                {POPULAR_SEARCHES.map((search, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(search.text)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-bold text-slate-600 transition-colors"
                  >
                    {search.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Close */}
          <button
            onClick={() => setShowDropdown(false)}
            className="w-full p-3 text-center text-xs text-slate-400 hover:bg-slate-50 border-t border-slate-100"
          >
            閉じる
          </button>
        </div>
      )}

      {/* Backdrop */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default SearchSuggest;
