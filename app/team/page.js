'use client'

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

const TeamPage = () => {
    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
                    <Link href="/" className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </Link>
                    <h1 className="text-lg font-bold text-slate-800">だれがやってるの？</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto p-4">
                {/* Hero */}
                <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl p-6 text-white mb-6 text-center">
                    <h2 className="text-2xl font-bold mb-2">あんしんレシピ 運営チーム</h2>
                    <p className="text-white/90 text-sm">
                        アレルギーっ子を持つ親として、<br />
                        同じ悩みを持つご家庭をサポートします
                    </p>
                </div>

                {/* Team Introduction */}
                <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
                    <h3 className="font-bold text-slate-800 mb-4 text-lg">私たちについて</h3>

                    <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                        <p>
                            あんしんレシピは、食物アレルギーを持つお子様がいるご家庭のために生まれたサービスです。
                        </p>

                        <p>
                            私たち自身も、子どものアレルギーに悩んできた親です。
                            「このレシピ、うちの子も食べられるかな？」
                            「代替食材って何を使えばいいんだろう？」
                            そんな毎日の食事の悩みを、少しでも楽にしたいと思ってこのアプリを作りました。
                        </p>

                        <p>
                            同じ悩みを持つパパ・ママがレシピを共有し、
                            「これ、うちも作ってみたよ！美味しかった！」
                            そんな輪が広がっていくことを願っています。
                        </p>

                        <p className="text-slate-500 italic">
                            ※詳しい紹介文は近日公開予定です
                        </p>
                    </div>
                </div>

                {/* Contact Link */}
                <div className="text-center">
                    <Link
                        href="/profile"
                        className="inline-flex items-center gap-2 text-orange-500 font-medium hover:text-orange-600"
                    >
                        お問い合わせはこちら →
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default TeamPage;
