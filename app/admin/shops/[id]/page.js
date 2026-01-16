'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Save, Trash2, Plus, Image, MapPin, Phone, Globe, Instagram } from 'lucide-react';

export default function ShopDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [menus, setMenus] = useState([]);

    useEffect(() => {
        loadShop();
    }, [params.id]);

    const loadShop = async () => {
        setLoading(true);
        const { data: shopData, error: shopError } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', params.id)
            .single();

        if (shopData) {
            setShop(shopData);

            const { data: menuData } = await supabase
                .from('menus')
                .select('*')
                .eq('restaurant_id', params.id)
                .order('created_at', { ascending: true });

            setMenus(menuData || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update restaurant
            await supabase
                .from('restaurants')
                .update({
                    name: shop.name,
                    address: shop.address,
                    phone: shop.phone,
                    website_url: shop.website_url,
                    instagram_url: shop.instagram_url,
                    image_url: shop.image_url,
                    description: shop.description,
                    features: shop.features
                })
                .eq('id', params.id);

            // Update menus
            for (const menu of menus) {
                if (menu.id) {
                    await supabase
                        .from('menus')
                        .update({
                            name: menu.name,
                            price: menu.price,
                            description: menu.description,
                            image_url: menu.image_url,
                            allergens_contained: menu.allergens_contained,
                            allergens_removable: menu.allergens_removable
                        })
                        .eq('id', menu.id);
                }
            }

            alert('保存しました！');
        } catch (e) {
            console.error(e);
            alert('保存に失敗しました');
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!confirm('この店舗を削除しますか？この操作は取り消せません。')) return;

        try {
            await supabase.from('menus').delete().eq('restaurant_id', params.id);
            await supabase.from('restaurants').delete().eq('id', params.id);
            router.push('/admin/shops');
        } catch (e) {
            console.error(e);
            alert('削除に失敗しました');
        }
    };

    const addMenu = () => {
        setMenus([...menus, {
            name: '新規メニュー',
            price: 0,
            description: '',
            allergens_contained: [],
            allergens_removable: [],
            restaurant_id: params.id,
            _isNew: true
        }]);
    };

    const updateMenu = (index, field, value) => {
        const updated = [...menus];
        updated[index] = { ...updated[index], [field]: value };
        setMenus(updated);
    };

    const deleteMenu = async (index) => {
        const menu = menus[index];
        if (menu.id && !menu._isNew) {
            await supabase.from('menus').delete().eq('id', menu.id);
        }
        setMenus(menus.filter((_, i) => i !== index));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-400">読み込み中...</div>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-400">店舗が見つかりません</div>
            </div>
        );
    }

    const ALLERGENS = ['小麦', '卵', '乳', 'そば', '落花生', 'えび', 'かに'];

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/admin/shops')}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-bold text-slate-900">店舗詳細編集</h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors"
                        >
                            <Trash2 size={16} />
                            削除
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
                        >
                            <Save size={16} />
                            {saving ? '保存中...' : '保存'}
                        </button>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
                    <h2 className="text-sm font-bold text-slate-500 mb-4">基本情報</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">店舗名</label>
                            <input
                                type="text"
                                value={shop.name || ''}
                                onChange={e => setShop({ ...shop, name: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">
                                <MapPin size={12} className="inline mr-1" />住所
                            </label>
                            <input
                                type="text"
                                value={shop.address || ''}
                                onChange={e => setShop({ ...shop, address: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">
                                <Phone size={12} className="inline mr-1" />電話番号
                            </label>
                            <input
                                type="text"
                                value={shop.phone || ''}
                                onChange={e => setShop({ ...shop, phone: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">
                                <Globe size={12} className="inline mr-1" />公式サイト
                            </label>
                            <input
                                type="url"
                                value={shop.website_url || ''}
                                onChange={e => setShop({ ...shop, website_url: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">
                                <Instagram size={12} className="inline mr-1" />Instagram
                            </label>
                            <input
                                type="url"
                                value={shop.instagram_url || ''}
                                onChange={e => setShop({ ...shop, instagram_url: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">
                                <Image size={12} className="inline mr-1" />バナー画像URL
                            </label>
                            <input
                                type="url"
                                value={shop.image_url || ''}
                                onChange={e => setShop({ ...shop, image_url: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Banner Preview */}
                    {shop.image_url && (
                        <div className="mt-4">
                            <label className="block text-xs font-bold text-slate-400 mb-2">バナープレビュー</label>
                            <img
                                src={shop.image_url}
                                alt="Banner preview"
                                className="w-full h-48 object-cover rounded-xl border border-slate-200"
                            />
                        </div>
                    )}

                    <div className="mt-4">
                        <label className="block text-xs font-bold text-slate-400 mb-1">説明文</label>
                        <textarea
                            value={shop.description || ''}
                            onChange={e => setShop({ ...shop, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Menus */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-slate-500">メニュー一覧 ({menus.length})</h2>
                        <button
                            onClick={addMenu}
                            className="flex items-center gap-1 text-sm font-bold text-orange-600 hover:text-orange-700"
                        >
                            <Plus size={16} />
                            メニュー追加
                        </button>
                    </div>

                    <div className="space-y-4">
                        {menus.map((menu, idx) => (
                            <div key={menu.id || idx} className="border border-slate-200 rounded-xl p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <input
                                        type="text"
                                        value={menu.name || ''}
                                        onChange={e => updateMenu(idx, 'name', e.target.value)}
                                        className="text-lg font-bold text-slate-800 border-b border-transparent hover:border-slate-200 focus:border-orange-500 outline-none flex-1"
                                        placeholder="メニュー名"
                                    />
                                    <button
                                        onClick={() => deleteMenu(idx)}
                                        className="text-slate-400 hover:text-red-500 p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">価格</label>
                                        <input
                                            type="number"
                                            value={menu.price || ''}
                                            onChange={e => updateMenu(idx, 'price', parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">画像URL</label>
                                        <input
                                            type="url"
                                            value={menu.image_url || ''}
                                            onChange={e => updateMenu(idx, 'image_url', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                {/* Allergens */}
                                <div className="mb-3">
                                    <label className="block text-xs text-slate-400 mb-2">アレルゲン情報</label>
                                    <div className="flex flex-wrap gap-2">
                                        {ALLERGENS.map(allergen => {
                                            const isContained = (menu.allergens_contained || []).includes(allergen);
                                            const isRemovable = (menu.allergens_removable || []).includes(allergen);
                                            return (
                                                <div key={allergen} className="flex items-center gap-1 text-xs">
                                                    <span className="text-slate-600 w-10">{allergen}</span>
                                                    <label className="flex items-center gap-0.5 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={isContained}
                                                            onChange={e => {
                                                                const current = menu.allergens_contained || [];
                                                                updateMenu(idx, 'allergens_contained',
                                                                    e.target.checked ? [...current, allergen] : current.filter(a => a !== allergen)
                                                                );
                                                            }}
                                                            className="accent-rose-500"
                                                        />
                                                        <span className="text-rose-500">含</span>
                                                    </label>
                                                    <label className="flex items-center gap-0.5 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={isRemovable}
                                                            onChange={e => {
                                                                const current = menu.allergens_removable || [];
                                                                updateMenu(idx, 'allergens_removable',
                                                                    e.target.checked ? [...current, allergen] : current.filter(a => a !== allergen)
                                                                );
                                                            }}
                                                            className="accent-blue-500"
                                                        />
                                                        <span className="text-blue-500">除</span>
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <textarea
                                    value={menu.description || ''}
                                    onChange={e => updateMenu(idx, 'description', e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                                    placeholder="メニュー説明"
                                />
                            </div>
                        ))}

                        {menus.length === 0 && (
                            <div className="text-center py-8 text-slate-400">
                                メニューがありません
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
