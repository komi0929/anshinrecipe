'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Shield, Trash2, ExternalLink, CheckCircle, XCircle, AlertTriangle, RefreshCw,
    Users, BookOpen, Bookmark, Heart, MessageSquare, Baby, TrendingUp, TrendingDown, Minus, Zap, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

const AdminPage = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [reports, setReports] = useState([]);
    const [triedReports, setTriedReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const { addToast } = useToast();

    useEffect(() => {
        const sessionPin = sessionStorage.getItem('admin_pin');
        if (sessionPin === process.env.NEXT_PUBLIC_ADMIN_PIN) {
            setIsAuthenticated(true);
            fetchAllData();
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        if (pin === process.env.NEXT_PUBLIC_ADMIN_PIN) {
            setIsAuthenticated(true);
            sessionStorage.setItem('admin_pin', pin);
            fetchAllData();
            addToast('管理者としてログインしました', 'success');
        } else {
            addToast('PINコードが間違っています', 'error');
        }
    };

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Analytics Data
            const analyticsRes = await fetch('/api/admin/analytics');
            if (analyticsRes.ok) {
                const analyticsData = await analyticsRes.json();
                setAnalytics(analyticsData);
            }

            // 2. Fetch Stats from API
            const statsRes = await fetch('/api/admin/stats');
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            // 3. Fetch Inappropriate Reports
            const { data: reportData } = await supabase
                .from('reports')
                .select(`*, recipe:recipes!recipe_id (id, title, image_url, user_id), reporter:profiles!reporter_id (username)`)
                .order('created_at', { ascending: false });
            setReports(reportData || []);

            // 4. Fetch Tried Reports
            const { data: triedData } = await supabase
                .from('tried_reports')
                .select(`*, recipe:recipes!recipe_id (id, title), user:profiles!user_id (username)`)
                .order('created_at', { ascending: false })
                .limit(10);
            setTriedReports(triedData || []);

        } catch (error) {
            console.error('Error fetching data:', error);
            addToast('データの取得に失敗しました', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRecipe = async (recipeId, reportId) => {
        if (!confirm('このレシピを本当に削除しますか？')) return;
        try {
            await supabase.from('recipes').delete().eq('id', recipeId);
            await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId);
            addToast('削除しました', 'success');
            fetchAllData();
        } catch (error) {
            addToast('削除に失敗しました', 'error');
        }
    };

    const handleDismissReport = async (reportId) => {
        try {
            await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId);
            addToast('却下しました', 'success');
            fetchAllData();
        } catch (error) {
            addToast('更新に失敗しました', 'error');
        }
    };

    // Trend indicator
    const TrendBadge = ({ today, yesterday }) => {
        const diff = today - yesterday;
        if (diff > 0) return <span className="text-green-600 text-xs flex items-center gap-0.5"><TrendingUp size={12} />+{diff}</span>;
        if (diff < 0) return <span className="text-red-600 text-xs flex items-center gap-0.5"><TrendingDown size={12} />{diff}</span>;
        return <span className="text-slate-400 text-xs flex items-center gap-0.5"><Minus size={12} />±0</span>;
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
                    <div className="flex justify-center mb-6">
                        <div className="bg-slate-100 p-4 rounded-full">
                            <Shield size={48} className="text-slate-700" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center mb-6 text-slate-800">管理画面</h1>
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="管理者PINコード"
                        className="w-full p-3 border border-slate-300 rounded-lg text-center text-lg tracking-widest mb-4"
                        autoFocus
                    />
                    <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-700">
                        認証
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                    <h1 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                        <Shield size={20} />
                        あんしんレシピ 管理画面
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-500">
                            {new Date().toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button onClick={fetchAllData} disabled={loading} className="p-2 hover:bg-slate-100 rounded-full">
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                            GA4
                        </a>
                        <button
                            onClick={() => { setIsAuthenticated(false); sessionStorage.removeItem('admin_pin'); }}
                            className="text-xs text-red-500 hover:text-red-700"
                        >
                            ログアウト
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {/* Daily KPIs Row */}
                <div className="grid grid-cols-6 gap-4 mb-6">
                    {[
                        { icon: Users, label: '新規登録', key: 'newUsers', color: 'blue' },
                        { icon: BookOpen, label: 'レシピ投稿', key: 'recipes', color: 'green' },
                        { icon: Bookmark, label: '保存', key: 'saves', color: 'orange' },
                        { icon: Heart, label: 'いいね！', key: 'likes', color: 'pink' },
                        { icon: MessageSquare, label: 'つくれぽ', key: 'tried', color: 'purple' },
                        { icon: Baby, label: '登録子供', key: null, color: 'slate', total: analytics?.totals?.children }
                    ].map(({ icon: Icon, label, key, color, total }) => (
                        <div key={label} className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <Icon size={16} className={`text-${color}-500`} />
                                {key && analytics?.daily?.[key] && (
                                    <TrendBadge today={analytics.daily[key].today} yesterday={analytics.daily[key].yesterday} />
                                )}
                            </div>
                            <div className="text-2xl font-bold text-slate-800">
                                {key ? (analytics?.daily?.[key]?.today ?? '-') : (total ?? '-')}
                            </div>
                            <div className="text-xs text-slate-500">{label}</div>
                        </div>
                    ))}
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Column 1: Funnel + Totals */}
                    <div className="space-y-6">
                        {/* Totals */}
                        <div className="bg-white rounded-xl p-5 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-600 mb-4">📈 累計</h2>
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-slate-800">{analytics?.totals?.users ?? '-'}</div>
                                    <div className="text-xs text-slate-500">ユーザー</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-800">{analytics?.totals?.recipes ?? '-'}</div>
                                    <div className="text-xs text-slate-500">レシピ</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-800">{analytics?.totals?.children ?? '-'}</div>
                                    <div className="text-xs text-slate-500">お子様</div>
                                </div>
                            </div>
                        </div>

                        {/* Funnel */}
                        <div className="bg-white rounded-xl p-5 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-600 mb-4">🔄 ファネル</h2>
                            <div className="space-y-2">
                                {[
                                    { label: '登録', value: analytics?.funnel?.registered, color: 'bg-blue-500' },
                                    { label: '子供登録', value: analytics?.funnel?.childAdded, color: 'bg-green-500' },
                                    { label: '初保存', value: analytics?.funnel?.firstSave, color: 'bg-orange-500' },
                                    { label: '初投稿', value: analytics?.funnel?.firstRecipe, color: 'bg-pink-500' }
                                ].map((step, i, arr) => {
                                    const max = arr[0].value || 1;
                                    const pct = Math.round((step.value / max) * 100) || 0;
                                    return (
                                        <div key={step.label}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-600">{step.label}</span>
                                                <span className="font-bold">{step.value ?? '-'}</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${step.color}`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Smart Import */}
                        <div className="bg-white rounded-xl p-5 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-600 mb-3">🛠️ Smart Import</h2>
                            <div className="flex justify-between items-center">
                                <div className="text-xs text-slate-500">過去7日</div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-800">
                                        {analytics?.features?.smartImport?.successes ?? 0} / {analytics?.features?.smartImport?.starts ?? 0}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        成功率: {analytics?.features?.smartImport?.starts > 0
                                            ? Math.round((analytics.features.smartImport.successes / analytics.features.smartImport.starts) * 100)
                                            : 0}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Reports */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <AlertTriangle size={16} className="text-red-500" />
                                通報 ({reports.filter(r => r.status === 'pending').length})
                            </h2>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {reports.filter(r => r.status === 'pending').length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">未対応の通報はありません</div>
                            ) : (
                                reports.filter(r => r.status === 'pending').map(report => (
                                    <div key={report.id} className="p-4 border-b hover:bg-slate-50">
                                        <div className="flex gap-3">
                                            <img src={report.recipe?.image_url || '/placeholder.png'} className="w-12 h-12 rounded object-cover" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-slate-800 truncate">{report.recipe?.title}</div>
                                                <div className="text-xs text-red-500 mt-1">{report.reason}</div>
                                                <div className="flex gap-2 mt-2">
                                                    <button onClick={() => handleDeleteRecipe(report.recipe?.id, report.id)} className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                                                        削除
                                                    </button>
                                                    <button onClick={() => handleDismissReport(report.id)} className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">
                                                        却下
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Column 3: Recent Activity */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <CheckCircle size={16} className="text-green-500" />
                                最近のつくレポ
                            </h2>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {triedReports.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">まだつくレポはありません</div>
                            ) : (
                                triedReports.map(report => (
                                    <div key={report.id} className="p-3 border-b hover:bg-slate-50">
                                        <div className="flex gap-2">
                                            {report.image_url ? (
                                                <img src={report.image_url} className="w-10 h-10 rounded object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-sm">📄</div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between">
                                                    <span className="text-xs font-bold text-slate-800">{report.user?.username}</span>
                                                    <span className="text-[10px] text-slate-400">{new Date(report.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 truncate">→ {report.recipe?.title}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Weekly Trend */}
                <div className="mt-6 bg-white rounded-xl p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-600 mb-4">📊 新規登録（過去7日）</h2>
                    <div className="flex items-end justify-between h-20 gap-2">
                        {analytics?.weekly?.usersByDay?.map((day, i) => {
                            const maxCount = Math.max(...(analytics?.weekly?.usersByDay?.map(d => d.count) || [1]));
                            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                            const isToday = i === analytics.weekly.usersByDay.length - 1;
                            return (
                                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                                    <div className="text-xs font-bold text-slate-600">{day.count}</div>
                                    <div
                                        className={`w-full rounded-t ${isToday ? 'bg-blue-500' : 'bg-slate-300'}`}
                                        style={{ height: `${Math.max(height, 8)}%` }}
                                    />
                                    <div className="text-[10px] text-slate-500">{new Date(day.date).getDate()}日</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Allergen Distribution */}
                {stats?.allergens && stats.allergens.length > 0 && (
                    <div className="mt-6 bg-white rounded-xl p-5 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-600 mb-4">🥜 アレルゲン分布</h2>
                        <div className="grid grid-cols-4 gap-3">
                            {stats.allergens.map(a => (
                                <div key={a.name} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-700">{a.name}</span>
                                    <span className="font-bold text-slate-800">{a.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;
