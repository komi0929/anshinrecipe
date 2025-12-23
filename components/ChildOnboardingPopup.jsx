'use client'

import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

const ChildOnboardingPopup = ({ profile }) => {
    const [showPopup, setShowPopup] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        // Only check once per session to prevent re-triggering
        if (hasChecked) return;

        // Check if user just registered their first child
        if (!profile?.children || profile.children.length === 0) return;

        // Check localStorage FIRST to prevent any flash
        const onboardingShown = localStorage.getItem('child-onboarding-shown');
        if (onboardingShown) {
            setHasChecked(true);
            return;
        }

        // Also check sessionStorage to prevent re-showing in same session
        const sessionShown = sessionStorage.getItem('child-onboarding-shown-session');
        if (sessionShown) {
            setHasChecked(true);
            return;
        }

        setHasChecked(true);

        // Show popup after a short delay
        const timer = setTimeout(() => {
            setShowPopup(true);
            // Mark as shown in session immediately
            sessionStorage.setItem('child-onboarding-shown-session', 'true');
        }, 500);

        return () => clearTimeout(timer);
    }, [profile?.children, hasChecked]);

    const handleClose = () => {
        setShowPopup(false);
        localStorage.setItem('child-onboarding-shown', 'true');
    };

    if (!showPopup || !profile?.children || profile.children.length === 0) return null;

    // Get the first child's name for personalization
    const childName = profile.children[0]?.name || 'お子さま';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-100">
                        <Sparkles size={32} className="text-orange-400" />
                    </div>

                    <h2 className="text-xl font-bold text-slate-700 mb-3">
                        おめでとうございます！🎉
                    </h2>

                    <p className="text-slate-600 leading-relaxed mb-6">
                        <span className="font-bold text-primary">{childName}</span>さんが
                        <br />
                        あんしんして食べられるレシピが
                        <br />
                        並んでいます
                    </p>

                    <button
                        onClick={handleClose}
                        className="w-full bg-gradient-to-r from-orange-400 to-amber-400 text-white font-bold py-4 rounded-full shadow-lg shadow-orange-200 hover:shadow-xl transition-all active:scale-95"
                    >
                        レシピを見る
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChildOnboardingPopup;
