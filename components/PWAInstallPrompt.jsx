'use client'

import React, { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';

const PWAInstallPrompt = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed as PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if dismissed recently (within 3 days)
        const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
        if (dismissedAt) {
            const dismissedDate = new Date(parseInt(dismissedAt));
            const now = new Date();
            const daysDiff = (now - dismissedDate) / (1000 * 60 * 60 * 24);
            if (daysDiff < 3) return;
        }

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIOSDevice);

        if (isIOSDevice) {
            // iOS: Show custom prompt after delay (Safari doesn't support beforeinstallprompt)
            const timer = setTimeout(() => setShowPrompt(true), 5000);
            return () => clearTimeout(timer);
        }

        // Android/Desktop: Listen for beforeinstallprompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowPrompt(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    };

    if (isInstalled || !showPrompt) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 shadow-2xl shadow-orange-500/30">
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <img
                            src="/icon-512x512.png"
                            alt="あんしんレシピ"
                            className="w-10 h-10 rounded-lg"
                        />
                    </div>

                    <div className="flex-1 text-white min-w-0">
                        <h3 className="font-bold text-lg mb-1">アプリをインストール</h3>
                        <p className="text-white/90 text-sm leading-relaxed">
                            ホーム画面に追加して、いつでも素早くアクセス！
                        </p>
                    </div>
                </div>

                {isIOS ? (
                    <div className="mt-4 bg-white/20 rounded-xl p-3">
                        <p className="text-white text-sm font-medium mb-2">インストール方法:</p>
                        <div className="flex items-center gap-2 text-white/90 text-sm">
                            <Share size={18} />
                            <span>共有ボタン</span>
                            <span>→</span>
                            <Plus size={18} />
                            <span>ホーム画面に追加</span>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={handleInstall}
                        className="mt-4 w-full bg-white text-orange-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-98"
                    >
                        <Download size={20} />
                        今すぐインストール
                    </button>
                )}
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
