"use client";

import React from "react";
import {
  BarChart2,
  TrendingUp,
  Users,
  MapPin,
  Star,
  Eye,
  MessageSquare,
  Share2,
} from "lucide-react";

/**
 * 管理画面用統計カードコンポーネント（92件改善 Phase2）
 * 2.8-2.9 管理画面統計コンポーネント
 */

// 統計カード（数値表示）
export const StatCard = ({
  title,
  value,
  change, // 前期比
  icon: Icon,
  trend = "neutral", // 'up' | 'down' | 'neutral'
  size = "md",
}) => {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-5",
  };

  const trendColors = {
    up: "text-green-500 bg-green-50",
    down: "text-red-500 bg-red-50",
    neutral: "text-slate-500 bg-slate-50",
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 ${sizeClasses[size]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-black text-slate-800 mt-1">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {change !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold mt-2 ${trendColors[trend]}`}
            >
              {trend === "up" && <TrendingUp size={10} />}
              {trend === "down" && (
                <TrendingUp size={10} className="rotate-180" />
              )}
              {change > 0 ? "+" : ""}
              {change}%
            </span>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Icon size={20} className="text-slate-500" />
          </div>
        )}
      </div>
    </div>
  );
};

// 統計グリッド
export const StatsGrid = ({ stats = [] }) => {
  const icons = {
    users: Users,
    restaurants: MapPin,
    reviews: MessageSquare,
    views: Eye,
    rating: Star,
    shares: Share2,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <StatCard
          key={i}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          trend={stat.change > 0 ? "up" : stat.change < 0 ? "down" : "neutral"}
          icon={icons[stat.type] || BarChart2}
        />
      ))}
    </div>
  );
};

// 簡易チャート（棒グラフ）
export const SimpleBarChart = ({ data = [], height = 120, className = "" }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 p-4 ${className}`}
    >
      <div className="flex items-end justify-between gap-1" style={{ height }}>
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-orange-400 rounded-t-lg transition-all"
              style={{
                height: `${(item.value / maxValue) * 100}%`,
                minHeight: 4,
              }}
            />
            <span className="text-[10px] text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// アクティビティリスト
export const ActivityList = ({ activities = [], maxItems = 5 }) => {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <h3 className="font-bold text-slate-800 mb-3">最近のアクティビティ</h3>
      <div className="space-y-3">
        {displayActivities.map((activity, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="text-xl">{activity.emoji || "📌"}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 truncate">
                {activity.content}
              </p>
              <p className="text-xs text-slate-400">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ランキングリスト
export const RankingList = ({ items = [], title, valueLabel = "" }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      {title && <h3 className="font-bold text-slate-800 mb-3">{title}</h3>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i === 0
                  ? "bg-amber-400 text-white"
                  : i === 1
                    ? "bg-slate-300 text-white"
                    : i === 2
                      ? "bg-amber-600 text-white"
                      : "bg-slate-100 text-slate-500"
              }`}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 truncate">{item.name}</p>
            </div>
            <span className="text-sm font-bold text-orange-600">
              {item.value}
              {valueLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default {
  StatCard,
  StatsGrid,
  SimpleBarChart,
  ActivityList,
  RankingList,
};
