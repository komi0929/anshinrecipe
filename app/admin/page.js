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
            // Fetch Inappropriate Reports
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

            // Fetch Tried Reports (Tsukurepo)
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
            addToast('レポートの取得に失敗しました', 'error');
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
                        <button
                            onClick={fetchReports}
                            className="text-sm font-bold text-slate-600 hover:text-slate-900"
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
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-red-500" />
                        通報されたレシピ
                    </h2>

                    {loading ? (
                        <div className="text-center py-10 text-slate-500">読み込み中...</div>
                    ) : reports.length === 0 ? (
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
                                    {report.status !== 'pending' && (
                                        <div className="text-right text-sm font-bold text-slate-400">
                                            {report.status === 'resolved' ? '削除済み' : '却下済み'}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Tried Reports Section */}
                    <div>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <CheckCircle className="text-primary" />
                            最近のつくレポ (最新20件)
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

                    {/* Analytics Section */}
                    <div>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <ExternalLink className="text-blue-500" />
                            アクセス解析
                        </h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                            <p className="text-sm text-slate-600 mb-4">
                                Google Analytics (GA4) を使用して、アプリの利用状況を確認できます。
                                リアルタイムのユーザー数、人気のレシピ、流入元などを分析可能です。
                            </p>
                            <a
                                href="https://analytics.google.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-center font-bold py-3 rounded-xl transition-colors"
                            >
                                Google Analyticsを開く
                            </a>
                            <p className="text-xs text-slate-400 mt-4 text-center">
                                ※GA4の計測ID: {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '未設定'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
