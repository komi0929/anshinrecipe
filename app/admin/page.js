'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function AdminPage() {
    const [auth, setAuth] = useState(false);
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [data, setData] = useState(null);
    const [stats, setStats] = useState(null);
    const [reports, setReports] = useState([]);
    const [activity, setActivity] = useState([]);

    // Tab state
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | content | users

    // Content management state
    const [contentType, setContentType] = useState('recipes'); // recipes | tried_reports
    const [contentList, setContentList] = useState([]);
    const [contentPage, setContentPage] = useState(1);
    const [contentPagination, setContentPagination] = useState(null);

    // User management state
    const [userList, setUserList] = useState([]);
    const [userPage, setUserPage] = useState(1);
    const [userPagination, setUserPagination] = useState(null);

    // Announcement management state
    const [announcementList, setAnnouncementList] = useState([]);
    const [announcementLoading, setAnnouncementLoading] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', emoji: '📢' });

    // Map (Anshin Map) stats for unified dashboard
    const [mapStats, setMapStats] = useState(null);

    useEffect(() => {
        // セッショントークンの有効性をサーバーサイドで検証
        const validateSession = async () => {
            const token = sessionStorage.getItem('admin_token');
            if (!token) return;

            try {
                const response = await fetch('/api/admin/verify-pin', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.valid) {
                        setAuth(true);
                        load();
                    } else {
                        sessionStorage.removeItem('admin_token');
                    }
                }
            } catch (error) {
                console.error('Session validation error:', error);
                sessionStorage.removeItem('admin_token');
            }
        };

        validateSession();
    }, []);

    const login = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoading(true);

        try {
            const response = await fetch('/api/admin/verify-pin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pin }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setAuth(true);
                sessionStorage.setItem('admin_token', data.token);
                load();
            } else {
                setLoginError(data.error || 'ログインに失敗しました');
            }
        } catch (error) {
            console.error('Login error:', error);
            setLoginError('ネットワークエラーが発生しました');
        } finally {
            setLoading(false);
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

        // Load Map (Anshin Map) stats
        const [pendingCandidates, pendingReports, totalShops, todayReviews] = await Promise.all([
            supabase.from('candidate_restaurants').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('restaurant_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('restaurants').select('id', { count: 'exact', head: true }),
            supabase.from('reviews').select('id', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0])
        ]);

        setMapStats({
            pendingCandidates: pendingCandidates.count || 0,
            pendingReports: pendingReports.count || 0,
            totalShops: totalShops.count || 0,
            todayReviews: todayReviews.count || 0
        });

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

    // Load content list (recipes or tried_reports)
    const loadContent = async (type = contentType, page = 1) => {
        setLoading(true);
        const token = sessionStorage.getItem('admin_token');
        try {
            const res = await fetch(`/api/admin/content?type=${type}&page=${page}&limit=15`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setContentList(data.data || []);
            setContentPagination(data.pagination);
        } catch (e) {
            console.error('Load content error:', e);
        }
        setLoading(false);
    };

    // Delete content
    const deleteContent = async (type, id, title) => {
        if (!confirm(`「${title || 'このアイテム'}」を削除しますか？この操作は取り消せません。`)) return;
        const token = sessionStorage.getItem('admin_token');
        try {
            const res = await fetch('/api/admin/content', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, id })
            });
            if (res.ok) {
                loadContent();
            } else {
                alert('削除に失敗しました');
            }
        } catch (e) {
            console.error('Delete error:', e);
            alert('削除に失敗しました');
        }
    };

    // Load users
    const loadUsers = async (page = 1) => {
        setLoading(true);
        const token = sessionStorage.getItem('admin_token');
        try {
            const res = await fetch(`/api/admin/users?page=${page}&limit=20`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setUserList(data.data || []);
            setUserPagination(data.pagination);
        } catch (e) {
            console.error('Load users error:', e);
        }
        setLoading(false);
    };

    // Ban/Unban user
    const toggleUserBan = async (userId, currentlyBanned, username) => {
        const action = currentlyBanned ? 'unban' : 'ban';
        const msg = currentlyBanned
            ? `${username} のBANを解除しますか？`
            : `${username} をBANしますか？このユーザーはログインできなくなります。`;
        if (!confirm(msg)) return;

        const token = sessionStorage.getItem('admin_token');
        const reason = currentlyBanned ? null : prompt('BAN理由を入力（任意）:');

        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action, reason })
            });
            if (res.ok) {
                loadUsers(userPage);
            } else {
                alert('操作に失敗しました');
            }
        } catch (e) {
            console.error('Ban toggle error:', e);
        }
    };

    // Load announcements
    const loadAnnouncements = async () => {
        setAnnouncementLoading(true);
        try {
            const res = await fetch(`/api/admin/announcement?pin=${pin}&active=false`);
            const data = await res.json();
            if (data.success) {
                setAnnouncementList(data.announcements || []);
            }
        } catch (e) {
            console.error('Load announcements error:', e);
        }
        setAnnouncementLoading(false);
    };

    // Create new announcement
    const createAnnouncement = async () => {
        if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
            alert('タイトルと内容を入力してください');
            return;
        }

        if (!confirm(`お知らせ「${newAnnouncement.title}」を全ユーザーに通知しますか？`)) return;

        setAnnouncementLoading(true);
        try {
            const res = await fetch('/api/admin/announcement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pin: pin,
                    title: newAnnouncement.title,
                    content: newAnnouncement.content,
                    emoji: newAnnouncement.emoji
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`お知らせを送信しました！\n通知数: ${data.notificationsSent}件`);
                setNewAnnouncement({ title: '', content: '', emoji: '📢' });
                loadAnnouncements();
            } else {
                alert('送信に失敗しました: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error('Create announcement error:', e);
            alert('送信に失敗しました');
        }
        setAnnouncementLoading(false);
    };

    // Delete/deactivate announcement
    const deleteAnnouncement = async (announcementId, title) => {
        if (!confirm(`「${title}」を非表示にしますか？`)) return;

        try {
            const res = await fetch('/api/admin/announcement', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: pin, announcementId })
            });
            if (res.ok) {
                loadAnnouncements();
            } else {
                alert('操作に失敗しました');
            }
        } catch (e) {
            console.error('Delete announcement error:', e);
        }
    };

    // Tab change handler
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'content') {
            loadContent();
        } else if (tab === 'users') {
            loadUsers();
        } else if (tab === 'announcements') {
            loadAnnouncements();
        }
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
                    {loginError && (
                        <div style={{ color: '#f85149', fontSize: '12px', marginBottom: '12px', padding: '8px', background: 'rgba(248, 81, 73, 0.1)', borderRadius: '6px' }}>
                            {loginError}
                        </div>
                    )}
                    <button type="submit" disabled={loading} style={{ ...css.btn, width: '100%', background: loading ? '#30363d' : '#238636', border: 'none', opacity: loading ? 0.7 : 1 }}>
                        {loading ? '認証中...' : 'Login'}
                    </button>
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
                    <button onClick={() => { setAuth(false); sessionStorage.removeItem('admin_token'); }} style={css.btn}>Logout</button>
                </div>
            </header>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '0', background: '#161b22', borderBottom: '1px solid #30363d' }}>
                {[
                    { id: 'dashboard', label: '📊 ダッシュボード' },
                    { id: 'map', label: '🗺️ あんしんマップ' },
                    { id: 'content', label: '📝 コンテンツ管理' },
                    { id: 'users', label: '👥 ユーザー管理' },
                    { id: 'announcements', label: '📢 お知らせ管理' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        style={{
                            padding: '12px 24px',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '2px solid #58a6ff' : '2px solid transparent',
                            background: 'transparent',
                            color: activeTab === tab.id ? '#fff' : '#8b949e',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: activeTab === tab.id ? 600 : 400
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Map (Anshin Map) Tab */}
            {activeTab === 'map' && (
                <div style={{ padding: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        {/* Pending Candidates */}
                        <a href="/admin/data-collection" style={{ textDecoration: 'none' }}>
                            <div style={{ ...css.kpi, cursor: 'pointer', transition: 'border-color 0.2s', border: (mapStats?.pendingCandidates || 0) > 0 ? '2px solid #f97316' : '1px solid #30363d' }}>
                                <div style={css.kpiLabel}>承認待ち候補</div>
                                <div style={{ ...css.kpiVal, color: (mapStats?.pendingCandidates || 0) > 0 ? '#f97316' : '#fff' }}>
                                    {mapStats?.pendingCandidates ?? '-'}
                                </div>
                                <div style={{ fontSize: '11px', color: '#8b949e' }}>→ 承認画面へ</div>
                            </div>
                        </a>
                        {/* Pending Reports */}
                        <a href="/admin/data-collection" style={{ textDecoration: 'none' }}>
                            <div style={{ ...css.kpi, cursor: 'pointer', transition: 'border-color 0.2s', border: (mapStats?.pendingReports || 0) > 0 ? '2px solid #ef4444' : '1px solid #30363d' }}>
                                <div style={css.kpiLabel}>未解決報告</div>
                                <div style={{ ...css.kpiVal, color: (mapStats?.pendingReports || 0) > 0 ? '#ef4444' : '#fff' }}>
                                    {mapStats?.pendingReports ?? '-'}
                                </div>
                                <div style={{ fontSize: '11px', color: '#8b949e' }}>→ 報告一覧へ</div>
                            </div>
                        </a>
                        {/* Total Shops */}
                        <Link href="/admin/shops" style={{ textDecoration: 'none' }}>
                            <div style={{ ...css.kpi, cursor: 'pointer' }}>
                                <div style={css.kpiLabel}>登録店舗数</div>
                                <div style={css.kpiVal}>{mapStats?.totalShops ?? '-'}</div>
                                <div style={{ fontSize: '11px', color: '#8b949e' }}>→ 店舗一覧へ</div>
                            </div>
                        </Link>
                        {/* Today Reviews */}
                        <div style={css.kpi}>
                            <div style={css.kpiLabel}>今日の口コミ</div>
                            <div style={{ ...css.kpiVal, color: (mapStats?.todayReviews || 0) > 0 ? '#10b981' : '#fff' }}>
                                {mapStats?.todayReviews ?? '-'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#8b949e' }}>ユーザー投稿</div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <a href="/admin/data-collection" style={{ ...css.btn, textDecoration: 'none', background: '#f97316' }}>
                            🔍 データ収集・承認
                        </a>
                        <Link href="/admin/shops" style={{ ...css.btn, textDecoration: 'none' }}>
                            🏪 店舗管理
                        </Link>
                        <a href="/map" target="_blank" rel="noopener" style={{ ...css.btn, textDecoration: 'none' }}>
                            🗺️ マップ確認（本番）
                        </a>
                    </div>
                </div>
            )}

            {/* Content Management Tab */}
            {activeTab === 'content' && (
                <div style={{ padding: '24px' }}>
                    {/* Sub-tabs for content type */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <button
                            onClick={() => { setContentType('recipes'); loadContent('recipes'); }}
                            style={{ ...css.btn, background: contentType === 'recipes' ? '#238636' : '#21262d' }}
                        >
                            📝 レシピ一覧
                        </button>
                        <button
                            onClick={() => { setContentType('tried_reports'); loadContent('tried_reports'); }}
                            style={{ ...css.btn, background: contentType === 'tried_reports' ? '#238636' : '#21262d' }}
                        >
                            ✨ つくれぽ一覧
                        </button>
                    </div>

                    {/* Content List */}
                    <div style={{ ...css.card }}>
                        {contentList.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: '#8b949e' }}>
                                {loading ? '読み込み中...' : 'データなし'}
                            </div>
                        ) : (
                            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                {contentType === 'recipes' ? (
                                    contentList.map(r => (
                                        <div key={r.id} style={{ ...css.row, borderBottom: '1px solid #30363d' }}>
                                            {r.image_url ? <img src={r.image_url} style={css.img} alt="" /> : <div style={css.placeholder}>📝</div>}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ color: '#fff', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                                                <div style={{ color: '#8b949e', fontSize: '11px' }}>
                                                    by {r.profiles?.display_name || r.profiles?.username || '不明'} | {new Date(r.created_at).toLocaleDateString('ja-JP')}
                                                    {!r.is_public && <span style={{ marginLeft: '8px', color: '#f0883e' }}>🔒 非公開</span>}
                                                </div>
                                            </div>
                                            <a href={`/recipe/${r.id}`} target="_blank" rel="noopener" style={{ ...css.btn, textDecoration: 'none' }}>表示</a>
                                            <button onClick={() => deleteContent('recipe', r.id, r.title)} style={{ ...css.btn, background: '#da3633', border: 'none' }}>🗑️ 削除</button>
                                        </div>
                                    ))
                                ) : (
                                    contentList.map(r => (
                                        <div key={r.id} style={{ ...css.row, borderBottom: '1px solid #30363d' }}>
                                            {r.image_url ? <img src={r.image_url} style={css.img} alt="" /> : <div style={css.placeholder}>💬</div>}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ color: '#fff', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.comment || '(コメントなし)'}</div>
                                                <div style={{ color: '#8b949e', fontSize: '11px' }}>
                                                    {r.profiles?.display_name || r.profiles?.username} → {r.recipes?.title || '不明'} | {new Date(r.created_at).toLocaleDateString('ja-JP')}
                                                </div>
                                            </div>
                                            <button onClick={() => deleteContent('tried_report', r.id)} style={{ ...css.btn, background: '#da3633', border: 'none' }}>🗑️ 削除</button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {contentPagination && contentPagination.totalPages > 1 && (
                            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid #30363d' }}>
                                <button
                                    disabled={contentPagination.page <= 1}
                                    onClick={() => { setContentPage(p => p - 1); loadContent(contentType, contentPage - 1); }}
                                    style={{ ...css.btn, opacity: contentPagination.page <= 1 ? 0.5 : 1 }}
                                >
                                    ← 前へ
                                </button>
                                <span style={{ color: '#8b949e', fontSize: '12px', alignSelf: 'center' }}>
                                    {contentPagination.page} / {contentPagination.totalPages} ({contentPagination.total}件)
                                </span>
                                <button
                                    disabled={contentPagination.page >= contentPagination.totalPages}
                                    onClick={() => { setContentPage(p => p + 1); loadContent(contentType, contentPage + 1); }}
                                    style={{ ...css.btn, opacity: contentPagination.page >= contentPagination.totalPages ? 0.5 : 1 }}
                                >
                                    次へ →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* User Management Tab */}
            {activeTab === 'users' && (
                <div style={{ padding: '24px' }}>
                    <div style={{ ...css.card }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #30363d', fontWeight: 600, color: '#fff' }}>
                            👥 ユーザー一覧 ({userPagination?.total || 0}人)
                        </div>
                        {userList.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: '#8b949e' }}>
                                {loading ? '読み込み中...' : 'データなし'}
                            </div>
                        ) : (
                            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                {userList.map(u => (
                                    <div key={u.id} style={{ ...css.row, borderBottom: '1px solid #30363d' }}>
                                        {(u.avatar_url || u.picture_url) ? (
                                            <img src={u.avatar_url || u.picture_url} style={{ ...css.img, borderRadius: '50%' }} alt="" />
                                        ) : (
                                            <div style={{ ...css.placeholder, borderRadius: '50%' }}>👤</div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>{u.display_name || u.username || '名前なし'}</span>
                                                {u.is_banned && <span style={{ background: '#da3633', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>BAN</span>}
                                            </div>
                                            <div style={{ color: '#8b949e', fontSize: '11px' }}>
                                                レシピ: {u.recipeCount}件 | 登録: {new Date(u.created_at).toLocaleDateString('ja-JP')}
                                            </div>
                                            {u.ban_reason && <div style={{ color: '#f85149', fontSize: '11px' }}>理由: {u.ban_reason}</div>}
                                        </div>
                                        <button
                                            onClick={() => toggleUserBan(u.id, u.is_banned, u.display_name || u.username)}
                                            style={{
                                                ...css.btn,
                                                background: u.is_banned ? '#238636' : '#da3633',
                                                border: 'none'
                                            }}
                                        >
                                            {u.is_banned ? '🔓 BAN解除' : '🚫 BAN'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {userPagination && userPagination.totalPages > 1 && (
                            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid #30363d' }}>
                                <button
                                    disabled={userPagination.page <= 1}
                                    onClick={() => { setUserPage(p => p - 1); loadUsers(userPage - 1); }}
                                    style={{ ...css.btn, opacity: userPagination.page <= 1 ? 0.5 : 1 }}
                                >
                                    ← 前へ
                                </button>
                                <span style={{ color: '#8b949e', fontSize: '12px', alignSelf: 'center' }}>
                                    {userPagination.page} / {userPagination.totalPages}
                                </span>
                                <button
                                    disabled={userPagination.page >= userPagination.totalPages}
                                    onClick={() => { setUserPage(p => p + 1); loadUsers(userPage + 1); }}
                                    style={{ ...css.btn, opacity: userPagination.page >= userPagination.totalPages ? 0.5 : 1 }}
                                >
                                    次へ →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Announcements Management Tab */}
            {activeTab === 'announcements' && (
                <div style={{ padding: '24px' }}>
                    {/* Create New Announcement */}
                    <div style={{ ...css.card, marginBottom: '24px' }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #30363d', fontWeight: 600, color: '#fff' }}>
                            📢 新規お知らせ作成
                        </div>
                        <div style={{ padding: '16px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ color: '#8b949e', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                                    絵文字
                                </label>
                                <select
                                    value={newAnnouncement.emoji}
                                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, emoji: e.target.value }))}
                                    style={{
                                        width: '100px',
                                        padding: '8px 12px',
                                        background: '#0d1117',
                                        border: '1px solid #30363d',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '16px'
                                    }}
                                >
                                    <option value="📢">📢</option>
                                    <option value="🎉">🎉</option>
                                    <option value="✨">✨</option>
                                    <option value="📺">📺</option>
                                    <option value="🔧">🔧</option>
                                    <option value="❤️">❤️</option>
                                    <option value="⚠️">⚠️</option>
                                    <option value="🎁">🎁</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ color: '#8b949e', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                                    タイトル
                                </label>
                                <input
                                    type="text"
                                    value={newAnnouncement.title}
                                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="例: 新機能が追加されました！"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: '#0d1117',
                                        border: '1px solid #30363d',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ color: '#8b949e', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                                    内容
                                </label>
                                <textarea
                                    value={newAnnouncement.content}
                                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                                    placeholder="お知らせの詳細を入力してください"
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: '#0d1117',
                                        border: '1px solid #30363d',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '14px',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                            <button
                                onClick={createAnnouncement}
                                disabled={announcementLoading}
                                style={{
                                    ...css.btn,
                                    background: announcementLoading ? '#30363d' : '#238636',
                                    border: 'none',
                                    padding: '10px 20px',
                                    fontSize: '14px',
                                    fontWeight: 600
                                }}
                            >
                                {announcementLoading ? '送信中...' : '📤 全ユーザーに通知を送信'}
                            </button>
                            <p style={{ color: '#8b949e', fontSize: '11px', marginTop: '8px' }}>
                                ※ 送信すると、すべてのユーザーに通知が届きます
                            </p>
                        </div>
                    </div>

                    {/* Existing Announcements List */}
                    <div style={css.card}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #30363d', fontWeight: 600, color: '#fff' }}>
                            📋 お知らせ一覧 ({announcementList.length}件)
                        </div>
                        {announcementLoading ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: '#8b949e' }}>
                                読み込み中...
                            </div>
                        ) : announcementList.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: '#8b949e' }}>
                                お知らせはありません
                            </div>
                        ) : (
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {announcementList.map(a => (
                                    <div key={a.id} style={{ ...css.row, borderBottom: '1px solid #30363d' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '8px',
                                            background: a.is_active ? '#238636' : '#30363d',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '20px',
                                            flexShrink: 0
                                        }}>
                                            {a.emoji || '📢'}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>
                                                    {a.title}
                                                </span>
                                                {!a.is_active && (
                                                    <span style={{ background: '#30363d', color: '#8b949e', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>
                                                        非表示
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ color: '#8b949e', fontSize: '11px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {a.content}
                                            </div>
                                            <div style={{ color: '#6e7681', fontSize: '10px', marginTop: '4px' }}>
                                                {new Date(a.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        {a.is_active && (
                                            <button
                                                onClick={() => deleteAnnouncement(a.id, a.title)}
                                                style={{ ...css.btn, background: '#da3633', border: 'none' }}
                                            >
                                                非表示
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Dashboard Tab (existing content) */}
            {activeTab === 'dashboard' && (
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

                    {/* Smart Import Stats */}
                    <div style={{ ...css.card, gridColumn: 'span 1' }}>
                        <div style={{ fontWeight: 600, marginBottom: '16px', color: '#fff' }}>✨ スマートインポート</div>
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                <span style={{ color: '#8b949e' }}>成功率 (週)</span>
                                <span style={{ color: '#fff' }}>{data?.features?.smartImport?.starts > 0 ? Math.round((data.features.smartImport.successes / data.features.smartImport.starts) * 100) : 0}%</span>
                            </div>
                            <div style={css.barWrap}>
                                <div style={css.bar(data?.features?.smartImport?.starts > 0 ? (data.features.smartImport.successes / data.features.smartImport.starts) * 100 : 0, '#a855f7')} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8b949e' }}>
                            <span>開始: {data?.features?.smartImport?.starts || 0}</span>
                            <span>成功: {data?.features?.smartImport?.successes || 0}</span>
                        </div>
                    </div>

                    {/* Popular Recipes */}
                    <div style={{ ...css.card, gridColumn: 'span 2' }}>
                        <div style={{ fontWeight: 600, marginBottom: '16px', color: '#fff' }}>🔥 人気レシピ Top5</div>
                        {(data?.popularRecipes || []).length === 0 ? (
                            <div style={{ color: '#8b949e', fontSize: '12px', textAlign: 'center', padding: '16px' }}>データなし</div>
                        ) : (
                            data.popularRecipes.map((r, i) => (
                                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <span style={{ color: i < 3 ? '#f59e0b' : '#8b949e', fontWeight: 700, width: '20px' }}>{i + 1}</span>
                                    {r.image && <img src={r.image} style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} alt="" />}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ color: '#fff', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                                        <span style={{ color: '#ef4444' }}>❤️ {r.likeCount}</span>
                                        <span style={{ color: '#3b82f6' }}>🔖 {r.saveCount}</span>
                                    </div>
                                </div>
                            ))
                        )}
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
            )}
        </div>
    );
}
