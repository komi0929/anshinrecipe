"use client";

import React, { useState } from "react";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";

/**
 * 営業時間詳細表示コンポーネント（92件改善 Phase3）
 * 3.5 営業時間詳細展開実装
 */

// 曜日ラベル
const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export const BusinessHours = ({ hours, compact = false }) => {
  const [expanded, setExpanded] = useState(false);

  if (!hours) return null;

  // 今日の曜日を取得
  const today = new Date().getDay();

  // 営業時間パース（簡易版）
  const parseHours = () => {
    // hours が配列の場合（Google Places形式）
    if (Array.isArray(hours)) {
      return hours.map((h, i) => ({
        day: i,
        label: DAY_LABELS[i],
        text: h || "定休日",
        isToday: i === today,
      }));
    }

    // hours がオブジェクトの場合
    if (typeof hours === "object") {
      return Object.entries(hours).map(([day, text], i) => ({
        day: i,
        label: day,
        text: text || "定休日",
        isToday: i === today,
      }));
    }

    // hours が文字列の場合
    if (typeof hours === "string") {
      return [{ day: -1, label: "営業時間", text: hours, isToday: false }];
    }

    return [];
  };

  const parsedHours = parseHours();
  const todayHours = parsedHours.find((h) => h.isToday);

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Clock size={14} className="text-orange-500" />
        <span>{todayHours?.text || "営業時間不明"}</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-orange-500" />
          <span className="font-bold text-sm text-slate-800">営業時間</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">
            今日:{" "}
            <span className="font-bold">{todayHours?.text || "不明"}</span>
          </span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && parsedHours.length > 0 && (
        <div className="mt-4 space-y-2 animate-fadeIn">
          {parsedHours.map((h, i) => (
            <div
              key={i}
              className={`flex justify-between py-2 px-3 rounded-xl text-sm ${
                h.isToday
                  ? "bg-orange-100 text-orange-700 font-bold"
                  : "bg-white text-slate-600"
              }`}
            >
              <span>{h.label}</span>
              <span>{h.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessHours;
