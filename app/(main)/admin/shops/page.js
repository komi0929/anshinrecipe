'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Admin Shop Management Console
 * Features:
 * - List of approved shops
 * - Edit shop information freely
 * - Photo (banner) management
 * - Search & filter by area
 */

export default function ShopsPage() {
    const [auth, setAuth] = useState(false);
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [shops, setShops] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [areaFilter, setAreaFilter] = useState('');
    const [selectedShop, setSelectedShop] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({});

    // Auth check
    useEffect(() => {
        const token = sessionStorage.getItem('admin_token');
        if (token) {
            setAuth(true);
            loadShops();
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
                loadShops();
            }
        } catch (e) {
            console.error('Login error:', e);
        }
        setLoading(false);
    };

    const loadShops = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200);

        if (!error) {
            setShops(data || []);
        }
        setLoading(false);
    };

    // Get unique areas from shops
    const uniqueAreas = [...new Set(shops.map(s => {
        const parts = s.address?.split(/[都道府県]/);
        return parts?.[0] || '';
    }).filter(Boolean))];

    // Filtered shops
    const filteredShops = shops.filter(s => {
        const matchesSearch = !searchQuery ||
            s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.address?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesArea = !areaFilter || s.address?.includes(areaFilter);
        return matchesSearch && matchesArea;
    });

    // Start editing
    const startEdit = (shop) => {
        setSelectedShop(shop);
        setEditData({
            name: shop.name || '',
            address: shop.address || '',
            phone: shop.phone || '',
            website_url: shop.website_url || '',
            description: shop.description || '',
            banner_url: shop.banner_url || ''
        });
        setEditMode(true);
    };

    // Save changes
    const saveChanges = async () => {
        if (!selectedShop) return;

        setLoading(true);
        const { error } = await supabase
            .from('restaurants')
            .update({
                name: editData.name,
                address: editData.address,
                phone: editData.phone,
                website_url: editData.website_url,
                description: editData.description,
                banner_url: editData.banner_url
            })
            .eq('id', selectedShop.id);

        if (!error) {
            loadShops();
            setEditMode(false);
            setSelectedShop({ ...selectedShop, ...editData });
        }
        setLoading(false);
    };

    // Delete shop
    const deleteShop = async (id) => {
        if (!confirm('この店舗を削除しますか？この操作は取り消せません。')) return;

        setLoading(true);
        await supabase.from('restaurants').delete().eq('id', id);
        loadShops();
        setSelectedShop(null);
        setLoading(false);
    };

    // Styles
    const css = {
        page: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
        header: { background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        title: { fontSize: '20px', fontWeight: 700, color: '#1e293b', margin: 0 },
        main: { display: 'grid', gridTemplateColumns: '1fr 450px', gap: '24px', padding: '24px', maxWidth: '1600px', margin: '0 auto' },
        sidebar: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
        card: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' },
        btn: { padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 },
        btnPrimary: { background: '#3b82f6', color: '#fff' },
        btnDanger: { background: '#ef4444', color: '#fff' },
        btnSecondary: { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' },
        listItem: { padding: '16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s' },
        listItemActive: { background: '#eff6ff' },
        input: { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '12px' },
        label: { display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }
    };

    if (!auth) {
        return (
            <div style={{ ...css.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <form onSubmit={login} style={{ ...css.card, width: '360px', textAlign: 'center' }}>
                    <h1 style={{ marginBottom: '24px' }}>🔒 店舗管理</h1>
                    <input
                        type="password"
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                        placeholder="PIN"
                        style={{ ...css.input, textAlign: 'center', fontSize: '18px', letterSpacing: '4px' }}
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
                    <h1 style={css.title}>🏪 店舗情報管理</h1>
                    <a href="/admin" style={{ color: '#64748b', fontSize: '14px', textDecoration: 'none' }}>← Admin Top</a>
                    <a href="/admin/approve" style={{ color: '#64748b', fontSize: '14px', textDecoration: 'none' }}>承認コンソール</a>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '13px', alignSelf: 'center' }}>
                        {shops.length} 店舗
                    </span>
                    <button onClick={loadShops} style={{ ...css.btn, ...css.btnSecondary }}>
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
                    {/* Search & Filter */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <input
                            type="text"
                            placeholder="🔍 店舗名・住所で検索..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ flex: 1, padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        />
                        <select
                            value={areaFilter}
                            onChange={e => setAreaFilter(e.target.value)}
                            style={{ padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', minWidth: '150px' }}
                        >
                            <option value="">全エリア</option>
                            {uniqueAreas.map(area => (
                                <option key={area} value={area}>{area}</option>
                            ))}
                        </select>
                    </div>

                    {/* Shop List */}
                    <div style={css.sidebar}>
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>読み込み中...</div>
                        ) : filteredShops.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>該当なし</div>
                        ) : (
                            <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                                {filteredShops.map(shop => (
                                    <div
                                        key={shop.id}
                                        onClick={() => { setSelectedShop(shop); setEditMode(false); }}
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
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '8px',
                                            background: shop.banner_url ? `url(${shop.banner_url}) center/cover` : '#e2e8f0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            fontSize: '20px'
                                        }}>
                                            {!shop.banner_url && '🏪'}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {shop.name}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {shop.address}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Detail / Edit */}
                <div>
                    {selectedShop ? (
                        <div style={css.card}>
                            {editMode ? (
                                <>
                                    <h2 style={{ margin: '0 0 20px', fontSize: '18px' }}>✏️ 店舗情報を編集</h2>

                                    <label style={css.label}>店舗名</label>
                                    <input
                                        type="text"
                                        value={editData.name}
                                        onChange={e => setEditData({ ...editData, name: e.target.value })}
                                        style={css.input}
                                    />

                                    <label style={css.label}>住所</label>
                                    <input
                                        type="text"
                                        value={editData.address}
                                        onChange={e => setEditData({ ...editData, address: e.target.value })}
                                        style={css.input}
                                    />

                                    <label style={css.label}>電話番号</label>
                                    <input
                                        type="text"
                                        value={editData.phone}
                                        onChange={e => setEditData({ ...editData, phone: e.target.value })}
                                        style={css.input}
                                    />

                                    <label style={css.label}>ウェブサイト</label>
                                    <input
                                        type="url"
                                        value={editData.website_url}
                                        onChange={e => setEditData({ ...editData, website_url: e.target.value })}
                                        style={css.input}
                                    />

                                    <label style={css.label}>説明</label>
                                    <textarea
                                        value={editData.description}
                                        onChange={e => setEditData({ ...editData, description: e.target.value })}
                                        rows={3}
                                        style={{ ...css.input, resize: 'vertical' }}
                                    />

                                    <label style={css.label}>バナー画像URL（横長推奨）</label>
                                    <input
                                        type="url"
                                        value={editData.banner_url}
                                        onChange={e => setEditData({ ...editData, banner_url: e.target.value })}
                                        placeholder="https://..."
                                        style={css.input}
                                    />

                                    {editData.banner_url && (
                                        <div style={{
                                            height: '100px',
                                            background: `url(${editData.banner_url}) center/cover`,
                                            borderRadius: '8px',
                                            marginBottom: '16px'
                                        }} />
                                    )}

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={saveChanges} disabled={loading} style={{ ...css.btn, ...css.btnPrimary, flex: 1 }}>
                                            {loading ? '保存中...' : '💾 保存'}
                                        </button>
                                        <button onClick={() => setEditMode(false)} style={{ ...css.btn, ...css.btnSecondary }}>
                                            キャンセル
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* View Mode */}
                                    {selectedShop.banner_url && (
                                        <div style={{
                                            height: '120px',
                                            background: `url(${selectedShop.banner_url}) center/cover`,
                                            borderRadius: '8px',
                                            marginBottom: '16px'
                                        }} />
                                    )}

                                    <h2 style={{ margin: '0 0 8px', fontSize: '20px', color: '#1e293b' }}>
                                        {selectedShop.name}
                                    </h2>

                                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                                        📍 {selectedShop.address}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>電話</div>
                                            <div style={{ fontSize: '14px' }}>{selectedShop.phone || '-'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>ウェブサイト</div>
                                            <div style={{ fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {selectedShop.website_url ? (
                                                    <a href={selectedShop.website_url} target="_blank" rel="noopener" style={{ color: '#3b82f6' }}>
                                                        {new URL(selectedShop.website_url).hostname}
                                                    </a>
                                                ) : '-'}
                                            </div>
                                        </div>
                                    </div>

                                    {selectedShop.description && (
                                        <div style={{ fontSize: '13px', color: '#475569', marginBottom: '20px', lineHeight: 1.6 }}>
                                            {selectedShop.description}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <a
                                            href={`/admin/shops/${selectedShop.id}`}
                                            style={{ ...css.btn, ...css.btnPrimary, textDecoration: 'none', textAlign: 'center', flex: 1 }}
                                        >
                                            📝 詳細編集
                                        </a>
                                        <button onClick={() => startEdit(selectedShop)} style={{ ...css.btn, ...css.btnSecondary }}>
                                            ✏️ 簡易編集
                                        </button>
                                        <a
                                            href={`/map/${selectedShop.id}`}
                                            target="_blank"
                                            rel="noopener"
                                            style={{ ...css.btn, ...css.btnSecondary, textDecoration: 'none', textAlign: 'center' }}
                                        >
                                            🗺️
                                        </a>
                                        <button onClick={() => deleteShop(selectedShop.id)} style={{ ...css.btn, ...css.btnDanger }}>
                                            🗑️
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
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
