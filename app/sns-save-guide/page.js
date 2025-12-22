'use client'

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, CheckCircle, Smartphone, Zap } from 'lucide-react';

const SNSSaveGuidePage = () => {
    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
                    <Link href="/profile" className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </Link>
                    <h1 className="text-lg font-bold text-slate-800">SNSからかんたん保存</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto p-4">
                {/* Hero */}
                <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl p-5 text-white mb-6">
                    <div className="flex items-center gap-3 mb-3">
                        <Zap size={28} />
                        <h2 className="text-xl font-bold">SNSからワンタップ保存！</h2>
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed">
                        Instagram・TikTok・Webサイトで見つけたレシピを<br />
                        URLをコピーするだけで保存できます。
                    </p>
                </div>

                {/* SNS Save Section */}
                <div id="sns-save" className="bg-white rounded-2xl p-5 shadow-sm mb-4 scroll-mt-20">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        使い方
                    </h3>

                    <div className="space-y-4 text-sm text-slate-600">
                        <div className="flex gap-3 items-start">
                            <span className="w-6 h-6 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">1</span>
                            <div>
                                <p className="font-bold text-slate-700">レシピのURLをコピー</p>
                                <p className="text-xs text-slate-500 mt-1">Instagram/TikTokで「リンクをコピー」をタップ</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <span className="w-6 h-6 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">2</span>
                            <div>
                                <p className="font-bold text-slate-700">あんしんレシピを開く</p>
                                <p className="text-xs text-slate-500 mt-1">クリップボードのURLを自動で検出します</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <span className="w-6 h-6 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">3</span>
                            <div>
                                <p className="font-bold text-slate-700">レシピを保存！</p>
                                <p className="text-xs text-slate-500 mt-1">タイトルや材料が自動で入力されます</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 p-3 bg-green-50 rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                            <CheckCircle size={16} />
                            この機能は既に有効です
                        </div>
                    </div>
                </div>

                {/* Tips */}
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <h4 className="font-bold text-amber-800 text-sm mb-2">💡 ポイント</h4>
                    <p className="text-amber-700 text-xs leading-relaxed">
                        保存したレシピは最初は「非公開」になっています。
                        編集画面で「公開」に変更すると、他のユーザーにも共有されます。
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SNSSaveGuidePage;
