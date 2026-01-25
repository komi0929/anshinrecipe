"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Star, ChevronRight, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

/**
 * 投稿後サンクスページ（92件改善 Phase4）
 * 4.4 投稿後サンクスページ実装
 */
export default function PostThanksPage() {
  const [restaurantName, setRestaurantName] = useState("");
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    // URLパラメータから店舗名を取得
    const params = new URLSearchParams(window.location.search);
    setRestaurantName(params.get("restaurant") || "お店");

    // 紙吹雪アニメーション
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // バッジチェック（仮実装）
    checkBadges();
  }, []);

  const checkBadges = async () => {
    // 実際の実装ではAPIからユーザーの投稿数を取得してバッジ判定
    const mockBadges = [];
    // 例: 初投稿バッジ
    mockBadges.push({ id: "first_post", name: "🎉 はじめての投稿", new: true });
    setBadges(mockBadges);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
            <Sparkles size={16} className="text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-slate-800 mb-2">
          投稿ありがとうございます！
        </h1>
        <p className="text-slate-500 mb-6">
          「{restaurantName}」への口コミが投稿されました
        </p>

        {/* Badge Section */}
        {badges.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-orange-100 mb-6">
            <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-center gap-2">
              <Star size={16} className="text-yellow-500" />
              獲得したバッジ
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                    badge.new
                      ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-300 animate-pulse"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {badge.name}
                  {badge.new && <span className="ml-1 text-xs">NEW!</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message */}
        <div className="bg-orange-50 rounded-2xl p-4 mb-6 border border-orange-100">
          <p className="text-sm text-orange-700 leading-relaxed">
            あなたの投稿が、
            <br />
            <strong>同じ悩みを持つ家族の助け</strong>になります！
            <br />
            これからも一緒に「あんしんマップ」を
            <br />
            育てていきましょう 🧡
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/map"
            className="block w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors"
          >
            マップに戻る
          </Link>
          <Link
            href="/profile"
            className="flex items-center justify-center gap-2 w-full py-3 bg-white text-slate-600 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            マイページで投稿を確認
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
