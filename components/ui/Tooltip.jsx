"use client";

import React, { useState, useRef, useEffect } from "react";
import { Copy, Check, ExternalLink, Link2 } from "lucide-react";

/**
 * ツールチップ・コピーコンポーネント（92件改善 Phase5）
 * 5.92 ツールチップ・クリップボード
 */

// ツールチップ
export const Tooltip = ({
  children,
  content,
  position = "top", // 'top' | 'bottom' | 'left' | 'right'
  delay = 300,
}) => {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setShow(true), delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShow(false);
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {show && (
        <div
          className={`absolute ${positionClasses[position]} z-50 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap animate-fadeIn`}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
};

// コピーボタン
export const CopyButton = ({
  text,
  label = "コピー",
  variant = "icon", // 'icon' | 'button' | 'inline'
  onCopy,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (variant === "inline") {
    return (
      <span
        onClick={handleCopy}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-600 cursor-pointer hover:bg-slate-200 ${className}`}
      >
        {text}
        {copied ? (
          <Check size={12} className="text-green-500" />
        ) : (
          <Copy size={12} />
        )}
      </span>
    );
  }

  if (variant === "button") {
    return (
      <button
        onClick={handleCopy}
        className={`flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors ${className}`}
      >
        {copied ? (
          <>
            <Check size={16} className="text-green-500" />
            コピーしました
          </>
        ) : (
          <>
            <Copy size={16} />
            {label}
          </>
        )}
      </button>
    );
  }

  // icon variant
  return (
    <Tooltip content={copied ? "コピーしました" : label}>
      <button
        onClick={handleCopy}
        className={`p-2 rounded-lg hover:bg-slate-100 transition-colors ${className}`}
      >
        {copied ? (
          <Check size={18} className="text-green-500" />
        ) : (
          <Copy size={18} className="text-slate-500" />
        )}
      </button>
    </Tooltip>
  );
};

// URL共有（短縮表示付き）
export const ShareableLink = ({ url, label, className = "" }) => {
  const displayUrl = url.replace(/^https?:\/\//, "").slice(0, 30);

  return (
    <div
      className={`flex items-center gap-2 p-2 bg-slate-50 rounded-xl ${className}`}
    >
      <Link2 size={16} className="text-slate-400 flex-shrink-0" />
      <span className="flex-1 text-sm text-slate-600 truncate" title={url}>
        {displayUrl}...
      </span>
      <CopyButton text={url} variant="icon" />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1 hover:bg-slate-200 rounded-lg"
      >
        <ExternalLink size={16} className="text-slate-500" />
      </a>
    </div>
  );
};

export default { Tooltip, CopyButton, ShareableLink };
