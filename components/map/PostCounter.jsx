"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TrendingUp, PenTool, Users, MapPin } from "lucide-react";

/**
 * 投稿カウンター表示（92件改善 Phase4）
 * 4.9 投稿カウンター実装
 */

export const PostCounter = ({ userId, variant = "card" }) => {
  const [stats, setStats] = useState({ reviews: 0, restaurants: 0, likes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    // レビュー数取得
    const { count: reviewCount } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // ユニーク店舗数取得
    const { data: reviews } = await supabase
      .from("reviews")
      .select("restaurant_id")
      .eq("user_id", userId);

    const uniqueRestaurants = new Set(reviews?.map((r) => r.restaurant_id))
      .size;

    // いいね数取得
    const reviewIds = reviews?.map((r) => r.id) || [];
    let totalLikes = 0;
    if (reviewIds.length > 0) {
      const { count } = await supabase
        .from("review_likes")
        .select("*", { count: "exact", head: true })
        .in("review_id", reviewIds);
      totalLikes = count || 0;
    }

    setStats({
      reviews: reviewCount || 0,
      restaurants: uniqueRestaurants,
      likes: totalLikes,
    });
    setLoading(false);
  };

  if (loading) {
    return <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1 text-slate-600">
          <PenTool size={14} className="text-orange-500" />
          <strong>{stats.reviews}</strong> 投稿
        </span>
        <span className="flex items-center gap-1 text-slate-600">
          <MapPin size={14} className="text-blue-500" />
          <strong>{stats.restaurants}</strong> 店舗
        </span>
        <span className="flex items-center gap-1 text-slate-600">
          <TrendingUp size={14} className="text-pink-500" />
          <strong>{stats.likes}</strong> いいね
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
      <h3 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
        <TrendingUp size={16} className="text-orange-500" />
        あなたの投稿活動
      </h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-2xl font-black text-orange-600">
            {stats.reviews}
          </div>
          <div className="text-xs text-slate-500">投稿数</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-blue-600">
            {stats.restaurants}
          </div>
          <div className="text-xs text-slate-500">訪問店舗</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-pink-600">{stats.likes}</div>
          <div className="text-xs text-slate-500">いいね</div>
        </div>
      </div>
    </div>
  );
};

export default PostCounter;
