'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Link2, Plus, Loader2 } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

const ClipboardRecipeDetector = () => {
    const [detectedUrl, setDetectedUrl] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useProfile();
    const router = useRouter();

    useEffect(() => {
        const checkClipboard = async () => {
            // Only check if user is logged in
            if (!user) return;

            // Check if we've already shown this prompt recently (30 min cooldown per URL)
            const lastChecked = localStorage.getItem('clipboard-last-checked');
            const lastUrl = localStorage.getItem('clipboard-last-url');
            const now = Date.now();

            if (lastChecked && (now - parseInt(lastChecked)) < 30 * 60 * 1000) {
                return; // Cooldown not expired
            }

            try {
                // Request clipboard permission (user must interact first on some browsers)
                const text = await navigator.clipboard.readText();

                if (!text) return;

                // Check if it's a recipe-related URL (Instagram, TikTok, cooking sites)
                const recipePatterns = [
                    /instagram\.com/,
                    /tiktok\.com/,
                    /cookpad\.com/,
                    /kurashiru\.com/,
                    /delishkitchen\.tv/,
                    /macaroni-noodle\.jp/,
                    /recipe\./,
                    /レシピ/,
                ];

                const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
                if (urlMatch) {
                    const url = urlMatch[0];

                    // Check if this is the same URL we already prompted for
                    if (url === lastUrl) return;

                    // Check if it matches recipe patterns
                    const isRecipeUrl = recipePatterns.some(pattern => pattern.test(url));

                    if (isRecipeUrl) {
                        setDetectedUrl(url);
                        setIsVisible(true);
                        localStorage.setItem('clipboard-last-url', url);
                    }
                }

                localStorage.setItem('clipboard-last-checked', now.toString());
            } catch (err) {
                // Clipboard API not available or permission denied - silently fail
                console.log('Clipboard access not available');
            }
        };

        // Check clipboard after a short delay when page loads
        const timer = setTimeout(checkClipboard, 1500);

        return () => clearTimeout(timer);
    }, [user]);

    const handleSave = () => {
        if (!detectedUrl) return;

        // Navigate to quick-save with the URL
        router.push(`/recipe/quick-save?url=${encodeURIComponent(detectedUrl)}`);
        setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        // Mark this URL as dismissed
        localStorage.setItem('clipboard-dismissed-url', detectedUrl);
    };

    if (!isVisible || !detectedUrl) return null;

    return (
        <div className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-300">
            <div className="bg-white rounded-2xl p-4 shadow-2xl border border-slate-100">
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Link2 className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                        <h3 className="font-bold text-slate-800 text-sm mb-1">
                            レシピURLを検出しました
                        </h3>
                        <p className="text-xs text-slate-500 truncate mb-2">
                            {detectedUrl}
                        </p>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-400 to-amber-400 text-white text-sm font-bold px-4 py-2 rounded-full hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Plus size={14} />
                            )}
                            レシピを保存する
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClipboardRecipeDetector;
