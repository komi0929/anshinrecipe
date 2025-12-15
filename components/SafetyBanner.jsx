'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const SafetyBanner = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasSeenNotice = localStorage.getItem('hasSeenSafetyNotice');
        // Always show for now as per "urgently improve" request to ensure visibility, 
        // or strictly follow logic. 
        // User asked for "functionality to notify users". 
        // A dismissed banner is standard. 
        if (!hasSeenNotice) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('hasSeenSafetyNotice', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="bg-orange-100 border-b border-orange-200 px-4 py-3 relative">
            <div className="container mx-auto pr-8">
                <p className="text-orange-800 text-sm font-medium">
                    ※本アプリはレシピの安全を完全に保証するものではありません。
                    使用されている食材はご自身でもご確認ください。
                </p>
            </div>
            <button
                onClick={handleDismiss}
                className="absolute top-1/2 right-4 transform -translate-y-1/2 text-orange-800 hover:text-orange-900 focus:outline-none"
                aria-label="閉じる"
            >
                <X size={20} />
            </button>
        </div>
    );
};

export default SafetyBanner;
