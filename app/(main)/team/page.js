"use client";

import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

import { useProfile } from "@/hooks/useProfile";

const TeamPage = () => {
  const { user } = useProfile();
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft size={24} className="text-slate-600" />
          </Link>
          <h1 className="text-lg font-bold text-slate-800">
            だれがやってるの？
          </h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Hero */}
        <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl p-6 text-white mb-6 text-center">
          <h2 className="text-2xl font-bold mb-2">あんしんレシピ 運営チーム</h2>
          <p className="text-white/90 text-sm">
            同じお悩みをもつママ・パパが繋がれる
            <br />
            場所を提供いたします
          </p>
        </div>

        {/* Team Introduction */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h3 className="font-bold text-slate-800 mb-4 text-lg">
            私たちについて
          </h3>

          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>
              私たちは福岡市内で
              <a
                href="https://soystories.jp/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 font-bold hover:underline"
              >
                「SoyStories（ソイストーリーズ）」
              </a>
              という小さな小さなスイーツショップを営んでいます。
            </p>

            <p>
              お店では、米粉と豆乳をメインに使ったアレルギーフリーのスイーツをお届けしており、
              <span className="font-bold text-slate-700">
                「食に制限のある人に『ユメミタイ』な体験を」
              </span>
              をミッションに掲げて活動しています。
            </p>

            <p>
              3年前、素人ながら手探りで始めた私たちのお店ですが、大きな節目を前に「もっと多くの人に安心を届けたい」という想いから、新しい挑戦としてこのサービスを立ち上げました。
            </p>

            <p>
              開発チームといっても、まだまだ勉強中の身です。不具合やエラーが出てしまうこともあるかもしれませんが、どうか寛大な心で見守っていただき、少しでも皆さんの生活にお役立ていただければ嬉しいです！🙏
            </p>

            <p>
              改善のご要望や、ご意見・ご感想などは、
              <Link
                href="/profile"
                className="text-orange-500 font-bold hover:underline"
              >
                マイページのお問い合わせ
              </Link>
              から、どしどしご連絡ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
