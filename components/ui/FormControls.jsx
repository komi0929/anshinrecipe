"use client";

import React from "react";
import { Check, ChevronDown } from "lucide-react";

/**
 * セレクト・スイッチ・バッジコンポーネント（92件改善 Phase5）
 * 5.84-5.87 フォームコンポーネント追加
 */

// カスタムセレクト
export const Select = ({
  options = [],
  value,
  onChange,
  placeholder = "選択してください",
  label,
  error,
  className = "",
}) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-bold text-slate-700 mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full px-4 py-3 bg-white border rounded-xl text-left text-sm flex items-center justify-between transition-all ${
          error
            ? "border-red-300 focus:border-red-400"
            : open
              ? "border-orange-300 ring-2 ring-orange-100"
              : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <span className={selectedOption ? "text-slate-800" : "text-slate-400"}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange?.(option.value);
                setOpen(false);
              }}
              className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-slate-50 ${
                value === option.value
                  ? "text-orange-600 font-bold"
                  : "text-slate-700"
              }`}
            >
              {option.label}
              {value === option.value && (
                <Check size={16} className="text-orange-500" />
              )}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

// トグルスイッチ
export const Switch = ({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  size = "md",
}) => {
  const sizeClasses = {
    sm: { track: "w-8 h-4", thumb: "w-3 h-3", translate: "translate-x-4" },
    md: { track: "w-11 h-6", thumb: "w-5 h-5", translate: "translate-x-5" },
    lg: { track: "w-14 h-8", thumb: "w-6 h-6", translate: "translate-x-6" },
  };

  const sizes = sizeClasses[size];

  return (
    <label
      className={`flex items-center gap-3 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`${sizes.track} rounded-full transition-colors ${
            checked ? "bg-orange-500" : "bg-slate-300"
          }`}
        />
        <div
          className={`absolute top-0.5 left-0.5 ${sizes.thumb} bg-white rounded-full shadow transition-transform ${
            checked ? sizes.translate : "translate-x-0"
          }`}
        />
      </div>
      {(label || description) && (
        <div>
          {label && <span className="font-medium text-slate-700">{label}</span>}
          {description && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
        </div>
      )}
    </label>
  );
};

// バッジ
export const Badge = ({
  children,
  variant = "default", // 'default' | 'success' | 'warning' | 'danger' | 'info'
  size = "md",
  dot = false,
  className = "",
}) => {
  const variantClasses = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    primary: "bg-orange-100 text-orange-700",
  };

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-3 py-1",
  };

  if (dot) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} ${variantClasses[variant]} rounded-full font-bold ${className}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === "success"
              ? "bg-green-500"
              : variant === "warning"
                ? "bg-amber-500"
                : variant === "danger"
                  ? "bg-red-500"
                  : variant === "info"
                    ? "bg-blue-500"
                    : "bg-slate-500"
          }`}
        />
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-block ${sizeClasses[size]} ${variantClasses[variant]} rounded-full font-bold ${className}`}
    >
      {children}
    </span>
  );
};

export default { Select, Switch, Badge };
