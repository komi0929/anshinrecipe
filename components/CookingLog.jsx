import React, { useState } from 'react';
import { Send, Calendar, Clock, Star } from 'lucide-react';

export const CookingLog = ({ logs = [], onAddLog, currentUserId }) => {
    const [newLog, setNewLog] = useState('');
    const [rating, setRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            alert('ログの保存に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    };

    return (
    return (
        <div className="cooking-log-section mt-8 border-t-4 border-orange-100 pt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🧪</span>
                My Kitchen Lab
                <span className="text-xs font-normal text-slate-500 ml-2">（調理ログ）</span>
            </h3>

            {/* Input Form - Notebook Style */}
            <div className="bg-[#fffdfa] rounded-xl p-5 shadow-sm border border-slate-200 relative overflow-hidden mb-8">
                {/* Decoration: Punch holes */}
                <div className="absolute left-3 top-0 bottom-0 flex flex-col justify-evenly opacity-10 pointer-events-none">
                    <div className="w-3 h-3 rounded-full bg-black mb-4"></div>
                    <div className="w-3 h-3 rounded-full bg-black mb-4"></div>
                    <div className="w-3 h-3 rounded-full bg-black"></div>
                </div>

                <form onSubmit={handleSubmit} className="pl-6">
                    <label className="block text-xs font-bold text-slate-400 mb-2">今回の実験メモ</label>
                    <textarea
                        value={newLog}
                        onChange={(e) => setNewLog(e.target.value)}
                        placeholder="例：米粉に変えたらもちもちになった！次は〜してみよう。"
                        className="w-full p-0 bg-transparent text-sm border-none focus:ring-0 resize-none font-medium text-slate-700 leading-relaxed placeholder:text-slate-300"
                        style={{
                            backgroundImage: 'linear-gradient(transparent, transparent 27px, #e5e7eb 27px)',
                            backgroundSize: '100% 28px',
                            lineHeight: '28px'
                        }}
                        rows={3}
                    />

                    <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-100 border-dashed">
                        <div>
                            <span className="text-xs font-bold text-slate-400 mb-1 block">実験の成果</span>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className="transition-transform active:scale-110 focus:outline-none"
                                    >
                                        <Star
                                            size={24}
                                            className={`${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={!newLog.trim() || isSubmitting}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all ${!newLog.trim() || isSubmitting
                                ? 'bg-slate-100 text-slate-300'
                                : 'bg-orange-500 text-white shadow-lg shadow-orange-200 active:scale-95'
                                }`}
                        >
                            <Send size={16} />
                            記録する
                        </button>
                    </div>
                </form>
            </div>

            {/* Timeline */}
            <div className="relative pl-4 space-y-6">
                {/* Vertical Line */}
                <div className="absolute left-[27px] top-2 bottom-0 w-0.5 bg-slate-100"></div>

                {logs.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 ml-6">
                        <p className="text-slate-400 text-sm font-bold mb-1">ログは真っ白です</p>
                        <p className="text-xs text-slate-400">最初の一回目を記録して、<br />実験ノートを始めましょう！</p>
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="relative flex gap-4 items-start group">
                            {/* Pin Icon / Dot */}
                            <div className="relative z-10 w-6 h-6 rounded-full bg-white border-4 border-orange-100 shadow-sm mt-1 shrink-0 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                            </div>

                            <div className="flex-1 bg-white p-4 rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
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
                                <p className="text-sm text-slate-700 leading-relaxed font-medium">{log.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
