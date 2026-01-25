"use client";

import React, { useState } from "react";
import { Share2, Copy, Check, X, MessageCircle, Twitter } from "lucide-react";

/**
 * 共有機能コンポーネント（92件改善 Phase3: シェアボタン実装）
 * 3.1 シェアボタン実装
 * Web Share API対応 + フォールバック
 */
export const ShareButton = ({
  title,
  text,
  url,
  variant = "icon", // 'icon' | 'button' | 'card'
  className = "",
}) => {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const shareUrl =
    url || (typeof window !== "undefined" ? window.location.href : "");
  const shareTitle = title || "あんしんマップ";
  const shareText = text || `${shareTitle} - アレルギー対応のお店を見つけよう`;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } else {
        setShowModal(true);
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        setShowModal(true);
      }
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank");
  };

  const shareToLine = () => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
    window.open(lineUrl, "_blank");
  };

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={handleShare}
          className={`w-10 h-10 bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors shadow-lg ${className}`}
          aria-label="共有"
        >
          <Share2 size={18} />
        </button>
        {showModal && (
          <ShareModal
            onClose={() => setShowModal(false)}
            onCopy={copyToClipboard}
            copied={copied}
            onTwitter={shareToTwitter}
            onLine={shareToLine}
            url={shareUrl}
          />
        )}
      </>
    );
  }

  if (variant === "button") {
    return (
      <>
        <button
          onClick={handleShare}
          className={`flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-bold text-sm transition-colors ${className}`}
        >
          <Share2 size={16} />
          共有
        </button>
        {showModal && (
          <ShareModal
            onClose={() => setShowModal(false)}
            onCopy={copyToClipboard}
            copied={copied}
            onTwitter={shareToTwitter}
            onLine={shareToLine}
            url={shareUrl}
          />
        )}
      </>
    );
  }

  return null;
};

const ShareModal = ({ onClose, onCopy, copied, onTwitter, onLine, url }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-slate-800">共有</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-3">
        <button
          onClick={onCopy}
          className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
        >
          {copied ? (
            <Check size={20} className="text-green-500" />
          ) : (
            <Copy size={20} className="text-slate-500" />
          )}
          <span className="font-medium text-slate-700">
            {copied ? "コピーしました！" : "リンクをコピー"}
          </span>
        </button>

        <button
          onClick={onTwitter}
          className="w-full flex items-center gap-3 p-3 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors"
        >
          <Twitter size={20} className="text-sky-500" />
          <span className="font-medium text-sky-700">Xでシェア</span>
        </button>

        <button
          onClick={onLine}
          className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
        >
          <MessageCircle size={20} className="text-green-500" />
          <span className="font-medium text-green-700">LINEでシェア</span>
        </button>
      </div>

      <div className="mt-4 p-2 bg-slate-100 rounded-lg">
        <p className="text-xs text-slate-500 truncate">{url}</p>
      </div>
    </div>
  </div>
);

export default ShareButton;
