'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Shield, Trash2, ExternalLink, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

const AdminPage = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [reports, setReports] = useState([]);
    const [triedReports, setTriedReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null); // Add stats state
    const { addToast } = useToast();

    // Check for existing session
    useEffect(() => {
        const sessionPin = sessionStorage.getItem('admin_pin');
        if (sessionPin === process.env.NEXT_PUBLIC_ADMIN_PIN) {
            setIsAuthenticated(true);
            fetchReports();
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        if (pin === process.env.NEXT_PUBLIC_ADMIN_PIN) {
            setIsAuthenticated(true);
            sessionStorage.setItem('admin_pin', pin);
            fetchReports();
            addToast('管理者としてログインしました', 'success');
        } else {
            addToast('PINコードが間違っています', 'error');
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            // 1. Fetch Stats from API (Bypassing RLS)
            const statsRes = await fetch('/api/admin/stats');
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            // 2. Fetch Inappropriate Reports
            const { data: reportData, error: reportError } = await supabase
                .from('reports')
                .select(`
                    *,
                    recipe:recipes!recipe_id (id, title, image_url, user_id),
                    reporter:profiles!reporter_id (username)
                `)
                .order('created_at', { ascending: false });

            if (reportError) throw reportError;
            setReports(reportData || []);

            // 3. Fetch Tried Reports (Tsukurepo)
            const { data: triedData, error: triedError } = await supabase
                .from('tried_reports')
                .select(`
                    *,
                    recipe:recipes!recipe_id (id, title),
                    user:profiles!user_id (username)
                `)
                .order('created_at', { ascending: false })
                .limit(20);

            if (triedError) throw triedError;
            setTriedReports(triedData || []);

        } catch (error) {
            console.error('Error fetching reports:', error);
            addToast('データの取得に失敗しました', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRecipe = async (recipeId, reportId) => {
        if (!confirm('このレシピを本当に削除しますか？取り消せません。')) return;

        try {
            // Delete recipe
            const { error: deleteError } = await supabase
                .from('recipes')
                .delete()
                .eq('id', recipeId);

            if (deleteError) throw deleteError;

            // Update report status
            const { error: updateError } = await supabase
                .from('reports')
                .update({ status: 'resolved' })
                .eq('id', reportId);

            if (updateError) throw updateError;

            addToast('レシピを削除しました', 'success');
            fetchReports(); // Refresh
        } catch (error) {
            console.error('Error deleting recipe:', error);
            addToast('削除に失敗しました', 'error');
        }
    };

    const handleDismissReport = async (reportId) => {
        try {
            const { error } = await supabase
                .from('reports')
                .update({ status: 'dismissed' })
                .eq('id', reportId);

            if (error) throw error;

            addToast('レポートを却下しました', 'success');
            fetchReports();
        } catch (error) {
            console.error('Error dismissing report:', error);
            addToast('更新に失敗しました', 'error');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
                    <div className="flex justify-center mb-6">
                        <div className="bg-slate-100 p-4 rounded-full">
                            <Shield size={48} className="text-slate-700" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center mb-6 text-slate-800">管理画面ログイン</h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="管理者PINコード"
                            className="w-full p-3 border border-slate-300 rounded-lg text-center text-lg tracking-widest"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-700 transition-colors"
                        >
                            認証
                        </button>
                    </form>
                    <div className="mt-6 text-center">
                        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
                            トップページに戻る
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="font-bold text-xl flex items-center gap-2 text-slate-800">
                        <Shield size={24} />
                        Anshin Admin
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-500 hidden sm:inline">
                            最終更新: {new Date().toLocaleTimeString()}
                        </span>
                        <button
                            onClick={fetchReports}
                            disabled={loading}
                            className="text-sm font-bold text-slate-600 hover:text-slate-900 disabled:opacity-50"
                        >
                            更新
                        </button>
                        <button
                            onClick={() => {
                                setIsAuthenticated(false);
                                sessionStorage.removeItem('admin_pin');
                            }}
                            className="text-sm font-bold text-red-500 hover:text-red-700"
                        >
                            ログアウト
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">

                {/* 1. KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-slate-500 text-xs font-bold uppercase mb-2">総ユーザー数</h3>
                        <div className="text-3xl font-extrabold text-slate-800">
                            {stats?.stats?.users?.toLocaleString() ?? '-'}
                            <span className="text-sm text-slate-400 font-normal ml-1">人</span>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-slate-500 text-xs font-bold uppercase mb-2">公開レシピ数</h3>
                        <div className="text-3xl font-extrabold text-slate-800">
                            {stats?.stats?.recipes?.toLocaleString() ?? '-'}
                            <span className="text-sm text-slate-400 font-normal ml-1">件</span>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-slate-500 text-xs font-bold uppercase mb-2">登録お子様数</h3>
                        <div className="text-3xl font-extrabold text-slate-800">
                            {stats?.stats?.active_children?.toLocaleString() ?? '-'}
                            <span className="text-sm text-slate-400 font-normal ml-1">人</span>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-slate-500 text-xs font-bold uppercase mb-2">累計つくレポ</h3>
                        <div className="text-3xl font-extrabold text-slate-800">
                            {stats?.stats?.tsukurepos?.toLocaleString() ?? '-'}
                            <span className="text-sm text-slate-400 font-normal ml-1">件</span>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left Column: Analytics & Charts */}
                    <div className="md:col-span-2 space-y-8">

                        {/* Allergen Distribution Chart */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                                <AlertTriangle size={20} className="text-orange-500" />
                                登録アレルギー分布
                            </h2>
                            {stats?.allergens ? (
                                <div className="space-y-4">
                                    {stats.allergens.map((item, index) => {
                                        const maxVal = Math.max(...stats.allergens.map(a => a.count));
                                        const percentage = Math.round((item.count / (stats.stats?.active_children || 1)) * 100);
                                        return (
                                            <div key={item.name} className="flex items-center gap-4">
                                                <div className="w-16 text-sm font-bold text-slate-700">{item.name}</div>
                                                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-orange-400 rounded-full"
                                                        style={{ width: `${(item.count / maxVal) * 100}%` }}
                                                    />
                                                </div>
                                                <div className="w-16 text-right text-sm text-slate-500">
                                                    <span className="font-bold text-slate-800">{item.count}</span>
                                                    <span className="text-xs ml-1">({percentage}%)</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400">データなし</div>
                            )}
                        </div>

                        {/* Reports Section (Existing) */}
                        <div>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 bg-red-50 p-3 rounded-lg text-red-800">
                                <AlertTriangle className="text-red-500" />
                                通報対応待ち
                                {reports.filter(r => r.status === 'pending').length > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">
                                        {reports.filter(r => r.status === 'pending').length}
                                    </span>
                                )}
                            </h2>

                            {/* ... Reports List ... */}
                            {reports.length === 0 ? (
                                <div className="bg-white rounded-lg p-10 text-center text-slate-500 shadow-sm border border-slate-100">
                                    <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500" />
                                    <p>現在、未対応の通報はありません</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {reports.map((report) => (
                                        <div key={report.id} className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${report.status === 'resolved' ? 'border-l-slate-400 opacity-60' : 'border-l-red-500'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded text-slate-600 mr-2">
                                                        {new Date(report.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-xs font-bold px-2 py-1 bg-red-50 text-red-600 rounded">
                                                        {report.reason}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    Reporter: {report.reporter?.username || 'Unknown'}
                                                </div>
                                            </div>

                                            <p className="text-sm text-slate-700 mb-4 bg-slate-50 p-3 rounded">
                                                "{report.details || '詳細なし'}"
                                            </p>

                                            {report.recipe && (
                                                <div className="flex gap-4 items-center bg-white border rounded-lg p-3 mb-4">
                                                    {report.recipe.image_url && (
                                                        <img
                                                            src={report.recipe.image_url}
                                                            alt=""
                                                            className="w-16 h-16 object-cover rounded"
                                                        />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-slate-800 truncate">{report.recipe.title}</h4>
                                                        <Link
                                                            href={`/recipe/${report.recipe.id}`}
                                                            target="_blank"
                                                            className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                                                        >
                                                            ページを確認 <ExternalLink size={10} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            )}

                                            {report.status === 'pending' && (
                                                <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
                                                    <button
                                                        onClick={() => handleDismissReport(report.id)}
                                                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                                                    >
                                                        異常なし（無視）
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRecipe(report.recipe.id, report.id)}
                                                        className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2"
                                                    >
                                                        <Trash2 size={16} />
                                                        レシピを削除
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Activity & GA */}
                    <div className="space-y-8">
                        {/* GA4 Link */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                            <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-500 uppercase">
                                <ExternalLink size={16} />
                                アクセス解析
                            </h2>
                            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                                リアルタイムのユーザー数や検索キーワードはGoogle Analyticsで確認してください。
                            </p>
                            <a
                                href="https://analytics.google.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-center font-bold py-3 rounded-xl transition-colors shadow-blue-100 shadow-lg"
                            >
                                Google Analyticsを開く
                            </a>
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <p className="text-[10px] text-slate-400 text-center">
                                    Measurement ID: {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '未設定'}
                                </p>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
                                <CheckCircle className="text-primary" />
                                最近のつくレポ
                            </h2>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                {triedReports.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400">まだつくレポはありません</div>
                                ) : (
                                    <ul className="divide-y divide-slate-100">
                                        {triedReports.map((report) => (
                                            <li key={report.id} className="p-4 hover:bg-slate-50 transition-colors">
                                                <div className="flex gap-3">
                                                    {report.image_url ? (
                                                        <img src={report.image_url} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center text-xl">📄</div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-sm font-bold text-slate-800 line-clamp-1">{report.user?.username || 'Unknown'}</span>
                                                            <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(report.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mb-1">to: {report.recipe?.title}</p>
                                                        <p className="text-sm text-slate-700 line-clamp-2">"{report.comment || 'コメントなし'}"</p>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
