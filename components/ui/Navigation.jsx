"use client";

import React from "react";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

/**
 * パンくずリストコンポーネント（92件改善 Phase5）
 * 5.76-5.77 ナビゲーション改善
 */

export const Breadcrumb = ({ items = [], className = "" }) => {
  return (
    <nav
      aria-label="パンくずリスト"
      className={`flex items-center text-sm ${className}`}
    >
      <ol className="flex items-center gap-1 flex-wrap">
        <li>
          <Link
            href="/"
            className="flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Home size={14} />
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center">
            <ChevronRight size={14} className="text-slate-300 mx-1" />
            {i === items.length - 1 ? (
              <span className="text-slate-700 font-medium truncate max-w-[150px]">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-slate-400 hover:text-slate-600 transition-colors truncate max-w-[150px]"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// ステップインジケータ
export const StepIndicator = ({
  steps = [],
  currentStep = 0,
  variant = "dots", // 'dots' | 'numbers' | 'progress'
}) => {
  if (variant === "progress") {
    const progress = ((currentStep + 1) / steps.length) * 100;
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-500">
          <span>
            ステップ {currentStep + 1} / {steps.length}
          </span>
          <span>{steps[currentStep]}</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (variant === "numbers") {
    return (
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                i < currentStep
                  ? "bg-green-500 text-white"
                  : i === currentStep
                    ? "bg-orange-500 text-white"
                    : "bg-slate-200 text-slate-400"
              }`}
            >
              {i < currentStep ? "✓" : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-1 ${
                  i < currentStep ? "bg-green-500" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  // dots variant
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all ${
            i === currentStep ? "w-6 h-2 bg-orange-500" : "w-2 h-2 bg-slate-300"
          }`}
        />
      ))}
    </div>
  );
};

// ページネーション
export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirst = true,
  showLast = true,
  maxVisible = 5,
}) => {
  const pages = [];
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1">
      {showFirst && currentPage > 1 && (
        <button
          onClick={() => onPageChange(1)}
          className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
        >
          «
        </button>
      )}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 flex items-center justify-center"
      >
        ‹
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-10 h-10 rounded-lg font-bold flex items-center justify-center ${
            page === currentPage
              ? "bg-orange-500 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 flex items-center justify-center"
      >
        ›
      </button>
      {showLast && currentPage < totalPages && (
        <button
          onClick={() => onPageChange(totalPages)}
          className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
        >
          »
        </button>
      )}
    </div>
  );
};

export default { Breadcrumb, StepIndicator, Pagination };
