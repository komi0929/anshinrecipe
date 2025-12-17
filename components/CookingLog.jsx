'use client'

import React, { useState } from 'react';
import { Send, Trash2, Star, StickyNote, Lock } from 'lucide-react';

export const CookingLog = ({ logs = [], onAddLog, onDeleteLog, currentUserId }) => {
    const [newLog, setNewLog] = useState('');
    const [rating, setRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter logs to show only current user's logs
    const myLogs = logs.filter(log => log.user_id === currentUserId);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newLog.trim()) return;

        setIsSubmitting(true);
        try {
            await onAddLog({
                content: newLog,
                rating: rating > 0 ? rating : null,
                created_at: new Date().toISOString()
            });
            setNewLog('');
            setRating(0);
        } catch (error) {
            console.error('Failed to add log', error);
            alert('メモの保存に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (logId) => {
        if (!confirm('このメモを削除しますか？')) return;
        try {
            await onDeleteLog(logId);
        } catch (error) {
            console.error('Failed to delete log', error);
            alert('メモの削除に失敗しました');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    };

    return (
        <div className="my-memo-section mt-8 border-t-4 border-yellow-100 pt-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📝</span>
                <h3 className="text-xl font-bold text-gray-800">マイメモ</h3>
                <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-slate-100 rounded-full">
                    <Lock size={12} className="text-slate-400" />
                    <span className="text-xs text-slate-500">非公開</span>
                </div>
            </div>

            <p className="text-sm text-slate-500 mb-4">
                自分だけが見られる備忘録です。アレンジのアイデアや子どもの反応をメモしておきましょう。
            </p>

            {/* Input Form - Sticky Note Style */}
            <div className="bg-yellow-50 rounded-xl p-5 shadow-sm border border-yellow-200 relative mb-6">
                {/* Corner fold effect */}
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-t-yellow-200 border-l-[20px] border-l-transparent"></div>

                <form onSubmit={handleSubmit}>
                    <textarea
                        value={newLog}
                        onChange={(e) => setNewLog(e.target.value)}
                        placeholder="例：次回は砂糖を減らしてみる。子どもが喜んで食べた！"
                        className="w-full p-0 bg-transparent text-sm border-none focus:ring-0 resize-none font-medium text-slate-700 leading-relaxed placeholder:text-yellow-400"
                        rows={3}
                    />

                    <div className="flex justify-between items-end mt-4 pt-3 border-t border-yellow-200 border-dashed">
                        <div>
                            <span className="text-xs font-bold text-yellow-600 mb-1 block">評価（任意）</span>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(rating === star ? 0 : star)}
                                        className="transition-transform active:scale-110 focus:outline-none"
                                    >
                                        <Star
                                            size={22}
                                            className={`${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-yellow-200'}`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={!newLog.trim() || isSubmitting}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all ${!newLog.trim() || isSubmitting
                                ? 'bg-yellow-100 text-yellow-300'
                                : 'bg-yellow-500 text-white shadow-lg shadow-yellow-200 active:scale-95'
                                }`}
                        >
                            <StickyNote size={16} />
                            メモを追加
                        </button>
                    </div>
                </form>
            </div>

            {/* Memo Cards - Sticky Note Style */}
            <div className="space-y-3">
                {myLogs.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                        <div className="text-4xl mb-2 opacity-50">📌</div>
                        <p className="text-slate-400 text-sm font-bold mb-1">まだメモがありません</p>
                        <p className="text-xs text-slate-400">気づいたことや試したいことを<br />書き留めておきましょう</p>
                    </div>
                ) : (
                    myLogs.map((log) => (
                        <div
                            key={log.id}
                            className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 shadow-sm relative group"
                        >
                            {/* Delete button */}
                            {onDeleteLog && (
                                <button
                                    onClick={() => handleDelete(log.id)}
                                    className="absolute top-2 right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-300 hover:text-red-400 transition-all"
                                    title="削除"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}

                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                                    {formatDate(log.created_at)}
                                </span>
                                {log.rating && (
                                    <div className="flex gap-0.5">
                                        {[...Array(log.rating)].map((_, i) => (
                                            <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">{log.content}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
