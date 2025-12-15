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
            const { data, error } = await supabase
                .from('reports')
                .select(`
                    *,
                    recipe:recipes!recipe_id (
                        id,
                        title,
                        image_url,
                        user_id
                    ),
                    reporter:profiles!reporter_id (
                        username
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReports(data || []);
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
                        <div className="bg-white rounded-lg p-10 text-center text-slate-500 shadow-sm">
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
            </div>
        </div>
    );
};

export default AdminPage;
