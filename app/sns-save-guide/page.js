'use client'

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, CheckCircle, Smartphone, Zap, Share2, Settings } from 'lucide-react';

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

                {/* Method 1: Copy URL */}
                <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-7 h-7 bg-orange-500 text-white text-sm rounded-full flex items-center justify-center font-black">1</span>
                        URLをコピーして保存
                    </h3>

                    <div className="space-y-4 text-sm text-slate-600">
                        <div className="flex gap-3 items-start">
                            <Copy size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-slate-700">レシピのURLをコピー</p>
                                <p className="text-xs text-slate-500 mt-1">Instagram/TikTokで「リンクをコピー」をタップ</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <Smartphone size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-slate-700">あんしんレシピを開く</p>
                                <p className="text-xs text-slate-500 mt-1">クリップボードのURLを自動で検出します</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                            <CheckCircle size={16} />
                            この機能は既に有効です
                        </div>
                    </div>
                </div>

                {/* Method 2: Android Share (Galaxy等) */}
                <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 border-2 border-blue-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-7 h-7 bg-blue-500 text-white text-sm rounded-full flex items-center justify-center font-black">2</span>
                        共有メニューから直接開く
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Android</span>
                    </h3>

                    <div className="space-y-3 text-sm text-slate-600 mb-4">
                        <p className="text-slate-700">
                            Galaxy/Androidでホーム画面に追加すると、Instagramの共有メニューに「あんしんレシピ」が表示されます。
                        </p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
                        <p className="font-bold mb-2 flex items-center gap-2"><Settings size={16} /> 設定方法:</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs">
                            <li>Chromeで右上メニュー（⋮）をタップ</li>
                            <li>「ホーム画面に追加」または「アプリをインストール」</li>
                            <li>インストール後、Instagramの共有で「あんしんレシピ」を選択！</li>
                        </ol>
                    </div>
                </div>

                {/* Method 3: iOS Shortcut (Coming Soon) */}
                <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 opacity-75">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-7 h-7 bg-slate-400 text-white text-sm rounded-full flex items-center justify-center">3</span>
                        iOSショートカット
                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">開発中</span>
                    </h3>

                    <p className="text-sm text-slate-500 mb-4">
                        iPhoneの「ショートカット」アプリで共有メニューに追加できる機能を準備中です。
                        しばらくお待ちください。
                    </p>

                    <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-500">
                        現在は方法1または2をご利用ください。
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
