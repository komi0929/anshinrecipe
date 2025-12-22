'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AdminPage = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [analytics, setAnalytics] = useState(null);
    const [stats, setStats] = useState(null);
    const [reports, setReports] = useState([]);
    const [triedReports, setTriedReports] = useState([]);

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
        }
    };

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [analyticsRes, statsRes] = await Promise.all([
                fetch('/api/admin/analytics'),
                fetch('/api/admin/stats')
            ]);
            if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
            if (statsRes.ok) setStats(await statsRes.json());

            const { data: reportData } = await supabase
                .from('reports')
                .select(`*, recipe:recipes!recipe_id (id, title, image_url), reporter:profiles!reporter_id (username)`)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            setReports(reportData || []);

            const { data: triedData } = await supabase
                .from('tried_reports')
                .select(`*, recipe:recipes!recipe_id (id, title), user:profiles!user_id (username)`)
                .order('created_at', { ascending: false })
                .limit(8);
            setTriedReports(triedData || []);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRecipe = async (recipeId, reportId) => {
        if (!confirm('削除しますか？')) return;
        await supabase.from('recipes').delete().eq('id', recipeId);
        await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId);
        fetchAllData();
    };

    const handleDismiss = async (reportId) => {
        await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId);
        fetchAllData();
    };

    // Login Screen
    if (!isAuthenticated) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <form onSubmit={handleLogin} style={{
                    background: '#0f0f23',
                    padding: '48px',
                    borderRadius: '16px',
                    width: '380px',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                }}>
                    <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '32px', textAlign: 'center' }}>
                        🔐 Admin Dashboard
                    </h1>
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="Enter PIN"
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: '#1a1a2e',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '18px',
                            textAlign: 'center',
                            letterSpacing: '8px',
                            marginBottom: '16px',
                            outline: 'none'
                        }}
                        autoFocus
                    />
                    <button type="submit" style={{
                        width: '100%',
                        padding: '16px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}>
                        ログイン
                    </button>
                </form>
            </div>
        );
    }

    // Dashboard
    const d = analytics?.daily || {};
    const t = analytics?.totals || {};
    const f = analytics?.funnel || {};
    const w = analytics?.weekly?.usersByDay || [];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
            color: '#e0e0e0',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            {/* Header */}
            <header style={{
                background: 'rgba(15,15,35,0.9)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid #2a2a4a',
                padding: '16px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>
                    📊 あんしんレシピ Dashboard
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <span style={{ color: '#888', fontSize: '13px' }}>
                        {new Date().toLocaleString('ja-JP')}
                    </span>
                    <button onClick={fetchAllData} disabled={loading} style={{
                        background: '#2a2a4a',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '13px'
                    }}>
                        {loading ? '⏳' : '🔄'} Refresh
                    </button>
                    <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" style={{
                        color: '#667eea',
                        textDecoration: 'none',
                        fontSize: '13px'
                    }}>
                        GA4 →
                    </a>
                    <button onClick={() => { setIsAuthenticated(false); sessionStorage.removeItem('admin_pin'); }} style={{
                        background: 'transparent',
                        border: '1px solid #444',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        color: '#888',
                        cursor: 'pointer',
                        fontSize: '13px'
                    }}>
                        Logout
                    </button>
                </div>
            </header>

            <main style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto' }}>
                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '32px' }}>
                    {[
                        { label: '新規登録', today: d.newUsers?.today, yesterday: d.newUsers?.yesterday, icon: '👤', color: '#667eea' },
                        { label: 'レシピ投稿', today: d.recipes?.today, yesterday: d.recipes?.yesterday, icon: '📝', color: '#10b981' },
                        { label: '保存', today: d.saves?.today, yesterday: d.saves?.yesterday, icon: '🔖', color: '#f59e0b' },
                        { label: 'いいね', today: d.likes?.today, yesterday: d.likes?.yesterday, icon: '❤️', color: '#ef4444' },
                        { label: 'つくれぽ', today: d.tried?.today, yesterday: d.tried?.yesterday, icon: '✨', color: '#8b5cf6' }
                    ].map(kpi => {
                        const diff = (kpi.today ?? 0) - (kpi.yesterday ?? 0);
                        return (
                            <div key={kpi.label} style={{
                                background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
                                borderRadius: '16px',
                                padding: '24px',
                                border: '1px solid #2a2a4a'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '24px' }}>{kpi.icon}</span>
                                    <span style={{
                                        fontSize: '12px',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        background: diff > 0 ? 'rgba(16,185,129,0.2)' : diff < 0 ? 'rgba(239,68,68,0.2)' : 'rgba(100,100,100,0.2)',
                                        color: diff > 0 ? '#10b981' : diff < 0 ? '#ef4444' : '#888'
                                    }}>
                                        {diff > 0 ? `+${diff}` : diff < 0 ? diff : '±0'}
                                    </span>
                                </div>
                                <div style={{ fontSize: '36px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                                    {kpi.today ?? 0}
                                </div>
                                <div style={{ fontSize: '13px', color: '#888' }}>{kpi.label}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Main Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '24px' }}>
                    {/* Totals */}
                    <div style={{ background: 'linear-gradient(145deg, #1a1a2e, #16213e)', borderRadius: '16px', padding: '24px', border: '1px solid #2a2a4a' }}>
                        <h2 style={{ fontSize: '14px', color: '#888', marginBottom: '20px', fontWeight: 600 }}>📈 TOTALS</h2>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {[
                                { label: 'ユーザー', value: t.users, color: '#667eea' },
                                { label: 'レシピ', value: t.recipes, color: '#10b981' },
                                { label: '登録子供', value: t.children, color: '#f59e0b' }
                            ].map(item => (
                                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#888', fontSize: '14px' }}>{item.label}</span>
                                    <span style={{ color: '#fff', fontSize: '24px', fontWeight: 700 }}>{item.value ?? '-'}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Funnel */}
                    <div style={{ background: 'linear-gradient(145deg, #1a1a2e, #16213e)', borderRadius: '16px', padding: '24px', border: '1px solid #2a2a4a' }}>
                        <h2 style={{ fontSize: '14px', color: '#888', marginBottom: '20px', fontWeight: 600 }}>🔄 FUNNEL</h2>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {[
                                { label: '登録', value: f.registered, color: '#667eea' },
                                { label: '子供登録', value: f.childAdded, color: '#10b981' },
                                { label: '初保存', value: f.firstSave, color: '#f59e0b' },
                                { label: '初投稿', value: f.firstRecipe, color: '#ef4444' }
                            ].map((step, i, arr) => {
                                const max = arr[0].value || 1;
                                const pct = Math.round((step.value / max) * 100) || 0;
                                const prev = i > 0 ? arr[i - 1].value : step.value;
                                const cvr = prev > 0 ? Math.round((step.value / prev) * 100) : 0;
                                return (
                                    <div key={step.label}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '12px', color: '#888' }}>{step.label}</span>
                                            <span style={{ fontSize: '12px', color: '#fff' }}>{step.value ?? 0} {i > 0 && <span style={{ color: '#666' }}>({cvr}%)</span>}</span>
                                        </div>
                                        <div style={{ height: '6px', background: '#2a2a4a', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: step.color, transition: 'width 0.5s' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Weekly Trend */}
                    <div style={{ background: 'linear-gradient(145deg, #1a1a2e, #16213e)', borderRadius: '16px', padding: '24px', border: '1px solid #2a2a4a' }}>
                        <h2 style={{ fontSize: '14px', color: '#888', marginBottom: '20px', fontWeight: 600 }}>📊 WEEKLY SIGNUPS</h2>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '120px', gap: '8px' }}>
                            {w.map((day, i) => {
                                const max = Math.max(...w.map(d => d.count)) || 1;
                                const h = (day.count / max) * 100;
                                const isToday = i === w.length - 1;
                                return (
                                    <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>{day.count}</span>
                                        <div style={{
                                            width: '100%',
                                            height: `${Math.max(h, 8)}%`,
                                            background: isToday ? 'linear-gradient(180deg, #667eea, #764ba2)' : '#3a3a5a',
                                            borderRadius: '4px 4px 0 0'
                                        }} />
                                        <span style={{ fontSize: '10px', color: '#666' }}>{new Date(day.date).getDate()}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Allergens */}
                    <div style={{ background: 'linear-gradient(145deg, #1a1a2e, #16213e)', borderRadius: '16px', padding: '24px', border: '1px solid #2a2a4a' }}>
                        <h2 style={{ fontSize: '14px', color: '#888', marginBottom: '20px', fontWeight: 600 }}>🥜 ALLERGENS</h2>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            {(stats?.allergens || []).slice(0, 6).map(a => (
                                <div key={a.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '13px', color: '#aaa' }}>{a.name}</span>
                                    <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{a.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Reports & Activity Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                    {/* Reports */}
                    <div style={{ background: 'linear-gradient(145deg, #1a1a2e, #16213e)', borderRadius: '16px', border: '1px solid #2a2a4a', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #2a2a4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '14px', color: '#888', fontWeight: 600 }}>⚠️ REPORTS ({reports.length})</h2>
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {reports.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No pending reports</div>
                            ) : reports.map(r => (
                                <div key={r.id} style={{ padding: '16px 24px', borderBottom: '1px solid #2a2a4a', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <img src={r.recipe?.image_url || '/placeholder.png'} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>{r.recipe?.title}</div>
                                        <div style={{ color: '#ef4444', fontSize: '12px' }}>{r.reason}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleDeleteRecipe(r.recipe?.id, r.id)} style={{ background: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>削除</button>
                                        <button onClick={() => handleDismiss(r.id)} style={{ background: '#333', border: 'none', padding: '6px 12px', borderRadius: '6px', color: '#888', fontSize: '12px', cursor: 'pointer' }}>却下</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div style={{ background: 'linear-gradient(145deg, #1a1a2e, #16213e)', borderRadius: '16px', border: '1px solid #2a2a4a', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #2a2a4a' }}>
                            <h2 style={{ fontSize: '14px', color: '#888', fontWeight: 600 }}>✨ RECENT ACTIVITY</h2>
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {triedReports.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No activity yet</div>
                            ) : triedReports.map(r => (
                                <div key={r.id} style={{ padding: '12px 24px', borderBottom: '1px solid #2a2a4a', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    {r.image_url ? (
                                        <img src={r.image_url} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#2a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📄</div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: '#fff', fontSize: '13px' }}>{r.user?.username}</div>
                                        <div style={{ color: '#666', fontSize: '11px' }}>→ {r.recipe?.title}</div>
                                    </div>
                                    <div style={{ color: '#666', fontSize: '11px' }}>{new Date(r.created_at).toLocaleDateString()}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminPage;
