'use client';

import React, { useState } from 'react';
import { X, Send, Store, Globe, MessageSquare } from 'lucide-react';

export const RequestCollectionModal = ({ isOpen, onClose }) => {
    const [shopName, setShopName] = useState('');
    const [url, setUrl] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!shopName.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shopName, url, notes })
            });

            if (!response.ok) throw new Error('Failed to submit request');

            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
                setShopName('');
                setUrl('');
                setNotes('');
            }, 2000);
        } catch (err) {
            setError('送信に失敗しました。後でもう一度お試しください。');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">

                {isSuccess ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Send size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">リクエストを受け付けました</h3>
                        <p className="text-slate-500 text-sm">調査完了までしばらくお待ちください。</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg text-slate-800">店舗調査リクエスト</h3>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">店名 <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Store className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        value={shopName}
                                        onChange={(e) => setShopName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-orange-500 focus:ring-0 outline-none transition-all font-bold text-slate-700"
                                        placeholder="例: モスバーガー 博多駅前店"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">公式サイトや地図のURL（任意）</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-orange-500 focus:ring-0 outline-none transition-all text-slate-700"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">備考・アレルギー情報（任意）</label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-orange-500 focus:ring-0 outline-none transition-all text-slate-700 min-h-[100px]"
                                        placeholder="例: 卵アレルギー対応のメニューがありました。"
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg font-bold">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting || !shopName.trim()}
                                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send size={20} /> リクエストを送信
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};
