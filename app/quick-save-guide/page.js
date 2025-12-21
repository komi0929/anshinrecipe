'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Share, Bookmark, Smartphone, ExternalLink, Copy, CheckCircle, Globe, MessageCircle, Zap } from 'lucide-react';
import { useToast } from '@/components/Toast';

const QuickSaveGuidePage = () => {
    const { addToast } = useToast();
    const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

    const appUrl = 'https://anshin-recipe.vercel.app';
    const bookmarkletCode = `javascript:(function(){window.location.href='${appUrl}/recipe/quick-save?url='+encodeURIComponent(window.location.href)})()`;

    const copyBookmarklet = async () => {
        try {
            await navigator.clipboard.writeText(bookmarkletCode);
            setCopiedBookmarklet(true);
            addToast('コピーしました！', 'success');
            setTimeout(() => setCopiedBookmarklet(false), 3000);
        } catch (err) {
            addToast('コピーに失敗しました', 'error');
        }
    };

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
                <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-7 h-7 bg-green-500 text-white text-sm rounded-full flex items-center justify-center">1</span>
                        URLをコピーして開く（最も簡単）
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

                {/* Method 2: LINE Share */}
                <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-7 h-7 bg-[#06C755] text-white text-sm rounded-full flex items-center justify-center">2</span>
                        LINEで自分に送信
                    </h3>

                    <div className="space-y-3 text-sm text-slate-600">
                        <div className="flex gap-3">
                            <Share size={18} className="text-[#06C755] flex-shrink-0 mt-0.5" />
                            <p>SNSの共有ボタンから「LINE」を選択</p>
                        </div>
                        <div className="flex gap-3">
                            <MessageCircle size={18} className="text-[#06C755] flex-shrink-0 mt-0.5" />
                            <p>「Keepメモ」や自分宛てに送信</p>
                        </div>
                        <div className="flex gap-3">
                            <Copy size={18} className="text-[#06C755] flex-shrink-0 mt-0.5" />
                            <p>LINEでURLをコピー → あんしんレシピを開く</p>
                        </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                        💡 LINEボットでの自動保存機能は近日公開予定です
                    </p>
                </div>

                {/* Method 3: Bookmarklet */}
                <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-7 h-7 bg-blue-500 text-white text-sm rounded-full flex items-center justify-center">3</span>
                        ブックマークレット（Webブラウザ用）
                    </h3>

                    <p className="text-sm text-slate-600 mb-4">
                        ブラウザでレシピサイトを見ている時に、ブックマークから1タップで保存できます。
                    </p>

                    <div className="space-y-3">
                        <div className="bg-slate-100 p-3 rounded-lg">
                            <p className="text-xs text-slate-500 mb-2">以下をコピーしてブックマークに追加:</p>
                            <code className="text-xs break-all text-slate-700 font-mono">
                                {bookmarkletCode}
                            </code>
                        </div>

                        <button
                            onClick={copyBookmarklet}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${copiedBookmarklet
                                    ? 'bg-green-500 text-white'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                        >
                            {copiedBookmarklet ? (
                                <>
                                    <CheckCircle size={18} />
                                    コピーしました！
                                </>
                            ) : (
                                <>
                                    <Copy size={18} />
                                    コードをコピー
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                        <p className="font-medium mb-1">設定方法:</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>上のコードをコピー</li>
                            <li>ブラウザで任意のページをブックマーク</li>
                            <li>ブックマークを編集し、URLをコピーしたコードに置き換え</li>
                            <li>名前を「あんしんレシピに保存」などに変更</li>
                        </ol>
                    </div>
                </div>

                {/* Method 4: iOS Shortcut */}
                <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-7 h-7 bg-purple-500 text-white text-sm rounded-full flex items-center justify-center">4</span>
                        iOSショートカット
                    </h3>

                    <p className="text-sm text-slate-600 mb-4">
                        iPhoneの「ショートカット」アプリで共有メニューに追加できます。
                    </p>

                    <Link
                        href="/shortcut-guide"
                        className="flex items-center justify-center gap-2 w-full bg-purple-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-purple-600 transition-all"
                    >
                        <Smartphone size={18} />
                        設定方法を見る
                    </Link>
                </div>

                {/* Android Users */}
                <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-7 h-7 bg-emerald-500 text-white text-sm rounded-full flex items-center justify-center">5</span>
                        Androidユーザー向け
                    </h3>

                    <p className="text-sm text-slate-600 mb-4">
                        PWAをインストールすると、SNSの共有メニューに「あんしんレシピ」が表示されます。
                    </p>

                    <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-700">
                        <p className="font-medium mb-1">手順:</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Chromeでこのアプリを開く</li>
                            <li>メニュー → 「ホーム画面に追加」</li>
                            <li>InstagramなどでURL共有時に「あんしんレシピ」を選択</li>
                        </ol>
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
