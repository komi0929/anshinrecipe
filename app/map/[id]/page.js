'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMapData } from '@/hooks/useMapData'; // We might need to export this properly or move logic
import { ArrowLeft, MapPin, Clock, Phone, Globe, Star, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import './RestaurantDetailPage.css';
import { MenuList } from '@/components/map/MenuList';
import { ReviewModal } from '@/components/map/ReviewModal';

export default function RestaurantDetailPage() {
    const params = useParams();
    const router = useRouter();
    // In a real app we'd fetch specific ID here, but reusing hook for simplicity in mock
    const { restaurants, loading } = useMapData();
    const [restaurant, setRestaurant] = useState(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    useEffect(() => {
        if (!loading && restaurants.length > 0) {
            // Match by ID or Place ID from seed
            // Note: Seed IDs are not UUIDs currently in the JSON (they rely on index or place_id). 
            // We'll search by place_id if UUID search fails or just index if passed.
            // For this phase, let's assume we pass ID.
            const found = restaurants.find(r => r.id === params.id || r.place_id === params.id);
            if (found) setRestaurant(found);
        }
    }, [params.id, restaurants, loading]);

    if (loading) return <div className="p-8 text-center">読み込み中...</div>;
    if (!restaurant) return <div className="p-8 text-center">店舗が見つかりませんでした</div>;

    const getStatusIcon = (status) => {
        switch (status) {
            case 'safe': return <CheckCircle size={20} className="text-green-500" />;
            case 'removable': return <AlertTriangle size={20} className="text-yellow-500" />;
            case 'contaminated': return <AlertTriangle size={20} className="text-red-500" />;
            default: return <HelpCircle size={20} className="text-gray-400" />;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'safe': return '対応可';
            case 'removable': return '除去可';
            case 'contaminated': return '不可';
            default: return '不明';
        }
    };

    return (
        <div className="restaurant-detail-page pb-20">
            {/* Header Image */}
            <div className="restaurant-hero h-48 bg-gray-200 relative">
                {/* Placeholder for now */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    Image Placeholder
                </div>
                <button
                    onClick={() => router.back()}
                    className="absolute top-4 left-4 bg-white/90 p-2 rounded-full shadow-sm"
                >
                    <ArrowLeft size={20} className="text-gray-700" />
                </button>
            </div>

            {/* Content Container for Desktop */}
            <div className="max-w-3xl mx-auto w-full relative z-10">
                {/* Content */}
                <div className="bg-white -mt-4 rounded-t-3xl relative p-6 shadow-sm min-h-screen lg:rounded-3xl lg:mt-[-40px] lg:shadow-xl lg:mb-10 lg:min-h-0">
                    <div className="mb-1">
                        <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                            {restaurant.tags?.[0] || '飲食店'}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">{restaurant.name}</h1>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                        <MapPin size={16} />
                        <span>{restaurant.address}</span>
                    </div>

                    {/* ✨ Menu First - Display Menus Top */}
                    <MenuList menus={restaurant.menus} />
                    <div className="mb-4 border-b border-gray-100" />

                    {/* Allergen Status Grid */}
                    <div className="mb-8">
                        <h2 className="font-bold text-gray-700 mb-3 text-lg px-2">アレルギー対応状況</h2>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {['wheat', 'milk', 'egg', 'nut'].map(allergen => {
                                const comp = restaurant.compatibility?.find(c => c.allergen === allergen);
                                const status = comp?.status || 'unknown';

                                const allergenName = {
                                    wheat: '小麦',
                                    milk: '乳',
                                    egg: '卵',
                                    nut: 'ナッツ類'
                                }[allergen];

                                return (
                                    <div key={allergen} className="border border-gray-100 rounded-xl p-3 flex items-center justify-between bg-gray-50">
                                        <span className="font-bold text-gray-600">{allergenName}</span>
                                        <div className="flex items-center gap-1 text-sm font-bold">
                                            {getStatusIcon(status)}
                                            <span className={
                                                status === 'safe' ? 'text-green-600' :
                                                    status === 'removable' ? 'text-yellow-600' :
                                                        status === 'contaminated' ? 'text-red-500' : 'text-gray-400'
                                            }>
                                                {getStatusLabel(status)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {restaurant.contamination_level === 'strict' && (
                            <div className="mt-3 bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-start gap-2">
                                <CheckCircle size={16} className="mt-1 flex-shrink-0" />
                                <p>
                                    <strong>厳格なコンタミネーション管理</strong><br />
                                    専用の調理器具・エリアを使用しています。
                                </p>
                            </div>
                        )}
                        {/* 子どもの安心対応 Section */}
                        <div className="mb-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <h2 className="font-bold text-blue-900 mb-3 text-lg flex items-center gap-2">
                                👶 子どもの安心対応
                            </h2>

                            <div className="space-y-2">
                                {restaurant.child_status === 'confirmed' ? (
                                    <>
                                        {/* Template points to check */}
                                        <div className="flex items-center gap-2 text-blue-800 text-sm font-bold">
                                            <CheckCircle size={16} />
                                            <span>お子様メニュー: 対応あり</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-blue-800 text-sm font-bold">
                                            <CheckCircle size={16} />
                                            <span>設備: {restaurant.features?.kids_chair ? 'キッズチェアあり' : '確認中'}</span>
                                        </div>
                                        {restaurant.child_details && (
                                            <p className="text-xs text-blue-600 mt-2 bg-white/50 p-2 rounded-lg">
                                                備考: {restaurant.child_details.note || '詳細情報の提供をお待ちしております'}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2 text-blue-600/60 text-sm font-bold italic">
                                        <HelpCircle size={16} />
                                        <span>対応内容を確認中です</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="space-y-4 mb-8">
                            <h2 className="font-bold text-gray-700 text-lg">店舗詳細情報</h2>

                            <div className="flex items-start gap-3">
                                <Clock className="text-gray-400 mt-1" size={18} />
                                <div className="text-sm text-gray-600">
                                    {/* Simple display, structured data handling later */}
                                    <p>営業中: 10:00 - 18:00</p>
                                </div>
                            </div>
                        </div>

                        {/* FAB for Review (Absolute to relative container on desktop) */}
                        <div className="fixed bottom-24 right-4 group lg:absolute lg:bottom-8 lg:right-8">
                            <button
                                onClick={() => setIsReviewModalOpen(true)}
                                className="bg-orange-500 text-white rounded-full p-4 shadow-lg flex items-center gap-2 hover:bg-orange-600 transition-all font-bold"
                            >
                                <Star size={20} fill="currentColor" />
                                <span>口コミを投稿</span>
                            </button>
                        </div>
                    </div>
                </div>

                <ReviewModal
                    restaurantId={restaurant.id}
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                />
            </div>
        </div>
    );
}
