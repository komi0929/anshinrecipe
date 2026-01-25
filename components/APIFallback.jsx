"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Home, Server } from "lucide-react";
import Link from "next/link";

/**
 * APIエラーフォールバックコンポーネント（92件改善 Phase1）
 * 1.10 APIフォールバック対応
 */

// API呼び出しラッパー（リトライ付き）
export const fetchWithRetry = async (
  url,
  options = {},
  retries = 3,
  delay = 1000,
) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((r) => setTimeout(r, delay * (i + 1)));
    }
  }
};

// APIエラー表示コンポーネント
export const APIErrorFallback = ({
  error,
  onRetry,
  type = "inline", // 'inline' | 'page' | 'toast'
  customMessage,
}) => {
  const isNetworkError =
    error?.message?.includes("Network") || error?.message?.includes("fetch");
  const isServerError =
    error?.message?.includes("500") || error?.message?.includes("502");
  const isNotFound = error?.message?.includes("404");

  const errorConfig = {
    network: {
      icon: "📡",
      title: "ネットワークエラー",
      message: "インターネット接続を確認してください",
    },
    server: {
      icon: "🔧",
      title: "サーバーエラー",
      message: "一時的な問題が発生しています。しばらくお待ちください",
    },
    notFound: {
      icon: "🔍",
      title: "見つかりません",
      message: "お探しのデータが見つかりませんでした",
    },
    default: {
      icon: "⚠️",
      title: "エラーが発生しました",
      message: "もう一度お試しください",
    },
  };

  const config = isNetworkError
    ? errorConfig.network
    : isServerError
      ? errorConfig.server
      : isNotFound
        ? errorConfig.notFound
        : errorConfig.default;

  if (type === "inline") {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
        <div className="text-2xl mb-2">{config.icon}</div>
        <p className="text-sm text-red-600 font-medium">
          {customMessage || config.message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold flex items-center gap-1 mx-auto"
          >
            <RefreshCw size={14} /> 再試行
          </button>
        )}
      </div>
    );
  }

  if (type === "page") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 text-3xl">
          {config.icon}
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">
          {config.title}
        </h1>
        <p className="text-sm text-slate-500 mb-6 max-w-xs">
          {customMessage || config.message}
        </p>
        <div className="flex gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm"
            >
              <RefreshCw size={16} /> 再試行
            </button>
          )}
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm"
          >
            <Home size={16} /> ホームへ
          </Link>
        </div>
      </div>
    );
  }

  return null;
};

// ローディング中のエラー回復ラッパー
export const RecoverableLoader = ({
  data,
  error,
  loading,
  onRetry,
  children,
  skeleton,
}) => {
  if (loading && !data) {
    return (
      skeleton || (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      )
    );
  }

  if (error && !data) {
    return <APIErrorFallback error={error} onRetry={onRetry} type="inline" />;
  }

  return children;
};

export default { fetchWithRetry, APIErrorFallback, RecoverableLoader };
