'use client';

import React from 'react';
import { Sparkles, MessageCircle, AlertCircle } from 'lucide-react';

export const SafetyVoiceCard = ({ features }) => {
    // Generate summary based on features
    const points = [];
    // AI Voice logic should focus on QUALITATIVE insights from reviews/text, not simple boolean flags.
    // Since we only have boolean flags which are already displayed in the Grid below,
    // we remove this redundant display to avoid clutter.
    // Future: Add points.push(...) only when we have analyzed TEXT summary from reviews.

    if (points.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-3xl border border-indigo-100 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={64} className="text-indigo-500" />
            </div>

            <div className="relative z-10">
                <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                    <Sparkles size={20} className="text-indigo-600" />
                    Safety Voice
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-indigo-100 text-indigo-400 font-normal">AI分析 (β版)</span>
                </h3>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/50">
                    <div className="flex items-start gap-3">
                        <div className="bg-indigo-100 p-2 rounded-full shrink-0 mt-0.5">
                            <MessageCircle size={16} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-700 font-bold mb-2">口コミ・公式情報からの分析</p>
                            <ul className="space-y-1.5">
                                {points.map((point, i) => (
                                    <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                                ※あくまでAIによる推定です。店舗に直接ご確認ください。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
