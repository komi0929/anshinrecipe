'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';
import { useMapData } from '@/hooks/useMapData';
import { ArrowLeft, MapPin, Phone, Globe, Star, AlertTriangle, CheckCircle, HelpCircle, Instagram, ShieldCheck, Plus, Flag } from 'lucide-react';
import { MenuList } from '@/components/map/MenuList';
import { ReviewModal } from '@/components/map/ReviewModal';
import { ReportModal } from '@/components/map/ReportModal';
import { ReviewList } from '@/components/map/ReviewList';
import { MenuGallery } from '@/components/map/MenuGallery';
import { BookmarkButton } from '@/components/social/BookmarkButton';
import './RestaurantDetailPage.css';

export default function RestaurantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { restaurants, loading } = useMapData();
    const [restaurant, setRestaurant] = useState(null);
    const [customMenus, setCustomMenus] = useState([]); // User submitted menus
    const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'reviews', 'gallery'
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [menuToReport, setMenuToReport] = useState(null); // For menu-level reports

    // 1. Fetch Restaurant Data (Existing)
    useEffect(() => {
        if (!loading && restaurants.length > 0) {
            const found = restaurants.find(r => r.id === params.id || r.place_id === params.id);
            if (found) setRestaurant(found);
        }
    }, [params.id, restaurants, loading]);

    // 2. Fetch User Submitted Menus (New)
    useEffect(() => {
        const fetchCustomMenus = async () => {
            if (!restaurant?.id) return;

            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .eq('review_type', 'menu_post')
                .eq('is_own_menu', true);

            if (data) {
                // Transform reviews into "Menu-like" objects for the MenuList component
                const formattedMenus = data.map(review => {
                    // Start with all 4 allergens as "contained" (Unknown/Danger) by default
                    // Then remove them if the user marked them as safe.
                    // This is a conservative approach: "If not marked safe, assume contained/unknown"
                    // However, MenuList logic is: if contained -> Gray/Red. If not contained -> Emerald/Safe.
                    // So we need to populate 'allergens_contained' with everything that IS NOT in 'allergens_safe'.
                    const validAllergens = ['wheat', 'egg', 'milk', 'nut'];
                    const safeList = review.allergens_safe || [];

                    // Logic: If user didn't mark it safe, we assume it MIGHT contain it (conservative).
                    // In the UI, 'contained' means "Use" (Gray/Red).
                    const contained = validAllergens.filter(a => !safeList.includes(a));

                    // Logic: If "contained" is empty, it means the user marked EVERYTHING as safe.
                    // We can treat this as "Major Allergen Free" for the badge.
                    const tags = [];
                    if (contained.length === 0) {
                        tags.push('8_major_free');
                    }

                    return {
                        id: `custom-${review.id}`,
                        name: review.custom_menu_name,
                        price: review.price_paid, // Confirmed Int from ReviewModal
                        description: review.content,
                        image_url: review.images?.[0] || null,
                        allergens_contained: contained,
                        allergens_removable: [], // Initialize to avoid undefined, though UI handles it
                        tags: tags, // Consistent badge display
                        is_user_submitted: true,
                        source_user: review.user_id,
                        created_at: review.created_at
                    };
                });
                setCustomMenus(formattedMenus);
            }
        };

        fetchCustomMenus();
    }, [restaurant]); // Re-run when restaurant is set

    if (loading) return <div className="p-8 text-center text-gray-500 font-medium animate-pulse">読み込み中...</div>;
    if (!restaurant) return <div className="p-8 text-center text-red-500 font-bold">店舗が見つかりませんでした</div>;

    // Merge Official Menus + Custom Menus
    const displayMenus = [...(restaurant.menus || []), ...customMenus];

    const getStatusIcon = (status) => {
        switch (status) {
            case 'safe': return <CheckCircle size={20} className="text-green-500" />;
            case 'removable': return <AlertTriangle size={20} className="text-yellow-500" />;
            case 'contaminated': return <AlertTriangle size={20} className="text-red-500" />;
            default: return <HelpCircle size={20} className="text-gray-400" />;
        }
    };

    return (
        <div className="restaurant-detail-page pb-24 bg-white min-h-screen">
            {/* Header Image */}
            <div className="restaurant-hero h-72 bg-slate-200 relative overflow-hidden group">
                {(restaurant.image_url || restaurant.menus?.[0]?.image_url) ? (
                    <img
                        src={restaurant.image_url || restaurant.menus?.[0]?.image_url}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        alt={restaurant.name}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-100">
                        <Globe size={48} className="opacity-20" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Top Actions */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
                    <button
                        onClick={() => router.back()}
                        className="bg-white/90 p-3 rounded-full shadow-lg backdrop-blur-md text-slate-700 hover:bg-white transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex gap-3">
                        {/* Bookmark Button */}
                        <BookmarkButton restaurantId={restaurant.id} className="shadow-lg" />
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto w-full relative z-10 px-0 sm:px-4">
                <div className="bg-white rounded-t-3xl sm:rounded-3xl relative -mt-10 p-6 sm:shadow-xl sm:border border-slate-100 min-h-[500px]">

                    {/* Address with Google Maps Link */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold bg-orange-500 text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-sm shadow-orange-200">
                                {restaurant.tags?.[0] || '飲食店'}
                            </span>
                            <div className="flex items-center gap-1 text-amber-400">
                                <Star size={14} fill="currentColor" />
                                <span className="text-xs font-bold text-slate-700">4.5</span>
                            </div>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight mb-2">{restaurant.name}</h1>
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-slate-500 hover:bg-slate-50 p-2 -ml-2 rounded-lg transition-colors group/map"
                        >
                            <MapPin size={16} className="text-orange-500 shrink-0 group-hover/map:scale-110 transition-transform" />
                            <span className="font-medium line-clamp-1 underline decoration-slate-300 decoration-dotted underline-offset-4 group-hover/map:text-orange-600 group-hover/map:decoration-orange-300">{restaurant.address}</span>
                        </a>
                    </div>

                    {/* Action Bar (Call/Web) */}
                    <div className="flex gap-3 mb-8 pb-4 overflow-x-auto scrollbar-none">
                        {restaurant.phone && (
                            <a href={`tel:${restaurant.phone}`} className="flex items-center gap-2 px-5 py-3 bg-slate-50 rounded-2xl text-slate-700 font-bold hover:bg-slate-100 transition-colors border border-slate-200 shrink-0">
                                <Phone size={18} /> <span>電話</span>
                            </a>
                        )}
                        {restaurant.instagram_url && (
                            <a href={restaurant.instagram_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-3 bg-gradient-to-tr from-purple-50 to-pink-50 text-pink-600 rounded-2xl font-bold border border-pink-100 shrink-0">
                                <Instagram size={18} /> <span>Instagram</span>
                            </a>
                        )}
                        {restaurant.website_url && (
                            <a href={restaurant.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-3 bg-slate-50 rounded-2xl text-slate-700 font-bold hover:bg-slate-100 transition-colors border border-slate-200 shrink-0">
                                <Globe size={18} /> <span>Web</span>
                            </a>
                        )}
                    </div>

                    {/* NEW: Horizontal Menu Highlight */}
                    <div className="mb-8">
                        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <span className="text-xl">🍽️</span> これが食べられる！
                        </h3>
                        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide snap-x">
                            {restaurant.menus?.map((menu, index) => (
                                <div key={menu.id || index} className="snap-center shrink-0 w-40">
                                    <div className="aspect-square rounded-2xl overflow-hidden mb-2 bg-slate-100 relative">
                                        {menu.image_url ? (
                                            <img src={menu.image_url} className="w-full h-full object-cover" alt={menu.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">🍳</div>
                                        )}
                                    </div>
                                    <div className="font-bold text-sm text-slate-800 line-clamp-1">{menu.name}</div>
                                    <div className="text-xs text-slate-400">¥{menu.price}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Features Sections: Allergy & Kids */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {/* Allergy Support */}
                        <div className="bg-orange-50/50 p-5 rounded-3xl border border-orange-100">
                            <h3 className="font-bold text-orange-800 mb-4 flex items-center gap-2">
                                <ShieldCheck size={18} className="text-orange-500" />
                                アレルギー対応
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'メニュー表記', key: 'allergen_label', icon: '📋' },
                                    { label: 'コンタミ対策', key: 'contamination', icon: '🛡️' },
                                    { label: '除去食対応', key: 'removal', icon: '🍽️' },
                                    { label: 'アレルギー表', key: 'chart', icon: '📊' }
                                ].map(item => (
                                    <div key={item.key} className={`bg-white p-3 rounded-xl border flex flex-col items-center justify-center text-center shadow-sm ${restaurant.features?.[item.key] === '◯' ? 'border-orange-200 bg-orange-50/30' : 'border-slate-100 opacity-60'}`}>
                                        <div className="text-lg mb-1">{item.icon}</div>
                                        <div className="text-[10px] font-bold text-slate-600">{item.label}</div>
                                        <div className={`text-xs font-bold mt-1 ${restaurant.features?.[item.key] === '◯' ? 'text-orange-500' : 'text-slate-300'}`}>
                                            {restaurant.features?.[item.key] === '◯' ? '◯' : '-'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Kids Support */}
                        <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100">
                            <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                                <span className="text-blue-500">👶</span>
                                キッズ対応
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'キッズチェア', key: 'kids_chair', icon: '🪑' },
                                    { label: 'ベビーカー', key: 'stroller', icon: '🛒' },
                                    { label: 'おむつ交換', key: 'diaper', icon: '🚻' },
                                    { label: '離乳食持込', key: 'baby_food', icon: '🍼' }
                                ].map(item => (
                                    <div key={item.key} className={`bg-white p-3 rounded-xl border flex flex-col items-center justify-center text-center shadow-sm ${restaurant.features?.[item.key] === '◯' || restaurant.features?.[item.key + '_access'] ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100 opacity-60'}`}>
                                        <div className="text-lg mb-1">{item.icon}</div>
                                        <div className="text-[10px] font-bold text-slate-600">{item.label}</div>
                                        <div className={`text-xs font-bold mt-1 ${restaurant.features?.[item.key] === '◯' || restaurant.features?.[item.key + '_access'] ? 'text-blue-500' : 'text-slate-300'}`}>
                                            {restaurant.features?.[item.key] === '◯' || restaurant.features?.[item.key + '_access'] ? '◯' : '-'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Facilities - NEW */}
                    <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-200 mb-8">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <span>🏢</span>
                            施設情報
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: '駐車場', key: 'parking', icon: '🅿️' },
                                { label: 'バリアフリー', key: 'wheelchair_accessible', icon: '♿' },
                                { label: '個室', key: 'private_room', icon: '🚪' }
                            ].map(item => (
                                <div key={item.key} className={`bg-white p-3 rounded-xl border flex flex-col items-center justify-center text-center shadow-sm ${restaurant.features?.[item.key] === '◯' ? 'border-green-200 bg-green-50/30' : 'border-slate-100 opacity-60'}`}>
                                    <div className="text-lg mb-1">{item.icon}</div>
                                    <div className="text-[10px] font-bold text-slate-600">{item.label}</div>
                                    <div className={`text-xs font-bold mt-1 ${restaurant.features?.[item.key] === '◯' ? 'text-green-500' : 'text-slate-300'}`}>
                                        {restaurant.features?.[item.key] === '◯' ? '◯' : '-'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* TABS */}
                    <div className="flex items-center gap-6 border-b border-slate-100 mb-6 sticky top-0 bg-white z-20 pt-2">
                        <button
                            onClick={() => setActiveTab('menu')}
                            className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'menu' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            メニュー詳細
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'reviews' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            口コミ・記録
                        </button>
                        <button
                            onClick={() => setActiveTab('gallery')}
                            className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'gallery' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            写真
                        </button>
                    </div>

                    {/* TAB CONTENT */}
                    <div className="min-h-[300px]">
                        {activeTab === 'menu' && (
                            <>
                                <MenuList
                                    menus={displayMenus}
                                    onReportMenu={(menu) => setMenuToReport(menu)}
                                />
                                {/* Safety Voice removed as per user request (redundant) */}
                            </>
                        )}


                        {activeTab === 'reviews' && (
                            <div className="animate-fadeIn">
                                <ReviewList restaurantId={restaurant.id} />
                            </div>
                        )}

                        {activeTab === 'gallery' && (
                            <div className="animate-fadeIn">
                                <MenuGallery restaurantId={restaurant.id} images={restaurant.images} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Review Button - Positioned above BottomNav */}
            <div className="fixed bottom-28 right-6 z-30">
                <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-xl shadow-orange-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center font-bold gap-2"
                >
                    <Plus size={24} strokeWidth={3} />
                    <span className="hidden sm:inline">投稿する</span>
                </button>
            </div>

            <ReviewModal
                restaurantId={restaurant.id}
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
            />

            {/* Report Modal - Shop Level */}
            <ReportModal
                type="shop"
                restaurantId={restaurant.id}
                restaurantName={restaurant.name}
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
            />

            {/* Report Modal - Menu Level */}
            {menuToReport && (
                <ReportModal
                    type="menu"
                    restaurantId={restaurant.id}
                    menuId={menuToReport.id}
                    restaurantName={restaurant.name}
                    menuName={menuToReport.name}
                    isOpen={!!menuToReport}
                    onClose={() => setMenuToReport(null)}
                />
            )}

            {/* Report Button - Bottom of page */}
            <div className="fixed bottom-28 left-6 z-30">
                <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="bg-slate-600 hover:bg-slate-700 text-white p-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                    title="問題を報告"
                >
                    <Flag size={20} />
                </button>
            </div>
        </div>
    );
}
