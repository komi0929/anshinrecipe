"use client";

import React from "react";
import { ShieldCheck, AlertTriangle, Check, HelpCircle } from "lucide-react";

/**
 * 4大アレルゲンバッジコンポーネント（92件改善 Phase2）
 * 2.7 プレビューに4大アレルゲンバッジ追加
 */

// 4大アレルゲン定義
const MAJOR_ALLERGENS = [
  { id: "egg", label: "卵", emoji: "🥚", color: "amber" },
  { id: "milk", label: "乳", emoji: "🥛", color: "blue" },
  { id: "wheat", label: "小麦", emoji: "🌾", color: "yellow" },
  { id: "peanut", label: "落花生", emoji: "🥜", color: "orange" },
];

// 対応状況
const STATUS = {
  available: {
    label: "対応",
    icon: Check,
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
  },
  removable: {
    label: "除去可",
    icon: AlertTriangle,
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  unavailable: {
    label: "不可",
    icon: AlertTriangle,
    bg: "bg-red-100",
    text: "text-red-600",
    border: "border-red-200",
  },
  unknown: {
    label: "確認中",
    icon: HelpCircle,
    bg: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-200",
  },
};

export const AllergenBadges = ({
  allergenStatus = {},
  size = "md",
  showLabel = true,
  compact = false,
}) => {
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-lg",
    lg: "w-18 h-18 text-xl",
  };

  if (compact) {
    return (
      <div className="flex gap-1">
        {MAJOR_ALLERGENS.map((allergen) => {
          const status = allergenStatus[allergen.id] || "unknown";
          const statusInfo = STATUS[status];

          return (
            <div
              key={allergen.id}
              className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${statusInfo.bg} ${statusInfo.text} border ${statusInfo.border}`}
              title={`${allergen.label}: ${statusInfo.label}`}
            >
              <span>{allergen.emoji}</span>
              <span className="hidden sm:inline">{statusInfo.label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
      <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
        <ShieldCheck size={16} className="text-orange-500" />
        4大アレルゲン対応状況
      </h3>

      <div className="grid grid-cols-4 gap-2">
        {MAJOR_ALLERGENS.map((allergen) => {
          const status = allergenStatus[allergen.id] || "unknown";
          const statusInfo = STATUS[status];
          const Icon = statusInfo.icon;

          return (
            <div
              key={allergen.id}
              className={`${sizeClasses[size]} ${statusInfo.bg} ${statusInfo.border} border rounded-xl flex flex-col items-center justify-center`}
            >
              <span className="text-lg">{allergen.emoji}</span>
              {showLabel && (
                <>
                  <span className="text-[10px] font-bold text-slate-600">
                    {allergen.label}
                  </span>
                  <div
                    className={`flex items-center gap-0.5 text-[9px] font-bold ${statusInfo.text}`}
                  >
                    <Icon size={8} />
                    {statusInfo.label}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>対応可
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>除去可能
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-red-400 rounded-full"></span>対応不可
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-slate-300 rounded-full"></span>確認中
        </span>
      </div>
    </div>
  );
};

// シンプルなインラインバッジ（リストカード用）
export const AllergenInlineBadge = ({ allergenId, status }) => {
  const allergen = MAJOR_ALLERGENS.find((a) => a.id === allergenId);
  const statusInfo = STATUS[status] || STATUS.unknown;

  if (!allergen) return null;

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded ${statusInfo.bg} ${statusInfo.text} text-[10px] font-bold`}
    >
      {allergen.emoji}
      {statusInfo.label}
    </span>
  );
};

export default AllergenBadges;
