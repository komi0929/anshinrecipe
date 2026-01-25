"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  TrendingUp,
  Eye,
  Bookmark,
  Star,
  MessageCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/**
 * オーナー統計ダッシュボード（92件改善 Phase5）
 * 5.1-5.10 オーナー機能
 */

export const OwnerStats = ({ restaurantId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30"); // 30日

  useEffect(() => {
    fetchStats();
  }, [restaurantId, period]);

  const fetchStats = async () => {
    if (!restaurantId) return;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // レビュー数
    const { count: reviewCount } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .gte("created_at", startDate.toISOString());

    // ブックマーク数
    const { count: bookmarkCount } = await supabase
      .from("bookmarks")
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId);

    // 平均評価
    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("restaurant_id", restaurantId);

    const avgRating = reviews?.length
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : "-";

    // 総レビュー数
    const { count: totalReviews } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId);

    setStats({
      reviewCount: reviewCount || 0,
      bookmarkCount: bookmarkCount || 0,
      avgRating,
      totalReviews: totalReviews || 0,
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
          <TrendingUp size={20} className="text-orange-500" />
          統計ダッシュボード
        </h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
        >
          <option value="7">過去7日</option>
          <option value="30">過去30日</option>
          <option value="90">過去90日</option>
          <option value="365">過去1年</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Reviews */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <MessageCircle size={16} />
            <span className="text-xs font-bold">総口コミ数</span>
          </div>
          <div className="text-3xl font-black text-slate-800">
            {stats.totalReviews}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            期間内: +{stats.reviewCount}件
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Star size={16} />
            <span className="text-xs font-bold">平均評価</span>
          </div>
          <div className="text-3xl font-black text-slate-800 flex items-center gap-1">
            {stats.avgRating}
            <Star size={20} className="text-amber-400" fill="#FBBF24" />
          </div>
        </div>

        {/* Bookmarks */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Bookmark size={16} />
            <span className="text-xs font-bold">お気に入り登録</span>
          </div>
          <div className="text-3xl font-black text-slate-800">
            {stats.bookmarkCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">ユーザー</div>
        </div>

        {/* Views Placeholder */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <Eye size={16} />
            <span className="text-xs font-bold">ページ閲覧</span>
          </div>
          <div className="text-3xl font-black text-slate-800">-</div>
          <div className="text-xs text-slate-500 mt-1">近日対応予定</div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
        <h3 className="font-bold text-sm text-slate-700 mb-2">💡 ヒント</h3>
        <ul className="text-xs text-slate-500 space-y-1">
          <li>• 口コミに返信すると、ユーザーの信頼度がアップします</li>
          <li>• メニュー情報を充実させると、検索で見つかりやすくなります</li>
          <li>• 写真を追加すると、お気に入り登録率が向上します</li>
        </ul>
      </div>
    </div>
  );
};

export default OwnerStats;
