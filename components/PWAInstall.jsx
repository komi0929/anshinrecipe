"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Share, Smartphone } from "lucide-react";

/**
 * PWAインストールプロンプト（92件改善 Phase5）
 * 5.69-5.72 PWA対応
 */

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // インストール済みチェック
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // beforeinstallpromptイベントをキャプチャ
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // appinstalledイベント
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
      return true;
    }
    return false;
  };

  return { isInstallable, isInstalled, install };
};

// インストールバナー
export const PWAInstallBanner = ({ onDismiss }) => {
  const { isInstallable, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 24時間以内に閉じた場合は表示しない
    const dismissedAt = localStorage.getItem("pwa-banner-dismissed");
    if (
      dismissedAt &&
      Date.now() - parseInt(dismissedAt) < 24 * 60 * 60 * 1000
    ) {
      setDismissed(true);
    }
  }, []);

  if (!isInstallable || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem("pwa-banner-dismissed", Date.now().toString());
    setDismissed(true);
    onDismiss?.();
  };

  const handleInstall = async () => {
    await install();
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 bg-white rounded-2xl shadow-2xl p-4 border border-slate-100 animate-slideUp">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Smartphone size={24} className="text-orange-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 mb-1">
            アプリをインストール
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            ホーム画面に追加してすぐにアクセス！
          </p>
          <button
            onClick={handleInstall}
            className="w-full py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          >
            <Download size={16} /> インストール
          </button>
        </div>
      </div>
    </div>
  );
};

// iOS用インストール案内
export const IOSInstallGuide = ({ onClose }) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isInStandaloneMode = window.matchMedia(
    "(display-mode: standalone)",
  ).matches;

  if (!isIOS || isInStandaloneMode) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end"
      onClick={onClose}
    >
      <div
        className="w-full bg-white rounded-t-3xl p-6 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <h3 className="font-bold text-lg text-slate-800">ホーム画面に追加</h3>
          <p className="text-sm text-slate-500 mt-1">
            iPhoneでアプリとして使えます
          </p>
        </div>

        <div className="space-y-4 py-4 border-y border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 font-bold">
              1
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              下の
              <span className="inline-flex items-center px-2 py-1 bg-slate-100 rounded-lg">
                <Share size={16} className="text-blue-500" />
              </span>
              をタップ
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 font-bold">
              2
            </div>
            <div className="text-sm text-slate-700">
              「ホーム画面に追加」を選択
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 font-bold">
              3
            </div>
            <div className="text-sm text-slate-700">
              「追加」をタップして完了！
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold"
        >
          閉じる
        </button>
      </div>
    </div>
  );
};

export default { usePWAInstall, PWAInstallBanner, IOSInstallGuide };
