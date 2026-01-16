'use client'

import React from 'react';
import { MapPin, Phone, Globe, Star, Clock, ShieldCheck } from 'lucide-react';

/**
 * ShopPreview - Mobile-style preview of how shop will appear on the public site
 * Used in approval console to see final appearance before approving
 */
export const ShopPreview = ({ shop, menus = [] }) => {
    if (!shop) return null;

    const getPhoto = () => {
        const sources = shop.sources || [];
        const meta = sources.find(s => s.type === 'system_metadata');
        return meta?.data?.images?.[0]?.url || shop.image_url || null;
    };

    const photo = getPhoto();

    return (
        <div className="w-[375px] bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200">
            {/* Status Bar Mock */}
            <div className="bg-black text-white text-[10px] px-5 py-1 flex justify-between items-center">
                <span>9:41</span>
                <div className="flex gap-1 items-center">
                    <span>📶</span>
                    <span>🔋</span>
                </div>
            </div>

            {/* App Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3">
                <div className="text-white/80 text-xs">あんしんレシピ</div>
            </div>

            {/* Hero Image */}
            <div
                className="h-48 bg-slate-200 relative"
                style={photo ? { backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
                {!photo && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-4xl">
                        🏪
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <h1 className="text-white font-bold text-lg">{shop.shop_name || shop.name}</h1>
                </div>
            </div>

            {/* Info Section */}
            <div className="p-4 space-y-3">
                {/* Address */}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={14} className="text-orange-500 shrink-0" />
                    <span className="truncate">{shop.address || '住所未設定'}</span>
                </div>

                {/* Phone */}
                {shop.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone size={14} className="text-blue-500 shrink-0" />
                        <span>{shop.phone}</span>
                    </div>
                )}

                {/* Website */}
                {(shop.website_url) && (
                    <div className="flex items-center gap-2 text-sm text-blue-500">
                        <Globe size={14} className="shrink-0" />
                        <span className="truncate underline">公式サイトを見る</span>
                    </div>
                )}

                {/* Reliability Score */}
                <div className="flex items-center gap-2">
                    <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Star size={12} className="fill-current" />
                        信頼度 {shop.reliability_score || shop.finalReliabilityScore || 0}
                    </div>
                    <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <ShieldCheck size={12} />
                        アレルギー対応
                    </div>
                </div>
            </div>

            {/* Menu Section */}
            <div className="border-t border-slate-100 p-4">
                <h2 className="text-sm font-bold text-slate-700 mb-3">メニュー ({menus.length || shop.menus?.length || 0})</h2>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {(menus.length > 0 ? menus : shop.menus || []).slice(0, 5).map((menu, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                            <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-xl shrink-0">
                                🍽️
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-slate-800 truncate">{menu.name}</div>
                                <div className="flex gap-1 flex-wrap mt-1">
                                    {(menu.allergens_contained || menu.supportedAllergens || []).slice(0, 3).map((a, i) => (
                                        <span key={i} className="text-[9px] px-1 py-0.5 bg-green-100 text-green-700 rounded">
                                            {a}不使用
                                        </span>
                                    ))}
                                    {(menu.allergens_removable || []).slice(0, 2).map((a, i) => (
                                        <span key={i} className="text-[9px] px-1 py-0.5 bg-blue-100 text-blue-700 rounded">
                                            {a}除去可
                                        </span>
                                    ))}
                                </div>
                            </div>
                            {menu.price && (
                                <div className="text-sm font-bold text-orange-600">¥{menu.price}</div>
                            )}
                        </div>
                    ))}
                    {(menus.length === 0 && (!shop.menus || shop.menus.length === 0)) && (
                        <div className="text-center py-4 text-slate-400 text-sm">
                            メニュー情報なし
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation Mock */}
            <div className="border-t border-slate-100 px-4 py-3 flex justify-around text-slate-400">
                <div className="text-center">
                    <div className="text-lg">🗺️</div>
                    <div className="text-[10px]">マップ</div>
                </div>
                <div className="text-center text-orange-500">
                    <div className="text-lg">🏪</div>
                    <div className="text-[10px] font-bold">店舗</div>
                </div>
                <div className="text-center">
                    <div className="text-lg">⭐</div>
                    <div className="text-[10px]">お気に入り</div>
                </div>
                <div className="text-center">
                    <div className="text-lg">👤</div>
                    <div className="text-[10px]">マイページ</div>
                </div>
            </div>

            {/* Home Indicator */}
            <div className="h-6 flex items-center justify-center">
                <div className="w-32 h-1 bg-slate-300 rounded-full"></div>
            </div>
        </div>
    );
};

export default ShopPreview;
