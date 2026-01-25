"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { TrendingUp, Star, MessageCircle, ChevronRight } from "lucide-react";

/**
 * 人気の店舗セクション（92件改善 Phase4）
 * 4.11 「人気の店舗」セクション追加
 */

export const PopularRestaurants = ({ limit = 5 }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopular();
  }, []);

  const fetchPopular = async () => {
    // レビュー数が多い店舗を取得（簡易版）
    const { data, error } = await supabase
      .from("restaurants")
      .select(
        `
                id, name, address, images,
                reviews ( count )
            `,
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (data) {
      // レビュー数でソート
      const sorted = data.sort(
        (a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0),
      );
      setRestaurants(sorted);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-slate-100 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (restaurants.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
          <TrendingUp size={20} className="text-orange-500" />
          人気の店舗
        </h2>
        <Link
          href="/map?sort=popular"
          className="text-sm text-orange-500 hover:underline flex items-center gap-1"
        >
          もっと見る <ChevronRight size={14} />
        </Link>
      </div>

      <div className="space-y-3">
        {restaurants.map((rest, index) => (
          <Link
            key={rest.id}
            href={`/map/${rest.id}`}
            className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all"
          >
            {/* Rank */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                index === 0
                  ? "bg-amber-100 text-amber-600"
                  : index === 1
                    ? "bg-slate-100 text-slate-500"
                    : index === 2
                      ? "bg-orange-100 text-orange-600"
                      : "bg-slate-50 text-slate-400"
              }`}
            >
              {index + 1}
            </div>

            {/* Image */}
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
              {rest.images?.[0] ? (
                <img
                  src={rest.images[0]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 text-xl">
                  🍽️
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-slate-800 truncate">
                {rest.name}
              </h3>
              <p className="text-xs text-slate-500 truncate">{rest.address}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <Star size={10} fill="#FBBF24" /> 4.2
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <MessageCircle size={10} /> {rest.reviews?.length || 0}件
                </span>
              </div>
            </div>

            <ChevronRight size={18} className="text-slate-300" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PopularRestaurants;
