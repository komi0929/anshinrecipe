'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

const SmartImportOverlay = ({ isVisible, onRunning, onComplete }) => {
    const [count, setCount] = useState(3);
    const [status, setStatus] = useState('counting'); // 'counting', 'finalizing', 'done'

    useEffect(() => {
        if (!isVisible) {
            setCount(3);
            setStatus('counting');
            return;
        }

        // 3-2-1 Countdown
        const timer = setInterval(() => {
            setCount((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setStatus('finalizing');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isVisible]);

    // Handle "Finalizing" -> "Done" transition
    // Parent controls when actual data fetch is done via `onRunning` prop (passed as false when done)
    useEffect(() => {
        if (status === 'finalizing' && !onRunning) {
            // Data is ready AND countdown finished
            setStatus('done');
            setTimeout(() => {
                if (onComplete) onComplete();
            }, 800); // Show "Done" state briefly
        }
    }, [status, onRunning, onComplete]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
            <div className="relative flex flex-col items-center">
                {/* Countdown Number Container */}
                {status === 'counting' && (
                    <div className="w-48 h-48 bg-gradient-to-br from-orange-50 to-amber-50 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-orange-100/50 animate-bounce">
                        {/* The Number */}
                        <div className="text-8xl font-black text-orange-500 tracking-tighter animate-pop-in" key={count}>
                            {count}
                        </div>
                    </div>
                )}

                {/* Status Text */}
                <div className="text-center h-24">
                    {status === 'counting' && (
                        <p className="text-slate-600 font-bold text-xl">
                            レシピを解析中...
                        </p>
                    )}

                    {status === 'finalizing' && (
                        <div className="animate-zoom-in flex flex-col items-center">
                            <div className="w-56 h-56 flex items-center justify-center mb-8">
                                <Loader2 className="w-24 h-24 text-orange-400 animate-spin" />
                            </div>
                            <p className="text-slate-700 font-bold text-xl">もう少しお待ちください...</p>
                        </div>
                    )}

                    {status === 'done' && (
                        <div className="animate-zoom-in flex flex-col items-center">
                            <div className="w-56 h-56 flex items-center justify-center mb-8">
                                <CheckCircle2 className="w-32 h-32 text-green-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800">読み込み完了</h3>
                        </div>
                    )}
                </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-orange-300/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
        </div>
    );
};

export default SmartImportOverlay;
