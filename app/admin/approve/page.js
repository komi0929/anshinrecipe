'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Admin Approval Console - Shop & Menu Level Approval
 * Features:
 * - Shop-level approve/reject
 * - Menu-level approve/reject (individual menus)
 * - Mobile preview of listing
 * - Search & filter
 */

export default function ApprovalPage() {
    const [auth, setAuth] = useState(false);
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [candidates, setCandidates] = useState([]);
    const [filter, setFilter] = useState('pending'); // pending | approved | rejected
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedShop, setSelectedShop] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);

    // Auth check
    useEffect(() => {
        const token = sessionStorage.getItem('admin_token');
        if (token) {
            setAuth(true);
            loadCandidates();
        }
    }, []);

    const login = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/admin/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setAuth(true);
                sessionStorage.setItem('admin_token', data.token);
                loadCandidates();
            }
        } catch (e) {
            console.error('Login error:', e);
        }
        setLoading(false);
    };

    const loadCandidates = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('candidate_restaurants')
            .select('*')
            .eq('status', filter)
            .order('created_at', { ascending: false })
            .limit(100);

        if (!error) {
            setCandidates(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (auth) loadCandidates();
    }, [filter, auth]);

    // Approve shop (all menus)
    const approveShop = async (id) => {
        await supabase
            .from('candidate_restaurants')
            .update({ status: 'approved' })
            .eq('id', id);
        loadCandidates();
        setSelectedShop(null);
    };

    // Reject shop
    const rejectShop = async (id) => {
        await supabase
            .from('candidate_restaurants')
            .update({ status: 'rejected' })
            .eq('id', id);
        loadCandidates();
        setSelectedShop(null);
    };

    // Update menu approval status
    const updateMenuStatus = async (shopId, menuIndex, status) => {
        const shop = candidates.find(c => c.id === shopId);
        if (!shop) return;

        const updatedMenus = [...shop.menus];
        updatedMenus[menuIndex] = {
            ...updatedMenus[menuIndex],
            approval_status: status // 'approved', 'rejected', 'pending'
        };

        await supabase
            .from('candidate_restaurants')
            .update({ menus: updatedMenus })
            .eq('id', shopId);

        // Reload
        const { data } = await supabase
            .from('candidate_restaurants')
            .select('*')
            .eq('id', shopId)
            .single();

        if (data) {
            setCandidates(prev => prev.map(c => c.id === shopId ? data : c));
            setSelectedShop(data);
        }
    };

    // Get photo from sources metadata
    const getShopPhoto = (shop) => {
        const sources = shop.sources || [];
        const meta = sources.find(s => s.type === 'system_metadata');
        if (meta?.data?.images?.[0]?.url) {
            return meta.data.images[0].url;
        }
        return null;
    };

    // Filtered candidates
    const filteredCandidates = candidates.filter(c =>
        !searchQuery ||
        c.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Styles
    const css = {
        page: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
        header: { background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        title: { fontSize: '20px', fontWeight: 700, color: '#1e293b', margin: 0 },
        main: { display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', padding: '24px', maxWidth: '1600px', margin: '0 auto' },
        sidebar: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
        card: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' },
        btn: { padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 },
        btnPrimary: { background: '#22c55e', color: '#fff' },
        btnDanger: { background: '#ef4444', color: '#fff' },
        btnSecondary: { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' },
        listItem: { padding: '16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s' },
        listItemActive: { background: '#f0fdf4' },
        badge: { fontSize: '11px', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 },
        badgePending: { background: '#fef3c7', color: '#92400e' },
        badgeApproved: { background: '#dcfce7', color: '#166534' },
        badgeRejected: { background: '#fee2e2', color: '#991b1b' }
    };

    if (!auth) {
        return (
            <div style={{ ...css.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <form onSubmit={login} style={{ ...css.card, width: '360px', textAlign: 'center' }}>
                    <h1 style={{ marginBottom: '24px' }}>🔒 承認コンソール</h1>
                    <input
                        type="password"
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                        placeholder="PIN"
                        style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center', fontSize: '18px', letterSpacing: '4px', marginBottom: '16px' }}
                    />
                    <button type="submit" disabled={loading} style={{ ...css.btn, ...css.btnPrimary, width: '100%' }}>
                        {loading ? '認証中...' : 'ログイン'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div style={css.page}>
            {/* Header */}
            <header style={css.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h1 style={css.title}>📋 店舗承認コンソール</h1>
                    <a href="/admin" style={{ color: '#64748b', fontSize: '14px', textDecoration: 'none' }}>← Admin Top</a>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={loadCandidates} style={{ ...css.btn, ...css.btnSecondary }}>
                        🔄 更新
                    </button>
                    <button onClick={() => { setAuth(false); sessionStorage.removeItem('admin_token'); }} style={{ ...css.btn, ...css.btnSecondary }}>
                        ログアウト
                    </button>
                </div>
            </header>

            <div style={css.main}>
                {/* Left: Shop List */}
                <div>
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {['pending', 'approved', 'rejected'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    ...css.btn,
                                    background: filter === f ? '#3b82f6' : '#fff',
                                    color: filter === f ? '#fff' : '#475569',
                                    border: '1px solid #e2e8f0'
                                }}
                            >
                                {f === 'pending' ? '⏳ 承認待ち' : f === 'approved' ? '✅ 承認済み' : '❌ 却下'}
                                <span style={{ marginLeft: '6px', opacity: 0.7 }}>
                                    ({candidates.filter(c => c.status === f).length})
                                </span>
                            </button>
                        ))}
                        <input
                            type="text"
                            placeholder="🔍 店舗名・住所で検索..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ flex: 1, minWidth: '200px', padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        />
                    </div>

                    {/* Shop List */}
                    <div style={css.sidebar}>
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>読み込み中...</div>
                        ) : filteredCandidates.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>該当なし</div>
                        ) : (
                            <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                                {filteredCandidates.map(shop => (
                                    <div
                                        key={shop.id}
                                        onClick={() => setSelectedShop(shop)}
                                        style={{
                                            ...css.listItem,
                                            ...(selectedShop?.id === shop.id ? css.listItemActive : {}),
                                            display: 'flex',
                                            gap: '12px',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {/* Thumbnail */}
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '8px',
                                            background: getShopPhoto(shop) ? `url(${getShopPhoto(shop)}) center/cover` : '#f1f5f9',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {!getShopPhoto(shop) && '🏪'}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {shop.shop_name}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {shop.address}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                                <span style={{ ...css.badge, background: '#dbeafe', color: '#1e40af' }}>
                                                    🍽️ {shop.menus?.length || 0}メニュー
                                                </span>
                                                <span style={{ ...css.badge, background: '#f1f5f9', color: '#475569' }}>
                                                    ⭐ {shop.reliability_score || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Detail & Preview */}
                <div>
                    {selectedShop ? (
                        <>
                            {/* Shop Detail Card */}
                            <div style={{ ...css.card, marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>{selectedShop.shop_name}</h2>
                                        <p style={{ margin: '4px 0', fontSize: '13px', color: '#64748b' }}>{selectedShop.address}</p>
                                    </div>
                                    <span style={{
                                        ...css.badge,
                                        ...(selectedShop.status === 'pending' ? css.badgePending :
                                            selectedShop.status === 'approved' ? css.badgeApproved : css.badgeRejected)
                                    }}>
                                        {selectedShop.status === 'pending' ? '承認待ち' :
                                            selectedShop.status === 'approved' ? '承認済み' : '却下'}
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                {selectedShop.status === 'pending' && (
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                        <button onClick={() => approveShop(selectedShop.id)} style={{ ...css.btn, ...css.btnPrimary, flex: 1 }}>
                                            ✅ 店舗を承認
                                        </button>
                                        <button onClick={() => rejectShop(selectedShop.id)} style={{ ...css.btn, ...css.btnDanger, flex: 1 }}>
                                            ❌ 却下
                                        </button>
                                    </div>
                                )}

                                {/* Menu List with Individual Approval */}
                                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '12px' }}>🍽️ メニュー一覧</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {(selectedShop.menus || []).map((menu, idx) => (
                                        <div key={idx} style={{
                                            padding: '12px',
                                            background: menu.approval_status === 'rejected' ? '#fef2f2' :
                                                menu.approval_status === 'approved' ? '#f0fdf4' : '#f8fafc',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 500, color: '#1e293b' }}>{menu.name}</div>
                                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                                        {menu.description?.slice(0, 60)}...
                                                    </div>
                                                    {menu.supportedAllergens && (
                                                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                                                            {menu.supportedAllergens.map(a => (
                                                                <span key={a} style={{ fontSize: '10px', padding: '2px 6px', background: '#dbeafe', color: '#1e40af', borderRadius: '4px' }}>
                                                                    {a}不使用
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Menu-level approve/reject */}
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button
                                                        onClick={() => updateMenuStatus(selectedShop.id, idx, 'approved')}
                                                        style={{
                                                            ...css.btn,
                                                            padding: '4px 8px',
                                                            fontSize: '12px',
                                                            background: menu.approval_status === 'approved' ? '#22c55e' : '#f1f5f9',
                                                            color: menu.approval_status === 'approved' ? '#fff' : '#64748b'
                                                        }}
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={() => updateMenuStatus(selectedShop.id, idx, 'rejected')}
                                                        style={{
                                                            ...css.btn,
                                                            padding: '4px 8px',
                                                            fontSize: '12px',
                                                            background: menu.approval_status === 'rejected' ? '#ef4444' : '#f1f5f9',
                                                            color: menu.approval_status === 'rejected' ? '#fff' : '#64748b'
                                                        }}
                                                    >
                                                        ✗
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Mobile Preview Toggle */}
                            <button
                                onClick={() => setPreviewMode(!previewMode)}
                                style={{ ...css.btn, ...css.btnSecondary, width: '100%', marginBottom: '16px' }}
                            >
                                📱 {previewMode ? 'プレビューを閉じる' : '掲載イメージを表示'}
                            </button>

                            {/* Mobile Preview */}
                            {previewMode && (
                                <div style={{
                                    background: '#1e293b',
                                    borderRadius: '24px',
                                    padding: '12px',
                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                                }}>
                                    <div style={{
                                        background: '#fff',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        maxHeight: '500px',
                                        overflowY: 'auto'
                                    }}>
                                        {/* Header Image */}
                                        <div style={{
                                            height: '120px',
                                            background: getShopPhoto(selectedShop)
                                                ? `url(${getShopPhoto(selectedShop)}) center/cover`
                                                : 'linear-gradient(135deg, #22c55e, #16a34a)',
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            padding: '12px'
                                        }}>
                                            <div style={{
                                                background: 'rgba(0,0,0,0.5)',
                                                color: '#fff',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                fontSize: '16px',
                                                fontWeight: 600
                                            }}>
                                                {selectedShop.shop_name}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div style={{ padding: '16px' }}>
                                            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px' }}>
                                                📍 {selectedShop.address}
                                            </p>

                                            <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 8px' }}>対応メニュー</h4>
                                            {(selectedShop.menus || [])
                                                .filter(m => m.approval_status !== 'rejected')
                                                .map((menu, idx) => (
                                                    <div key={idx} style={{
                                                        padding: '10px',
                                                        background: '#f0fdf4',
                                                        borderRadius: '8px',
                                                        marginBottom: '8px'
                                                    }}>
                                                        <div style={{ fontWeight: 500, fontSize: '13px' }}>{menu.name}</div>
                                                        {menu.supportedAllergens && (
                                                            <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px' }}>
                                                                {menu.supportedAllergens.join('・')} 不使用
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ ...css.card, textAlign: 'center', color: '#94a3b8', padding: '60px 20px' }}>
                            👈 左のリストから店舗を選択してください
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
