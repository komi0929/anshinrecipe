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
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-500 flex justify-center">
            <div className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-2xl border border-orange-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Download size={20} className="text-white" />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xs text-slate-900">アプリとして保存しませんか？</h3>
                    <p className="text-slate-500 text-[10px] truncate">
                        {isIOS ? '共有ボタンから「ホーム画面に追加」' : 'ワンタップでホーム画面に追加できます'}
                    </p>
                </div>

                <div className="flex items-center gap-1">
                    {!isIOS && (
                        <button
                            onClick={handleInstall}
                            className="bg-orange-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors"
                        >
                            追加
                        </button>
                    )}
                    <button
                        onClick={handleDismiss}
                        className="p-1.5 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
