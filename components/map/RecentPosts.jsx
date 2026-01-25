"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Clock, Star, ChevronRight, PenTool } from "lucide-react";

/**
 * 最近の投稿セクション（92件改善 Phase4）
 * 4.10 「最近の投稿」セクション追加
 */

export const RecentPosts = ({ limit = 5 }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecent();
  }, []);

  const fetchRecent = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
                id, content, rating, created_at, images,
                restaurants ( id, name ),
                profiles:user_id ( username, avatar_url )
            `,
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (data) setReviews(data);
    setLoading(false);
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}分前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}時間前`;
    const days = Math.floor(hours / 24);
    return `${days}日前`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-slate-100 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-slate-50 rounded-2xl p-8 text-center border border-dashed border-slate-200">
        <PenTool size={32} className="text-slate-300 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">まだ投稿がありません</p>
        <Link
          href="/map/post"
          className="mt-3 inline-block px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm"
        >
          最初の投稿をする
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
          <Clock size={20} className="text-blue-500" />
          最近の投稿
        </h2>
        <Link
          href="/map?tab=reviews"
          className="text-sm text-orange-500 hover:underline flex items-center gap-1"
        >
          もっと見る <ChevronRight size={14} />
        </Link>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <Link
            key={review.id}
            href={`/map/${review.restaurants?.id}`}
            className="block bg-white p-4 rounded-2xl border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                {review.profiles?.avatar_url ? (
                  <img
                    src={review.profiles.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-400 font-bold text-sm">
                    {(review.profiles?.username || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-slate-700">
                    {review.profiles?.username || "ゲスト"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {timeAgo(review.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={10}
                      fill={i < review.rating ? "#FBBF24" : "none"}
                      className={
                        i < review.rating ? "text-amber-400" : "text-slate-200"
                      }
                    />
                  ))}
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">
                  {review.content}
                </p>
                <div className="mt-2 text-xs text-orange-600 font-bold">
                  📍 {review.restaurants?.name}
                </div>
              </div>

              {/* Image */}
              {review.images?.[0] && (
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={review.images[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentPosts;
