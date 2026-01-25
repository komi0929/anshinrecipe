"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";

/**
 * オフライン対応コンポーネント（92件改善 Phase5）
 * 5.73-5.75 オフライン対応
 */

// オフライン状態フック
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
};

// オフラインバナー
export const OfflineBanner = () => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-bold transition-colors ${
        isOnline ? "bg-green-500 text-white" : "bg-amber-500 text-white"
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi size={16} />
            接続が回復しました
          </>
        ) : (
          <>
            <WifiOff size={16} />
            オフラインです
          </>
        )}
      </div>
    </div>
  );
};

// オフライン用フォールバック画面
export const OfflineFallback = ({ onRetry }) => {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (isOnline) {
      onRetry?.();
    }
  }, [isOnline, onRetry]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
      <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6">
        <WifiOff size={48} className="text-slate-400" />
      </div>
      <h1 className="text-xl font-bold text-slate-800 mb-2">
        インターネットに接続できません
      </h1>
      <p className="text-sm text-slate-500 mb-6 max-w-xs">
        ネットワーク接続を確認して、もう一度お試しください
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold"
      >
        <RefreshCw size={18} />
        再試行
      </button>
    </div>
  );
};

// キャッシュ済みデータ表示ラッパー
export const CachedDataWrapper = ({
  children,
  cachedData,
  isLoading,
  error,
}) => {
  const isOnline = useOnlineStatus();

  if (isLoading && !cachedData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !cachedData) {
    if (!isOnline) {
      return (
        <div className="text-center py-8 px-4">
          <WifiOff size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            オフライン中です。接続を確認してください。
          </p>
        </div>
      );
    }
    return (
      <div className="text-center py-8 px-4">
        <p className="text-sm text-red-500">データの読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <>
      {!isOnline && cachedData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4 text-xs text-amber-700 text-center">
          📶 オフライン表示中（最新ではない可能性があります）
        </div>
      )}
      {children}
    </>
  );
};

export default {
  useOnlineStatus,
  OfflineBanner,
  OfflineFallback,
  CachedDataWrapper,
};
