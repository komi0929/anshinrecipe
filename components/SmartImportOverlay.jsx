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
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl animate-fade-in">
            <div className="relative flex flex-col items-center">
                {/* Branding Icon / Logo Area */}
                <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-amber-50 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-orange-100/50">
                    <span className="text-5xl animate-bounce">
                        {status === 'done' ? '✨' : '👶'}
                    </span>
                </div>

                {/* Status Text & Counter */}
                <div className="text-center">
                    {status === 'counting' && (
                        <>
                            <div className="text-6xl font-black text-slate-800 mb-2 font-mono tracking-tighter animate-zoom-in" key={count}>
                                {count}
                            </div>
                            <p className="text-slate-500 font-medium">レシピを読み込んでいます...</p>
                        </>
                    )}

                    {status === 'finalizing' && (
                        <>
                            <Loader2 className="w-12 h-12 text-orange-400 animate-spin mx-auto mb-4" />
                            <p className="text-slate-600 font-bold text-lg">仕上げ中...</p>
                        </>
                    )}

                    {status === 'done' && (
                        <div className="animate-zoom-in">
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-slate-800">準備完了！</h3>
                        </div>
                    )}
                </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl opacity-30">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-200 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            </div>
        </div>
    );
};

export default SmartImportOverlay;
