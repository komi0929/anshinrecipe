'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CoachMark = ({
    targetId,
    message,
    position = 'bottom', // 'top', 'bottom', 'left', 'right'
    uniqueKey, // Key for localStorage to show only once
    onClose,
    delay = 1000
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [positionStyle, setPositionStyle] = useState({});

    useEffect(() => {
        // Check if already shown
        const hasShown = localStorage.getItem(`coachmark_${uniqueKey}`);
        if (hasShown) return;

        const timer = setTimeout(() => {
            const target = document.getElementById(targetId);
            if (target) {
                const rect = target.getBoundingClientRect();
                const scrollY = window.scrollY;
                const scrollX = window.scrollX;

                let style = {};

                // Simple positioning logic (can be enhanced)
                switch (position) {
                    case 'bottom':
                        style = {
                            top: rect.bottom + scrollY + 12,
                            left: rect.left + scrollX + (rect.width / 2)
                        };
                        break;
                    case 'top':
                        style = {
                            bottom: (window.innerHeight - rect.top - scrollY) + 12,
                            left: rect.left + scrollX + (rect.width / 2)
                        };
                        break;
                    // Add other cases as needed
                    default:
                        style = { top: rect.bottom + 12, left: rect.left + (rect.width / 2) };
                }

                setPositionStyle(style);
                setIsVisible(true);
            }
        }, delay);

        return () => clearTimeout(timer);
    }, [targetId, uniqueKey, delay, position]);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem(`coachmark_${uniqueKey}`, 'true');
        if (onClose) onClose();
    };

    if (!isVisible) return null;

    return (
        <div
            className="absolute z-[999] pointer-events-none"
            style={positionStyle}
        >
            <div className={`
                relative bg-primary text-white p-3 rounded-xl shadow-xl max-w-[240px] pointer-events-auto
                animate-in zoom-in slide-in-from-bottom-2 duration-300
                transform -translate-x-1/2
            `}>
                {/* Arrow */}
                <div className={`
                    absolute w-3 h-3 bg-primary rotate-45
                    ${position === 'bottom' ? '-top-1.5 left-1/2 -translate-x-1/2' : ''}
                    ${position === 'top' ? '-bottom-1.5 left-1/2 -translate-x-1/2' : ''}
                `} />

                <div className="relative flex items-start gap-2">
                    <p className="text-sm font-bold leading-normal">{message}</p>
                    <button
                        onClick={handleClose}
                        className="opacity-70 hover:opacity-100 -mt-1 -mr-1"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="mt-2 flex justify-end">
                    <button
                        onClick={handleClose}
                        className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full font-bold transition-colors"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CoachMark;
