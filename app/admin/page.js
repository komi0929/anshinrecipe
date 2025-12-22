'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminPage() {
    const [auth, setAuth] = useState(false);
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [stats, setStats] = useState(null);
    const [reports, setReports] = useState([]);
    const [activity, setActivity] = useState([]);

    useEffect(() => {
        const p = sessionStorage.getItem('admin_pin');
        if (p === process.env.NEXT_PUBLIC_ADMIN_PIN) {
            setAuth(true);
            load();
        }
    }, []);

    const login = (e) => {
        e.preventDefault();
        if (pin === process.env.NEXT_PUBLIC_ADMIN_PIN) {
            setAuth(true);
            sessionStorage.setItem('admin_pin', pin);
            load();
        }
    };

    const load = async () => {
        setLoading(true);
        const [a, s] = await Promise.all([
            fetch('/api/admin/analytics').then(r => r.json()).catch(() => null),
            fetch('/api/admin/stats').then(r => r.json()).catch(() => null)
        ]);
        setData(a);
        setStats(s);

        const { data: reps } = await supabase.from('reports')
            .select('*, recipe:recipes!recipe_id(id,title,image_url), reporter:profiles!reporter_id(username)')
            .eq('status', 'pending').order('created_at', { ascending: false });
        setReports(reps || []);

        const { data: acts } = await supabase.from('tried_reports')
            .select('*, recipe:recipes!recipe_id(id,title), user:profiles!user_id(username)')
            .order('created_at', { ascending: false }).limit(10);
        setActivity(acts || []);
        setLoading(false);
    };

    const del = async (rid, repid) => {
        if (!confirm('削除？')) return;
        await supabase.from('recipes').delete().eq('id', rid);
        await supabase.from('reports').update({ status: 'resolved' }).eq('id', repid);
        load();
    };

    const dismiss = async (id) => {
        await supabase.from('reports').update({ status: 'dismissed' }).eq('id', id);
        load();
    };

    // Styles
    const css = {
        page: { minHeight: '100vh', background: '#0d1117', color: '#c9d1d9', fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '14px' },
        header: { background: '#161b22', borderBottom: '1px solid #30363d', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        title: { color: '#fff', fontSize: '16px', fontWeight: 600, margin: 0 },
        btn: { background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
        main: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', padding: '24px' },
        card: { background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '16px' },
        kpi: { background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px' },
        kpiVal: { fontSize: '32px', fontWeight: 700, color: '#fff', margin: '8px 0 4px' },
        kpiLabel: { color: '#8b949e', fontSize: '12px' },
        badge: (v) => ({ fontSize: '11px', padding: '2px 6px', borderRadius: '10px', background: v > 0 ? '#238636' : v < 0 ? '#da3633' : '#30363d', color: '#fff' }),
        section: { gridColumn: 'span 3', background: '#161b22', border: '1px solid #30363d', borderRadius: '8px' },
        secHead: { padding: '12px 16px', borderBottom: '1px solid #30363d', fontWeight: 600, color: '#fff' },
        secBody: { maxHeight: '300px', overflowY: 'auto' },
        row: { padding: '12px 16px', borderBottom: '1px solid #21262d', display: 'flex', gap: '12px', alignItems: 'center' },
        img: { width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' },
        placeholder: { width: '40px', height: '40px', borderRadius: '6px', background: '#30363d', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        barWrap: { height: '4px', background: '#30363d', borderRadius: '2px', marginTop: '4px' },
        bar: (pct, clr) => ({ height: '100%', width: `${pct}%`, background: clr, borderRadius: '2px' })
    };

    if (!auth) {
        return (
            <div style={{ ...css.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <form onSubmit={login} style={{ ...css.card, width: '320px', textAlign: 'center' }}>
                    <h1 style={{ color: '#fff', marginBottom: '24px' }}>🔒 Admin</h1>
                    <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN"
                        style={{ width: '100%', padding: '12px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', color: '#fff', textAlign: 'center', fontSize: '18px', letterSpacing: '4px', marginBottom: '16px' }} />
                    <button type="submit" style={{ ...css.btn, width: '100%', background: '#238636', border: 'none' }}>Login</button>
                </form>
            </div>
        );
    }

    const d = data?.daily || {};
    const t = data?.totals || {};
    const f = data?.funnel || {};
    const w = data?.weekly?.usersByDay || [];

    return (
        <div style={css.page}>
            <header style={css.header}>
                <h1 style={css.title}>📊 あんしんレシピ Admin</h1>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ color: '#8b949e', fontSize: '12px' }}>{new Date().toLocaleString('ja-JP')}</span>
                    <button onClick={load} disabled={loading} style={css.btn}>{loading ? '...' : '🔄 Refresh'}</button>
                    <a href="https://analytics.google.com/" target="_blank" rel="noopener" style={{ ...css.btn, textDecoration: 'none' }}>GA4</a>
                    <button onClick={() => { setAuth(false); sessionStorage.removeItem('admin_pin'); }} style={css.btn}>Logout</button>
                </div>
            </header>

            <div style={css.main}>
                {/* KPI Row */}
                {[
                    { l: '新規登録', t: d.newUsers?.today, y: d.newUsers?.yesterday, i: '👤' },
                    { l: 'レシピ', t: d.recipes?.today, y: d.recipes?.yesterday, i: '📝' },
                    { l: '保存', t: d.saves?.today, y: d.saves?.yesterday, i: '🔖' },
                    { l: 'いいね', t: d.likes?.today, y: d.likes?.yesterday, i: '❤️' },
                    { l: 'つくれぽ', t: d.tried?.today, y: d.tried?.yesterday, i: '✨' },
                    { l: '子供', t: t.children, y: null, i: '👶' }
                ].map(k => (
                    <div key={k.l} style={css.kpi}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{k.i}</span>
                            {k.y !== null && <span style={css.badge((k.t || 0) - (k.y || 0))}>{(k.t || 0) - (k.y || 0) > 0 ? '+' : ''}{(k.t || 0) - (k.y || 0)}</span>}
                        </div>
                        <div style={css.kpiVal}>{k.t ?? 0}</div>
                        <div style={css.kpiLabel}>{k.l}</div>
                    </div>
                ))}

                {/* Totals */}
                <div style={{ ...css.card, gridColumn: 'span 1' }}>
                    <div style={{ fontWeight: 600, marginBottom: '16px', color: '#fff' }}>📈 累計</div>
                    {[['ユーザー', t.users], ['レシピ', t.recipes], ['子供', t.children]].map(([l, v]) => (
                        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: '#8b949e' }}>{l}</span>
                            <span style={{ color: '#fff', fontWeight: 600 }}>{v ?? '-'}</span>
                        </div>
                    ))}
                </div>

                {/* Funnel */}
                <div style={{ ...css.card, gridColumn: 'span 2' }}>
                    <div style={{ fontWeight: 600, marginBottom: '16px', color: '#fff' }}>🔄 ファネル</div>
                    {[
                        { l: '登録', v: f.registered, c: '#3b82f6' },
                        { l: '子供登録', v: f.childAdded, c: '#10b981' },
                        { l: '初保存', v: f.firstSave, c: '#f59e0b' },
                        { l: '初投稿', v: f.firstRecipe, c: '#ef4444' }
                    ].map((s, i, a) => {
                        const max = a[0].v || 1;
                        const pct = Math.round((s.v / max) * 100);
                        const prev = i > 0 ? a[i - 1].v : s.v;
                        const cvr = prev ? Math.round((s.v / prev) * 100) : 0;
                        return (
                            <div key={s.l} style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                    <span>{s.l}</span>
                                    <span style={{ color: '#fff' }}>{s.v ?? 0} {i > 0 && <span style={{ color: '#8b949e' }}>({cvr}%)</span>}</span>
                                </div>
                                <div style={css.barWrap}><div style={css.bar(pct, s.c)} /></div>
                            </div>
                        );
                    })}
                </div>

                {/* Weekly */}
                <div style={{ ...css.card, gridColumn: 'span 2' }}>
                    <div style={{ fontWeight: 600, marginBottom: '16px', color: '#fff' }}>📊 週次登録</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '80px', gap: '4px' }}>
                        {w.map((day, i) => {
                            const max = Math.max(...w.map(x => x.count)) || 1;
                            const h = (day.count / max) * 100;
                            return (
                                <div key={day.date} style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', color: '#fff', marginBottom: '4px' }}>{day.count}</div>
                                    <div style={{ height: `${Math.max(h, 8)}%`, background: i === w.length - 1 ? '#3b82f6' : '#30363d', borderRadius: '2px 2px 0 0', minHeight: '4px' }} />
                                    <div style={{ fontSize: '10px', color: '#8b949e', marginTop: '4px' }}>{new Date(day.date).getDate()}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Allergens */}
                <div style={{ ...css.card, gridColumn: 'span 1' }}>
                    <div style={{ fontWeight: 600, marginBottom: '16px', color: '#fff' }}>🥜 アレルゲン</div>
                    {(stats?.allergens || []).slice(0, 5).map(a => (
                        <div key={a.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                            <span style={{ color: '#8b949e' }}>{a.name}</span>
                            <span style={{ color: '#fff' }}>{a.count}</span>
                        </div>
                    ))}
                </div>

                {/* Reports */}
                <div style={css.section}>
                    <div style={css.secHead}>⚠️ 通報 ({reports.length})</div>
                    <div style={css.secBody}>
                        {reports.length === 0 ? <div style={{ padding: '32px', textAlign: 'center', color: '#8b949e' }}>なし</div> :
                            reports.map(r => (
                                <div key={r.id} style={css.row}>
                                    <img src={r.recipe?.image_url || '/placeholder.png'} style={css.img} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: '#fff', fontSize: '13px' }}>{r.recipe?.title}</div>
                                        <div style={{ color: '#f85149', fontSize: '11px' }}>{r.reason}</div>
                                    </div>
                                    <button onClick={() => del(r.recipe?.id, r.id)} style={{ ...css.btn, background: '#da3633', border: 'none' }}>削除</button>
                                    <button onClick={() => dismiss(r.id)} style={css.btn}>却下</button>
                                </div>
                            ))
                        }
                    </div>
                </div>

                {/* Activity */}
                <div style={css.section}>
                    <div style={css.secHead}>✨ 最近のつくれぽ</div>
                    <div style={css.secBody}>
                        {activity.length === 0 ? <div style={{ padding: '32px', textAlign: 'center', color: '#8b949e' }}>なし</div> :
                            activity.map(a => (
                                <div key={a.id} style={css.row}>
                                    {a.image_url ? <img src={a.image_url} style={css.img} /> : <div style={css.placeholder}>📄</div>}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: '#fff', fontSize: '12px' }}>{a.user?.username}</div>
                                        <div style={{ color: '#8b949e', fontSize: '11px' }}>→ {a.recipe?.title}</div>
                                    </div>
                                    <div style={{ color: '#8b949e', fontSize: '11px' }}>{new Date(a.created_at).toLocaleDateString()}</div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
