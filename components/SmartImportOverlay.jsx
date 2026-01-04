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
        <div className="fixed inset-0 z-[9999] bg-[#FFF8F5]/98 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in text-slate-700">
            <div className="relative flex flex-col items-center p-8 bg-white/50 rounded-[40px] shadow-xl shadow-orange-100/20 border border-white/60">
                {/* Unified Icon Container - Same size for all states */}
                <div className="w-48 h-48 bg-gradient-to-br from-white to-orange-50 rounded-full flex items-center justify-center mb-8 shadow-inner border border-white">
                    {status === 'counting' && (
                        <div className="text-8xl font-black text-[#F97316] tracking-tighter animate-pop-in" key={count}>
                            {count}
                        </div>
                    )}

                    {status === 'finalizing' && (
                        <Loader2 className="w-20 h-20 text-[#F97316] animate-spin" />
                    )}

                    {status === 'done' && (
                        <CheckCircle2 className="w-24 h-24 text-green-500 animate-zoom-in" />
                    )}
                </div>

                {/* Status Text */}
                <div className="text-center">
                    {status === 'counting' && (
                        <p className="text-slate-600 font-bold text-xl tracking-wider">
                            レシピを解析中...
                        </p>
                    )}

                    {status === 'finalizing' && (
                        <p className="text-slate-600 font-bold text-xl tracking-wider animate-pulse">
                            仕上げています...
                        </p>
                    )}

                    {status === 'done' && (
                        <h3 className="text-2xl font-bold text-slate-800 tracking-wider">
                            完了しました！
                        </h3>
                    )}
                </div>
            </div>

            {/* Background Decoration - Softer */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-yellow-100/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            </div>
        </div>
    );
};

export default SmartImportOverlay;
