"use client";

import React from "react";
import { Loader2, AlertCircle, WifiOff, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

/**
 * 共通ローディング・エラーコンポーネント（92件改善 Phase5）
 * 5.11-5.15 UX改善: ローディング・エラー状態
 */

// ローディングスピナー
export const LoadingSpinner = ({ size = "md", text = "読み込み中..." }) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2
        className={`${sizeClasses[size]} text-orange-500 animate-spin`}
      />
      {text && <p className="text-sm text-slate-500 mt-3">{text}</p>}
    </div>
  );
};

// スケルトンローダー
export const SkeletonCard = ({ variant = "default" }) => {
  if (variant === "list") {
    return (
      <div className="flex gap-3 p-3 animate-pulse">
        <div className="w-16 h-16 bg-slate-200 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
          <div className="h-3 bg-slate-200 rounded w-1/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
      <div className="h-40 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-6 bg-slate-200 rounded-full w-16" />
          <div className="h-6 bg-slate-200 rounded-full w-16" />
        </div>
      </div>
    </div>
  );
};

// エンプティステート
export const EmptyState = ({
  icon: Icon = AlertCircle,
  title = "データがありません",
  description,
  action,
  actionText = "もう一度試す",
  actionHref,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Icon size={40} className="text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-700 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mb-6 max-w-xs">{description}</p>
      )}
      {action && (
        <button
          onClick={action}
          className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm"
        >
          {actionText}
        </button>
      )}
      {actionHref && (
        <Link
          href={actionHref}
          className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
};

// エラーステート
export const ErrorState = ({
  error,
  onRetry,
  type = "generic", // 'generic' | 'network' | 'notfound'
}) => {
  const configs = {
    generic: {
      icon: AlertCircle,
      title: "エラーが発生しました",
      description: error?.message || "しばらく経ってからもう一度お試しください",
    },
    network: {
      icon: WifiOff,
      title: "ネットワークエラー",
      description: "インターネット接続を確認してください",
    },
    notfound: {
      icon: AlertCircle,
      title: "見つかりません",
      description: "お探しのページは存在しないか、削除された可能性があります",
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <Icon size={40} className="text-red-500" />
      </div>
      <h3 className="text-lg font-bold text-slate-700 mb-2">{config.title}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-xs">
        {config.description}
      </p>
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm"
          >
            <RefreshCw size={16} />
            再試行
          </button>
        )}
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm"
        >
          <Home size={16} />
          ホームへ
        </Link>
      </div>
    </div>
  );
};

// プルトゥリフレッシュインジケータ
export const PullToRefresh = ({ refreshing }) => {
  if (!refreshing) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center py-3 bg-white/90 backdrop-blur-sm border-b border-slate-100">
      <div className="flex items-center gap-2 text-sm text-orange-600">
        <Loader2 size={16} className="animate-spin" />
        更新中...
      </div>
    </div>
  );
};

export default {
  LoadingSpinner,
  SkeletonCard,
  EmptyState,
  ErrorState,
  PullToRefresh,
};
