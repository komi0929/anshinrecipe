'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Minus,
    Users, BookOpen, Bookmark, Heart, MessageSquare, Baby,
    ArrowRight, Zap, BarChart3
} from 'lucide-react';

const DashboardPage = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);

    useEffect(() => {
        const sessionPin = sessionStorage.getItem('admin_pin');
        if (sessionPin === process.env.NEXT_PUBLIC_ADMIN_PIN) {
            setIsAuthenticated(true);
            fetchData();
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        if (pin === process.env.NEXT_PUBLIC_ADMIN_PIN) {
            setIsAuthenticated(true);
            sessionStorage.setItem('admin_pin', pin);
            fetchData();
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/analytics');
            if (res.ok) {
                const json = await res.json();
                setData(json);
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    // Trend indicator component
    const TrendBadge = ({ today, yesterday }) => {
        const diff = today - yesterday;
        if (diff > 0) {
            return (
                <span className="flex items-center gap-0.5 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                    <TrendingUp size={12} />
                    +{diff}
                </span>
            );
        } else if (diff < 0) {
            return (
                <span className="flex items-center gap-0.5 text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                    <TrendingDown size={12} />
                    {diff}
                </span>
            );
        }
        return (
            <span className="flex items-center gap-0.5 text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-full">
                <Minus size={12} />
                ±0
            </span>
        );
    };

    // KPI Card component
    const KPICard = ({ icon: Icon, title, value, subtitle, today, yesterday, color = 'slate' }) => {
        const colorClasses = {
            slate: 'bg-slate-100 text-slate-600',
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            orange: 'bg-orange-100 text-orange-600',
            pink: 'bg-pink-100 text-pink-600',
            purple: 'bg-purple-100 text-purple-600'
        };

        return (
            <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                        <Icon size={18} />
                    </div>
                    {today !== undefined && yesterday !== undefined && (
                        <TrendBadge today={today} yesterday={yesterday} />
                    )}
                </div>
                <div className="text-2xl font-bold text-slate-800">{value}</div>
                <div className="text-xs text-slate-500">{title}</div>
                {subtitle && <div className="text-[10px] text-slate-400 mt-1">{subtitle}</div>}
            </div>
        );
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
                    <div className="flex justify-center mb-6">
                        <div className="bg-slate-100 p-4 rounded-full">
                            <BarChart3 size={48} className="text-slate-700" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center mb-6 text-slate-800">ダッシュボード</h1>
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="管理者PINコード"
                        className="w-full p-3 border border-slate-300 rounded-lg text-center text-lg tracking-widest mb-4"
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-700"
                    >
                        認証
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow sticky top-0 z-10">
                <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin" className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
                            <ArrowLeft size={20} className="text-slate-600" />
                        </Link>
                        <h1 className="font-bold text-lg text-slate-800">📊 ダッシュボード</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {lastUpdate && (
                            <span className="text-xs text-slate-500">
                                {lastUpdate.toLocaleTimeString()}
                            </span>
                        )}
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="p-2 hover:bg-slate-100 rounded-full disabled:opacity-50"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-3xl">
                {/* Daily KPIs */}
                <section className="mb-8">
                    <h2 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                        📅 今日のKPI
                        <span className="text-xs font-normal text-slate-400">vs 昨日</span>
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <KPICard
                            icon={Users}
                            title="新規登録"
                            value={data?.daily?.newUsers?.today || 0}
                            today={data?.daily?.newUsers?.today}
                            yesterday={data?.daily?.newUsers?.yesterday}
                            color="blue"
                        />
                        <KPICard
                            icon={BookOpen}
                            title="レシピ投稿"
                            value={data?.daily?.recipes?.today || 0}
                            today={data?.daily?.recipes?.today}
                            yesterday={data?.daily?.recipes?.yesterday}
                            color="green"
                        />
                        <KPICard
                            icon={Bookmark}
                            title="保存"
                            value={data?.daily?.saves?.today || 0}
                            today={data?.daily?.saves?.today}
                            yesterday={data?.daily?.saves?.yesterday}
                            color="orange"
                        />
                        <KPICard
                            icon={Heart}
                            title="いいね！"
                            value={data?.daily?.likes?.today || 0}
                            today={data?.daily?.likes?.today}
                            yesterday={data?.daily?.likes?.yesterday}
                            color="pink"
                        />
                        <KPICard
                            icon={MessageSquare}
                            title="つくれぽ"
                            value={data?.daily?.tried?.today || 0}
                            today={data?.daily?.tried?.today}
                            yesterday={data?.daily?.tried?.yesterday}
                            color="purple"
                        />
                    </div>
                </section>

                {/* Totals */}
                <section className="mb-8">
                    <h2 className="text-sm font-bold text-slate-600 mb-3">📈 累計</h2>
                    <div className="grid grid-cols-3 gap-3">
                        <KPICard
                            icon={Users}
                            title="総ユーザー"
                            value={data?.totals?.users || 0}
                            color="slate"
                        />
                        <KPICard
                            icon={BookOpen}
                            title="総レシピ"
                            value={data?.totals?.recipes || 0}
                            color="slate"
                        />
                        <KPICard
                            icon={Baby}
                            title="登録お子様"
                            value={data?.totals?.children || 0}
                            color="slate"
                        />
                    </div>
                </section>

                {/* Funnel */}
                <section className="mb-8">
                    <h2 className="text-sm font-bold text-slate-600 mb-3">🔄 ユーザーファネル</h2>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="space-y-3">
                            {[
                                { label: '登録完了', value: data?.funnel?.registered || 0, color: 'bg-blue-500' },
                                { label: '子供登録', value: data?.funnel?.childAdded || 0, color: 'bg-green-500' },
                                { label: '初保存', value: data?.funnel?.firstSave || 0, color: 'bg-orange-500' },
                                { label: '初投稿', value: data?.funnel?.firstRecipe || 0, color: 'bg-pink-500' }
                            ].map((step, i, arr) => {
                                const maxValue = arr[0].value || 1;
                                const percentage = Math.round((step.value / maxValue) * 100);
                                const prevValue = i > 0 ? arr[i - 1].value : step.value;
                                const convRate = prevValue > 0 ? Math.round((step.value / prevValue) * 100) : 0;

                                return (
                                    <div key={step.label}>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="font-medium text-slate-700">{step.label}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">{step.value}</span>
                                                {i > 0 && (
                                                    <span className="text-xs text-slate-400">
                                                        ({convRate}%)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${step.color} transition-all duration-500`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Feature Usage */}
                <section className="mb-8">
                    <h2 className="text-sm font-bold text-slate-600 mb-3">🛠️ 機能利用（過去7日）</h2>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                    <Zap size={18} />
                                </div>
                                <div>
                                    <div className="font-medium text-slate-700">Smart Import</div>
                                    <div className="text-xs text-slate-500">URL貼り付けからの自動解析</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-slate-800">
                                    {data?.features?.smartImport?.successes || 0}
                                    <span className="text-slate-400 font-normal"> / </span>
                                    {data?.features?.smartImport?.starts || 0}
                                </div>
                                <div className="text-xs text-slate-500">
                                    成功率: {
                                        data?.features?.smartImport?.starts > 0
                                            ? Math.round((data.features.smartImport.successes / data.features.smartImport.starts) * 100)
                                            : 0
                                    }%
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Weekly Trend (Simple bar chart) */}
                <section className="mb-8">
                    <h2 className="text-sm font-bold text-slate-600 mb-3">📊 新規登録（過去7日）</h2>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-end justify-between h-24 gap-2">
                            {data?.weekly?.usersByDay?.map((day, i) => {
                                const maxCount = Math.max(...(data?.weekly?.usersByDay?.map(d => d.count) || [1]));
                                const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                                const isToday = i === data.weekly.usersByDay.length - 1;

                                return (
                                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                                        <div className="text-[10px] font-bold text-slate-600">{day.count}</div>
                                        <div
                                            className={`w-full rounded-t transition-all ${isToday ? 'bg-blue-500' : 'bg-slate-300'}`}
                                            style={{ height: `${Math.max(height, 4)}%` }}
                                        />
                                        <div className="text-[9px] text-slate-500">
                                            {new Date(day.date).getDate()}日
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Quick Actions */}
                <section>
                    <div className="flex gap-3">
                        <Link
                            href="/admin"
                            className="flex-1 bg-white rounded-xl p-4 shadow-sm flex items-center justify-between hover:bg-slate-50"
                        >
                            <span className="font-medium text-slate-700">管理画面</span>
                            <ArrowRight size={18} className="text-slate-400" />
                        </Link>
                        <a
                            href="https://analytics.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-white rounded-xl p-4 shadow-sm flex items-center justify-between hover:bg-slate-50"
                        >
                            <span className="font-medium text-slate-700">Google Analytics</span>
                            <ArrowRight size={18} className="text-slate-400" />
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default DashboardPage;
