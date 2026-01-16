'use client';

import React from 'react';
import { Sparkles, MessageCircle, AlertCircle } from 'lucide-react';

export const SafetyVoiceCard = ({ features }) => {
    // Generate summary based on features
    const points = [];
    // Allergy 4 points
    if (features?.allergy?.contamination === '◯') points.push("コンタミネーションへの配慮が見受けられます");
    if (features?.allergy?.removal === '◯') points.push("除去食や対応メニューの相談が可能のようです");
    if (features?.allergy?.chart === '◯') points.push("アレルギー一覧表の提供があるようです");
    if (features?.allergy?.allergen_label === '◯') points.push("メニューにアレルギー表示があります");

    // Kids 4 points
    if (features?.kids?.kids_chair === '◯') points.push("子供用椅子の用意があるとの情報があります");
    if (features?.kids?.stroller === '◯') points.push("ベビーカーでの入店が可能です");
    if (features?.kids?.diaper === '◯') points.push("おむつ交換台やスペースがあるようです");
    if (features?.kids?.baby_food === '◯') points.push("離乳食の持ち込みが可能です");

    // Facility: Parking
    if (features?.parking === '◯' || features?.parking === true) points.push("🅿️ 駐車場があります");
    if (features?.wheelchair_accessible === '◯' || features?.wheelchair_accessible === true) points.push("♿ バリアフリー対応です");

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
