"use client";

import React, { useState, useEffect } from "react";
import { Check, MapPin } from "lucide-react";

/**
 * 訪問済みマーカーシステム（92件改善 Phase3）
 * 3.18 訪問済みマーカー実装
 */

// localStorage キー
const VISITED_KEY = "visited_restaurants";

export const useVisited = () => {
  const [visited, setVisited] = useState(new Set());

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(VISITED_KEY);
      if (saved) {
        setVisited(new Set(JSON.parse(saved)));
      }
    }
  }, []);

  const markVisited = (restaurantId) => {
    const newVisited = new Set(visited);
    newVisited.add(restaurantId);
    setVisited(newVisited);
    if (typeof window !== "undefined") {
      localStorage.setItem(VISITED_KEY, JSON.stringify([...newVisited]));
    }
  };

  const unmarkVisited = (restaurantId) => {
    const newVisited = new Set(visited);
    newVisited.delete(restaurantId);
    setVisited(newVisited);
    if (typeof window !== "undefined") {
      localStorage.setItem(VISITED_KEY, JSON.stringify([...newVisited]));
    }
  };

  const isVisited = (restaurantId) => visited.has(restaurantId);

  return { visited, markVisited, unmarkVisited, isVisited };
};

// 訪問済みボタン
export const VisitedButton = ({ restaurantId, variant = "button" }) => {
  const { isVisited, markVisited, unmarkVisited } = useVisited();
  const visited = isVisited(restaurantId);

  const toggle = () => {
    if (visited) {
      unmarkVisited(restaurantId);
    } else {
      markVisited(restaurantId);
    }
  };

  if (variant === "badge") {
    return visited ? (
      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
        <Check size={12} /> 訪問済み
      </div>
    ) : null;
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
        visited
          ? "bg-green-100 text-green-700 border border-green-200"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
      }`}
    >
      {visited ? (
        <>
          <Check size={16} /> 訪問済み
        </>
      ) : (
        <>
          <MapPin size={16} /> 訪問済みにする
        </>
      )}
    </button>
  );
};

// 訪問済みバッジ（リストカード用）
export const VisitedBadge = ({ restaurantId }) => {
  const { isVisited } = useVisited();

  if (!isVisited(restaurantId)) return null;

  return (
    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded-full text-[10px] font-bold shadow-lg">
      <Check size={10} /> 訪問済
    </div>
  );
};

export default VisitedButton;
