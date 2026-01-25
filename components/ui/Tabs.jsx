"use client";

import React, { useState } from "react";

/**
 * 共通タブ・セグメントコンポーネント（92件改善 Phase5）
 * 5.32-5.34 UX改善: ナビゲーションコンポーネント
 */

export const Tabs = ({
  tabs, // [{ id, label, icon?, content }]
  defaultTab,
  onChange,
  variant = "default", // 'default' | 'pills' | 'underline'
  fullWidth = false,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleChange = (id) => {
    setActiveTab(id);
    onChange?.(id);
  };

  const variantClasses = {
    default: {
      container: "bg-slate-100 p-1 rounded-xl",
      tab: "px-4 py-2 rounded-lg text-sm font-bold transition-colors",
      active: "bg-white text-slate-800 shadow-sm",
      inactive: "text-slate-500 hover:text-slate-700",
    },
    pills: {
      container: "flex gap-2",
      tab: "px-4 py-2 rounded-full text-sm font-bold transition-colors",
      active: "bg-orange-500 text-white",
      inactive: "bg-slate-100 text-slate-600 hover:bg-slate-200",
    },
    underline: {
      container: "border-b border-slate-200",
      tab: "px-4 py-3 text-sm font-bold border-b-2 -mb-[1px] transition-colors",
      active: "border-orange-500 text-orange-600",
      inactive: "border-transparent text-slate-500 hover:text-slate-700",
    },
  };

  const styles = variantClasses[variant];

  return (
    <div>
      <div className={`flex ${fullWidth ? "w-full" : ""} ${styles.container}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleChange(tab.id)}
            className={`
                            ${styles.tab}
                            ${activeTab === tab.id ? styles.active : styles.inactive}
                            ${fullWidth ? "flex-1" : ""}
                            flex items-center justify-center gap-2
                        `}
          >
            {tab.icon && <tab.icon size={16} />}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
};

// セグメントコントロール
export const SegmentControl = ({
  options, // [{ value, label }]
  value,
  onChange,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "text-xs py-1.5",
    md: "text-sm py-2",
    lg: "text-base py-2.5",
  };

  return (
    <div className="inline-flex bg-slate-100 p-1 rounded-xl">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange?.(option.value)}
          className={`
                        px-4 ${sizeClasses[size]} rounded-lg font-bold transition-all flex-1
                        ${
                          value === option.value
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }
                    `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

// チップ（タグ）
export const Chip = ({
  children,
  selected = false,
  onClick,
  onRemove,
  variant = "default", // 'default' | 'outline'
  size = "md",
}) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const variantClasses = {
    default: selected
      ? "bg-orange-500 text-white"
      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
    outline: selected
      ? "border-2 border-orange-500 text-orange-600 bg-orange-50"
      : "border-2 border-slate-200 text-slate-600 hover:border-slate-300",
  };

  return (
    <button
      onClick={onClick}
      className={`
                inline-flex items-center gap-1 rounded-full font-bold transition-colors
                ${sizeClasses[size]}
                ${variantClasses[variant]}
            `}
    >
      {children}
      {onRemove && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:text-red-500"
        >
          ×
        </span>
      )}
    </button>
  );
};

export default { Tabs, SegmentControl, Chip };
