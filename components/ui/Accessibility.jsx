"use client";

import React from "react";

/**
 * アクセシビリティ改善コンポーネント（92件改善 Phase5）
 * 5.38-5.42 アクセシビリティ改善
 */

// スキップリンク（キーボードナビゲーション用）
export const SkipLink = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-orange-500 focus:text-white focus:rounded-lg focus:font-bold"
  >
    メインコンテンツへスキップ
  </a>
);

// ビジュアリーヒドゥン（スクリーンリーダー専用テキスト）
export const VisuallyHidden = ({ children, as: Component = "span" }) => (
  <Component className="sr-only">{children}</Component>
);

// フォーカストラップ（モーダル用）
export const FocusTrap = ({ children, active = true }) => {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeydown = (e) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeydown);
    firstElement?.focus();

    return () => container.removeEventListener("keydown", handleKeydown);
  }, [active]);

  return <div ref={containerRef}>{children}</div>;
};

// アナウンスメント（スクリーンリーダー用ライブリージョン）
export const LiveRegion = ({ message, type = "polite" }) => (
  <div role="status" aria-live={type} aria-atomic="true" className="sr-only">
    {message}
  </div>
);

// 必須フィールドラベル
export const RequiredLabel = ({ children, htmlFor, required = false }) => (
  <label
    htmlFor={htmlFor}
    className="block text-sm font-bold text-slate-700 mb-1"
  >
    {children}
    {required && (
      <span className="text-red-500 ml-1" aria-hidden="true">
        *
      </span>
    )}
    {required && <VisuallyHidden>（必須）</VisuallyHidden>}
  </label>
);

// エラーメッセージ
export const FormError = ({ id, children }) => (
  <p
    id={id}
    role="alert"
    className="text-xs text-red-500 mt-1 flex items-center gap-1"
  >
    <span aria-hidden="true">⚠️</span>
    {children}
  </p>
);

// プログレスバー（アクセシブル）
export const ProgressBar = ({ value, max = 100, label }) => (
  <div className="space-y-1">
    {label && (
      <span className="text-xs font-medium text-slate-600">{label}</span>
    )}
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label || `進捗: ${Math.round((value / max) * 100)}%`}
      className="h-2 bg-slate-200 rounded-full overflow-hidden"
    >
      <div
        className="h-full bg-orange-500 rounded-full transition-all duration-300"
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  </div>
);

// アクセシブルアイコンボタン
export const IconButtonA11y = ({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  className = "",
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className={`p-2 rounded-lg transition-colors hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    <Icon size={20} aria-hidden="true" />
  </button>
);

export default {
  SkipLink,
  VisuallyHidden,
  FocusTrap,
  LiveRegion,
  RequiredLabel,
  FormError,
  ProgressBar,
  IconButtonA11y,
};
