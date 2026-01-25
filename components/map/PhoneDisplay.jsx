"use client";

import React from "react";
import { Phone, Copy, Check } from "lucide-react";
import { useState } from "react";

/**
 * 電話番号表示コンポーネント（92件改善 Phase3）
 * 3.6 電話番号表示追加
 */

export const PhoneDisplay = ({ phone, variant = "inline" }) => {
  const [copied, setCopied] = useState(false);

  if (!phone) return null;

  // 電話番号の整形
  const formatPhone = (num) => {
    const cleaned = num.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    } else if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
    }
    return num;
  };

  const handleCall = () => {
    window.location.href = `tel:${phone.replace(/\D/g, "")}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed");
    }
  };

  if (variant === "button") {
    return (
      <button
        onClick={handleCall}
        className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors"
      >
        <Phone size={18} />
        電話する
      </button>
    );
  }

  if (variant === "card") {
    return (
      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Phone size={18} className="text-emerald-600" />
            </div>
            <div>
              <div className="text-xs text-emerald-600 font-bold">電話番号</div>
              <div className="text-lg font-bold text-slate-800">
                {formatPhone(phone)}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 border border-slate-200 hover:border-emerald-300 transition-colors"
              title="コピー"
            >
              {copied ? (
                <Check size={18} className="text-green-500" />
              ) : (
                <Copy size={18} />
              )}
            </button>
            <button
              onClick={handleCall}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors flex items-center gap-1"
            >
              <Phone size={16} /> 電話
            </button>
          </div>
        </div>
      </div>
    );
  }

  // inline variant
  return (
    <a
      href={`tel:${phone.replace(/\D/g, "")}`}
      className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
    >
      <Phone size={14} />
      {formatPhone(phone)}
    </a>
  );
};

export default PhoneDisplay;
