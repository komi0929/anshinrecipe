'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Star, MessageCircle, Utensils } from 'lucide-react';
import { LikeButton } from '@/components/social/LikeButton';

export const ReviewList = ({ restaurantId }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
                    *,
                    menus ( name, price ),
                    review_likes ( count )
                `)
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false });

            if (data) {
                setReviews(data);
            }
            setLoading(false);
        };

        fetchReviews();
    }, [restaurantId]);

    if (loading) return <div className="py-8 text-center text-gray-500">読み込み中...</div>;
    if (reviews.length === 0) return (
        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">まだ投稿がありません</p>
            <p className="text-sm text-slate-400 mt-1">一番乗りで投稿してみよう！</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {reviews.map(review => (
                <div key={review.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    {/* Header: User & Rating */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                {/* Future: User Avatar */}
                                <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-400 text-xs font-bold">
                                    USR
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-700 text-sm">
                                        {review.is_anonymous ? '匿名ユーザー' : (review.user?.user_metadata?.full_name || 'ゲストユーザー')}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {new Date(review.visit_date || review.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={12}
                                            fill={i < review.rating ? '#FBBF24' : 'none'}
                                            className={i < review.rating ? 'text-amber-400' : 'text-slate-200'}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* Menu Tag */}
                        {review.review_type === 'menu_post' && (
                            <div className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-bold flex items-center gap-1">
                                <Utensils size={12} />
                                {review.is_own_menu ? review.custom_menu_name : review.menus?.name}
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                        <p className="text-slate-700 text-sm leading-relaxed">{review.content}</p>
                    </div>

                    {/* Images */}
                    {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
                            {review.images.map((img, i) => (
                                <img
                                    key={i}
                                    src={img}
                                    className="w-24 h-24 object-cover rounded-lg border border-slate-100 flex-shrink-0"
                                    alt="Review"
                                />
                            ))}
                        </div>
                    )}

                    {/* Footer: Likes */}
                    <div className="flex items-center gap-4 pt-3 border-t border-slate-50">
                        <LikeButton reviewId={review.id} initialCount={review.review_likes?.[0]?.count || 0} />
                        <button className="flex items-center gap-1 text-slate-400 hover:text-slate-600">
                            <MessageCircle size={18} />
                            <span className="text-sm font-medium">コメント</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
