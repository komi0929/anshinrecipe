'use client'

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, CheckCircle, Smartphone, Zap, Plus, Download, Settings } from 'lucide-react';

const QuickSaveGuidePage = () => {
    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
                    <Link href="/profile" className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </Link>
                    <h1 className="text-lg font-bold text-slate-800">レシピを簡単に保存する方法</h1>
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
                        Instagram・TikTok・Webサイトで見つけたレシピを
                        すぐに保存する方法をご紹介します。
                    </p>
                </div>

                {/* Method 1: Copy URL */}
                <div id="sns-save" className="bg-white rounded-2xl p-5 shadow-sm mb-4 scroll-mt-20">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-7 h-7 bg-orange-500 text-white text-sm rounded-full flex items-center justify-center font-black">1</span>
                        SNSやWebから保存する方法
                    </h3>

                    <div className="space-y-3 text-sm text-slate-600">
                        <div className="flex gap-3">
                            <Copy size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                            <p>Instagram/TikTokで「リンクをコピー」をタップ</p>
                        </div>
                        <div className="flex gap-3">
                            <Smartphone size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                            <p>あんしんレシピを開くと自動検出されます</p>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                            <CheckCircle size={16} />
                            この機能は既に有効です
                        </div>
                    </div>
                </div>

                {/* Method 2: Android PWA (moved up) */}
                <div id="pwa-install" className="bg-white rounded-2xl p-5 shadow-sm mb-4 border-2 border-emerald-100 scroll-mt-20">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-7 h-7 bg-emerald-500 text-white text-sm rounded-full flex items-center justify-center font-black">2</span>
                            ホーム画面に追加する（推奨）
                        </h3>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">
                            快適にご利用いただけます
                        </span>
                    </div>

                    <div className="space-y-3 mb-6 font-bold">
                        <p className="text-sm text-slate-700">追加するメリット：</p>
                        <ul className="text-xs text-slate-600 space-y-2 pl-1">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500">✔</span>
                                <div><span className="font-bold text-slate-800">アプリのように起動</span><br /><span className="font-normal">ホーム画面からワンタップで見たいレシピにすぐ届きます。</span></div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500">✔</span>
                                <div><span className="font-bold text-slate-800">全画面で料理が快適</span><br /><span className="font-normal">ブラウザの枠がなくなり、画面いっぱいレシピを表示できます。</span></div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500">✔</span>
                                <div><span className="font-bold text-slate-800">共有から直接ひらく</span><br /><span className="font-normal">Instagramの共有メニューに「あんしんレシピ」が表示されます。</span></div>
                            </li>
                        </ul>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-xl text-sm text-emerald-700 mb-3">
                        <p className="font-bold mb-2 flex items-center gap-2"><Smartphone size={16} /> iPhone / Safariの場合:</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs">
                            <li>画面下の共有ボタン（□に↑）をタップ</li>
                            <li>「ホーム画面に追加」を選択</li>
                            <li>「追加」をタップして完了！</li>
                        </ol>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
                        <p className="font-bold mb-2 flex items-center gap-2"><Settings size={16} /> Android / Chromeの場合:</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs">
                            <li>右上のメニュー（⋮）をタップ</li>
                            <li>「ホーム画面に追加」または「アプリをインストール」を選択</li>
                            <li>インストール後、InstagramなどでURL共有時に「あんしんレシピ」を選べます</li>
                        </ol>
                    </div>
                </div>

                {/* Method 3: iOS Shortcut (moved down, marked as in development) */}
                <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 opacity-75">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-7 h-7 bg-slate-400 text-white text-sm rounded-full flex items-center justify-center">3</span>
                        iOSショートカット（開発中）
                        <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Coming Soon</span>
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

export default QuickSaveGuidePage;
