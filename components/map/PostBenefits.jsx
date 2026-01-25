"use client";

import React from "react";
import Link from "next/link";
import {
  Star,
  Gift,
  Users,
  Shield,
  Sparkles,
  ChevronRight,
} from "lucide-react";

/**
 * 投稿ベネフィット説明（92件改善 Phase4）
 * 4.6 投稿ベネフィット説明追加
 */

const BENEFITS = [
  {
    icon: Star,
    color: "amber",
    title: "バッジがもらえる",
    description: "投稿数に応じてバッジを獲得！",
  },
  {
    icon: Users,
    color: "blue",
    title: "仲間を助ける",
    description: "同じ悩みを持つ家族の助けに",
  },
  {
    icon: Shield,
    color: "emerald",
    title: "情報の信頼性UP",
    description: "口コミが増えるほど安心度UP",
  },
  {
    icon: Gift,
    color: "pink",
    title: "特典も?",
    description: "今後、投稿者限定特典を予定",
  },
];

export const PostBenefits = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
        <div className="flex items-center gap-3">
          <Sparkles size={24} className="text-orange-500" />
          <div>
            <h4 className="font-bold text-sm text-slate-800">
              投稿するとバッジがもらえる！
            </h4>
            <p className="text-xs text-slate-500">
              みんなの助けになって、報酬もGET
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold mb-2">
          <Sparkles size={12} /> なぜ投稿するの？
        </div>
        <h2 className="text-xl font-black text-slate-800">投稿のメリット</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {BENEFITS.map((benefit, i) => {
          const Icon = benefit.icon;
          const colorClasses = {
            amber: "bg-amber-100 text-amber-600",
            blue: "bg-blue-100 text-blue-600",
            emerald: "bg-emerald-100 text-emerald-600",
            pink: "bg-pink-100 text-pink-600",
          };

          return (
            <div
              key={i}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-100"
            >
              <div
                className={`w-10 h-10 ${colorClasses[benefit.color]} rounded-xl flex items-center justify-center mb-2`}
              >
                <Icon size={20} />
              </div>
              <h4 className="font-bold text-sm text-slate-800">
                {benefit.title}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {benefit.description}
              </p>
            </div>
          );
        })}
      </div>

      <Link
        href="/map/post"
        className="block w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-center shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
      >
        口コミを投稿する
        <ChevronRight size={18} />
      </Link>
    </div>
  );
};

export default PostBenefits;
