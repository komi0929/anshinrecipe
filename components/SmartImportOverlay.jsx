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
                {/* Branding Icon / Logo Area */}
                <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-orange-200/50 p-2 animate-bounce">
                    <img src="/images/baby-chef.png" alt="Baby Chef" className="w-full h-full object-contain" />
                </div>

                {/* Status Text & Counter */}
                <div className="text-center">
                    {status === 'counting' && (
                        <>
                            <div className="text-8xl font-black text-orange-500 mb-4 font-mono tracking-tighter animate-pop-in drop-shadow-sm" key={count}>
                                {count}
                            </div>
                            <p className="text-slate-600 font-bold text-xl animate-pulse">
                                おいしいレシピにな～れ！✨
                            </p>
                        </>
                    )}

                    {status === 'finalizing' && (
                        <div className="animate-zoom-in">
                            <Loader2 className="w-16 h-16 text-orange-400 animate-spin mx-auto mb-6" />
                            <p className="text-slate-700 font-bold text-2xl">あとちょっと！🍳</p>
                        </div>
                    )}

                    {status === 'done' && (
                        <div className="animate-zoom-in">
                            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
                            <h3 className="text-3xl font-bold text-slate-800">準備OK！🎉</h3>
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
