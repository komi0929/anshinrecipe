"use client";

import React from "react";
import Link from "next/link";
import {
  Store,
  TrendingUp,
  MessageCircle,
  ShieldCheck,
  Settings,
  ChevronRight,
  BadgeCheck,
  Star,
} from "lucide-react";

/**
 * オーナー向けメリット画面（92件改善 Phase4）
 * 4.7 オーナー向けメリット画面作成
 */

const OWNER_BENEFITS = [
  {
    icon: BadgeCheck,
    color: "blue",
    title: "公認バッジの表示",
    description: "店舗ページに「公認店舗」バッジが表示され、信頼性がアップ",
  },
  {
    icon: Settings,
    color: "slate",
    title: "店舗情報の編集",
    description: "アレルギー対応情報やメニューを直接編集・最新化",
  },
  {
    icon: MessageCircle,
    color: "emerald",
    title: "口コミへの返信",
    description: "お客様の口コミに直接返信してコミュニケーション",
  },
  {
    icon: TrendingUp,
    color: "orange",
    title: "統計ダッシュボード",
    description: "閲覧数・お気に入り数・口コミ数を確認",
  },
];

export default function OwnerBenefitsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 pt-16 pb-20">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-4">
            <Store size={12} /> 飲食店オーナー様へ
          </div>
          <h1 className="text-2xl font-black mb-3">
            あんしんマップで
            <br />
            お店の魅力を発信しませんか？
          </h1>
          <p className="text-blue-100 text-sm">
            アレルギー対応に力を入れるお店を
            <br />
            無料でPRできます
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div className="px-6 -mt-10">
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-6">
          <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <Star size={20} className="text-amber-500" />
            オーナー登録のメリット
          </h2>

          <div className="space-y-4">
            {OWNER_BENEFITS.map((benefit, i) => {
              const Icon = benefit.icon;
              const colorClasses = {
                blue: "bg-blue-100 text-blue-600",
                slate: "bg-slate-100 text-slate-600",
                emerald: "bg-emerald-100 text-emerald-600",
                orange: "bg-orange-100 text-orange-600",
              };

              return (
                <div key={i} className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 ${colorClasses[benefit.color]} rounded-2xl flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* How to Register */}
      <div className="px-6 mt-8">
        <div className="max-w-md mx-auto">
          <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-500" />
            オーナー登録の流れ
          </h2>

          <div className="space-y-3">
            {[
              { step: 1, text: "お店のページを見つける" },
              { step: 2, text: "「オーナー認証」ボタンをタップ" },
              { step: 3, text: "本人確認情報を入力" },
              { step: 4, text: "審査完了後、編集権限が付与" },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100"
              >
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-sm">
                  {item.step}
                </div>
                <span className="font-medium text-slate-700">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 py-10">
        <div className="max-w-md mx-auto space-y-3">
          <Link
            href="/map"
            className="block w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-center shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            マップでお店を探す
            <ChevronRight size={18} />
          </Link>
          <p className="text-center text-xs text-slate-400">
            ※ 登録・利用は無料です
          </p>
        </div>
      </div>
    </div>
  );
}
