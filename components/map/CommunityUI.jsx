"use client";

import React from "react";
import {
  Users,
  MessageCircle,
  Heart,
  MapPin,
  TrendingUp,
  Star,
} from "lucide-react";

/**
 * コミュニティ感UIコンポーネント（92件改善 Phase4）
 * 4.8 コミュニティ感UI改善
 */

export const CommunityBanner = ({ variant = "default" }) => {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
        <div className="flex -space-x-2">
          {["🧒", "👩", "👨"].map((emoji, i) => (
            <div
              key={i}
              className="w-8 h-8 bg-white rounded-full border-2 border-orange-100 flex items-center justify-center text-sm"
            >
              {emoji}
            </div>
          ))}
        </div>
        <div className="text-sm">
          <span className="font-bold text-orange-600">1,234人</span>
          <span className="text-slate-500">のママパパが参加中</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-6 text-white">
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-2">
          <Users size={12} /> コミュニティ
        </div>
        <h2 className="text-xl font-black">アレルギーっ子家族の輪</h2>
        <p className="text-orange-100 text-sm mt-1">
          みんなで作る、みんなのための情報
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/20 rounded-2xl p-3 text-center">
          <div className="text-2xl font-black">1,234</div>
          <div className="text-xs text-orange-100">参加者</div>
        </div>
        <div className="bg-white/20 rounded-2xl p-3 text-center">
          <div className="text-2xl font-black">567</div>
          <div className="text-xs text-orange-100">店舗登録</div>
        </div>
        <div className="bg-white/20 rounded-2xl p-3 text-center">
          <div className="text-2xl font-black">890</div>
          <div className="text-xs text-orange-100">口コミ</div>
        </div>
      </div>

      {/* Avatars */}
      <div className="flex items-center justify-center gap-2">
        <div className="flex -space-x-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-10 h-10 bg-white/30 rounded-full border-2 border-white flex items-center justify-center text-lg"
            >
              {["👶", "🧒", "👧", "🧑", "👨‍👩‍👧"][i]}
            </div>
          ))}
        </div>
        <span className="text-sm">...and more!</span>
      </div>
    </div>
  );
};

// 最近のアクティビティフィード
export const ActivityFeed = ({ activities = [] }) => {
  const mockActivities =
    activities.length > 0
      ? activities
      : [
          {
            type: "review",
            user: "ゆうママ",
            action: "口コミを投稿",
            target: "カフェABC",
            time: "5分前",
          },
          {
            type: "like",
            user: "たけパパ",
            action: "いいね",
            target: "しょうこママの投稿",
            time: "10分前",
          },
          {
            type: "register",
            user: "新規ユーザー",
            action: "登録",
            target: "",
            time: "15分前",
          },
        ];

  const getIcon = (type) => {
    switch (type) {
      case "review":
        return <MessageCircle size={14} className="text-blue-500" />;
      case "like":
        return <Heart size={14} className="text-pink-500" />;
      case "register":
        return <Users size={14} className="text-emerald-500" />;
      default:
        return <Star size={14} className="text-amber-500" />;
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
        <TrendingUp size={14} className="text-orange-500" />
        最近のアクティビティ
      </h3>
      <div className="space-y-2">
        {mockActivities.map((activity, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded-xl"
          >
            {getIcon(activity.type)}
            <span className="text-slate-600">
              <strong>{activity.user}</strong>さんが{activity.action}
              {activity.target && (
                <>
                  {" "}
                  → <strong>{activity.target}</strong>
                </>
              )}
            </span>
            <span className="text-slate-400 ml-auto">{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityBanner;
