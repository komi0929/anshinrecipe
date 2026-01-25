"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Award,
  Star,
  Trophy,
  Utensils,
  Camera,
  MessageCircle,
  Medal,
} from "lucide-react";

/**
 * 投稿バッジシステム（92件改善 Phase3・Phase4）
 * 3.17 投稿バッジシステム実装
 * 4.5 投稿バッジ/レベルシステム実装
 */

// バッジ定義
export const BADGE_DEFINITIONS = {
  first_post: {
    id: "first_post",
    name: "はじめての投稿",
    description: "最初の口コミを投稿しました",
    icon: Star,
    color: "amber",
    requirement: 1,
    type: "review_count",
  },
  reviewer_level_1: {
    id: "reviewer_level_1",
    name: "レビュアー Lv.1",
    description: "5件の口コミを投稿",
    icon: Medal,
    color: "orange",
    requirement: 5,
    type: "review_count",
  },
  reviewer_level_2: {
    id: "reviewer_level_2",
    name: "レビュアー Lv.2",
    description: "10件の口コミを投稿",
    icon: Award,
    color: "purple",
    requirement: 10,
    type: "review_count",
  },
  reviewer_level_3: {
    id: "reviewer_level_3",
    name: "レビュアー Lv.3",
    description: "25件の口コミを投稿",
    icon: Trophy,
    color: "indigo",
    requirement: 25,
    type: "review_count",
  },
  photo_lover: {
    id: "photo_lover",
    name: "写真好き",
    description: "写真付き投稿を5回",
    icon: Camera,
    color: "pink",
    requirement: 5,
    type: "photo_count",
  },
  gourmet: {
    id: "gourmet",
    name: "グルメ",
    description: "10店舗以上に投稿",
    icon: Utensils,
    color: "emerald",
    requirement: 10,
    type: "unique_restaurants",
  },
  helpful: {
    id: "helpful",
    name: "役立つレビュアー",
    description: "合計10いいねを獲得",
    icon: MessageCircle,
    color: "blue",
    requirement: 10,
    type: "total_likes",
  },
};

// ユーザーの統計を取得
export async function getUserStats(userId) {
  if (!userId) return null;

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, images, restaurant_id")
    .eq("user_id", userId);

  if (error) return null;

  // レビュー数
  const reviewCount = reviews?.length || 0;

  // 写真付き投稿数
  const photoCount =
    reviews?.filter((r) => r.images && r.images.length > 0).length || 0;

  // ユニーク店舗数
  const uniqueRestaurants = new Set(reviews?.map((r) => r.restaurant_id)).size;

  // いいね数の取得
  const reviewIds = reviews?.map((r) => r.id) || [];
  let totalLikes = 0;
  if (reviewIds.length > 0) {
    const { count } = await supabase
      .from("review_likes")
      .select("*", { count: "exact", head: true })
      .in("review_id", reviewIds);
    totalLikes = count || 0;
  }

  return {
    review_count: reviewCount,
    photo_count: photoCount,
    unique_restaurants: uniqueRestaurants,
    total_likes: totalLikes,
  };
}

// ユーザーの獲得バッジを計算
export function calculateEarnedBadges(stats) {
  if (!stats) return [];

  const earned = [];

  for (const [badgeId, badge] of Object.entries(BADGE_DEFINITIONS)) {
    const statValue = stats[badge.type] || 0;
    if (statValue >= badge.requirement) {
      earned.push({
        ...badge,
        earnedAt: new Date().toISOString(), // 本番では保存日時を使う
      });
    }
  }

  return earned;
}

// 次に獲得できるバッジを計算
export function getNextBadges(stats) {
  if (!stats) return [];

  const next = [];

  for (const [badgeId, badge] of Object.entries(BADGE_DEFINITIONS)) {
    const statValue = stats[badge.type] || 0;
    if (statValue < badge.requirement) {
      next.push({
        ...badge,
        progress: statValue,
        remaining: badge.requirement - statValue,
      });
    }
  }

  // 残り少ない順にソート
  return next.sort(
    (a, b) => a.remaining / a.requirement - b.remaining / b.requirement,
  );
}

// バッジ表示コンポーネント
export const BadgeDisplay = ({ badge, size = "md", showName = true }) => {
  const Icon = badge.icon;
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };
  const iconSizes = { sm: 16, md: 24, lg: 32 };
  const colorClasses = {
    amber: "bg-amber-100 text-amber-600 border-amber-200",
    orange: "bg-orange-100 text-orange-600 border-orange-200",
    purple: "bg-purple-100 text-purple-600 border-purple-200",
    indigo: "bg-indigo-100 text-indigo-600 border-indigo-200",
    pink: "bg-pink-100 text-pink-600 border-pink-200",
    emerald: "bg-emerald-100 text-emerald-600 border-emerald-200",
    blue: "bg-blue-100 text-blue-600 border-blue-200",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClasses[size]} ${colorClasses[badge.color]} rounded-full border-2 flex items-center justify-center shadow-sm`}
      >
        <Icon size={iconSizes[size]} />
      </div>
      {showName && (
        <span className="text-xs font-bold text-slate-700 text-center">
          {badge.name}
        </span>
      )}
    </div>
  );
};

// バッジリストコンポーネント
export const BadgeList = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      getUserStats(userId).then((s) => {
        setStats(s);
        setLoading(false);
      });
    }
  }, [userId]);

  if (loading)
    return (
      <div className="text-center text-slate-400 text-sm py-4">
        読み込み中...
      </div>
    );
  if (!stats) return null;

  const earned = calculateEarnedBadges(stats);
  const next = getNextBadges(stats).slice(0, 2);

  return (
    <div className="space-y-4">
      {/* 獲得済みバッジ */}
      <div>
        <h3 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-2">
          <Award size={16} className="text-amber-500" />
          獲得したバッジ ({earned.length})
        </h3>
        {earned.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {earned.map((badge) => (
              <BadgeDisplay key={badge.id} badge={badge} size="md" />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl p-4 text-center text-sm text-slate-400">
            まだバッジを獲得していません
          </div>
        )}
      </div>

      {/* 次のバッジ */}
      {next.length > 0 && (
        <div>
          <h3 className="font-bold text-sm text-slate-700 mb-2">
            次のバッジまで
          </h3>
          <div className="space-y-2">
            {next.map((badge) => (
              <div
                key={badge.id}
                className="bg-slate-50 rounded-xl p-3 flex items-center gap-3"
              >
                <BadgeDisplay badge={badge} size="sm" showName={false} />
                <div className="flex-1">
                  <div className="font-bold text-xs text-slate-700">
                    {badge.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    あと {badge.remaining} 回
                  </div>
                  <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full transition-all"
                      style={{
                        width: `${(badge.progress / badge.requirement) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeList;
