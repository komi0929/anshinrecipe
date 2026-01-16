'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Send, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const SHOP_ISSUE_TYPES = [
    { value: 'closed', label: '閉店している', icon: '🚫' },
    { value: 'wrong_info', label: '店舗情報が間違っている', icon: '📍' },
    { value: 'wrong_allergy', label: 'アレルギー情報が不正確', icon: '⚠️' },
    { value: 'other', label: 'その他', icon: '💬' }
];

const MENU_ISSUE_TYPES = [
    { value: 'discontinued', label: '販売終了している', icon: '🚫' },
    { value: 'wrong_allergy', label: 'アレルギー情報が不正確', icon: '⚠️' },
    { value: 'wrong_price', label: '価格が違う', icon: '💰' },
    { value: 'other', label: 'その他', icon: '💬' }
];

export const ReportModal = ({
    isOpen,
    onClose,
    type = 'shop', // 'shop' | 'menu'
    restaurantId,
    menuId = null,
    restaurantName = '',
    menuName = ''
}) => {
    const [issueType, setIssueType] = useState('');
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);

    const issueTypes = type === 'shop' ? SHOP_ISSUE_TYPES : MENU_ISSUE_TYPES;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!issueType) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                restaurant_id: restaurantId,
                issue_type: issueType,
                details: details.trim() || null,
                status: 'pending',
                report_target: type,
                menu_id: type === 'menu' ? menuId : null
            };

            const { error: insertError } = await supabase
                .from('restaurant_reports')
                .insert(payload);

            if (insertError) throw insertError;

            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
                setIssueType('');
                setDetails('');
            }, 2000);
        } catch (err) {
            console.error('Report submission failed:', err);
            setError('送信に失敗しました。後でもう一度お試しください。');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">

                {isSuccess ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">報告を受け付けました</h3>
                        <p className="text-slate-500 text-sm">ご協力ありがとうございます。確認後対応いたします。</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-rose-100 p-2 rounded-full">
                                    <AlertTriangle size={20} className="text-rose-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">問題を報告</h3>
                                    <p className="text-xs text-slate-400">
                                        {type === 'shop' ? restaurantName : menuName}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Issue Type Selection */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    問題の種類 <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {issueTypes.map((issue) => (
                                        <button
                                            key={issue.value}
                                            type="button"
                                            onClick={() => setIssueType(issue.value)}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${issueType === issue.value
                                                    ? 'border-rose-500 bg-rose-50'
                                                    : 'border-slate-100 hover:border-slate-200'
                                                }`}
                                        >
                                            <span className="text-lg mb-1 block">{issue.icon}</span>
                                            <span className={`text-xs font-bold ${issueType === issue.value ? 'text-rose-600' : 'text-slate-600'
                                                }`}>
                                                {issue.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Details */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                    詳細（任意）
                                </label>
                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-rose-500 focus:ring-0 outline-none transition-all text-slate-700 min-h-[100px] text-sm"
                                    placeholder="具体的な内容を教えてください..."
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg font-bold">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting || !issueType}
                                className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send size={20} /> 報告を送信
                                    </>
                                )}
                            </button>

                            <p className="text-[10px] text-slate-400 text-center">
                                ※報告内容は運営チームが確認し、必要に応じて対応いたします。
                            </p>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};
