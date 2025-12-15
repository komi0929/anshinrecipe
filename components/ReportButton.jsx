'use client';

import React, { useState } from 'react';
import { Flag, X, AlertTriangle, Send } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './Toast';

export const ReportButton = ({ recipeId, userId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reason, setReason] = useState('allergy_risk');
    const [details, setDetails] = useState('');
    const { addToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!userId) {
            addToast('報告するにはログインが必要です', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('reports')
                .insert({
                    recipe_id: recipeId,
                    reporter_id: userId,
                    reason,
                    details
                });

            if (error) throw error;

            addToast('報告を受け付けました。ご協力ありがとうございます。', 'success');
            setIsOpen(false);
            setDetails('');
            setReason('allergy_risk');
        } catch (error) {
            console.error('Report error:', error);
            addToast('送信に失敗しました', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!userId) return null; // Don't show for guests

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-red-500 transition-colors mt-8 mx-auto"
            >
                <Flag size={14} />
                <span>問題を報告する</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <AlertTriangle size={18} className="text-red-500" />
                                問題を報告
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <p className="text-sm text-slate-600 mb-4">
                                このレシピに問題がある場合、運営チームにお知らせください。
                                <br />
                                <span className="text-xs text-slate-400">※個別の返信は行わない場合があります。</span>
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">
                                        報告の理由
                                    </label>
                                    <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    >
                                        <option value="allergy_risk">アレルギー情報の誤り・危険性</option>
                                        <option value="inappropriate">不適切な内容・画像</option>
                                        <option value="spam">スパム・宣伝行為</option>
                                        <option value="other">その他</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">
                                        詳細（任意）
                                    </label>
                                    <textarea
                                        value={details}
                                        onChange={(e) => setDetails(e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-lg h-24 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                        placeholder="具体的な問題点を入力してください..."
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 py-2 px-4 border border-slate-300 rounded-full text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-2 px-4 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition-colors flex justify-center items-center gap-2"
                                >
                                    {isSubmitting ? '送信中...' : (
                                        <>
                                            <Send size={16} />
                                            報告する
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
