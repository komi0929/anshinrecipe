'use client'

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Share, Bookmark, Smartphone, ExternalLink, Copy, CheckCircle } from 'lucide-react';

const ShortcutGuidePage = () => {
    const shortcutUrl = `https://www.icloud.com/shortcuts/YOUR_SHORTCUT_ID`; // TODO: Replace with actual shortcut link

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('コピーしました！');
        } catch (err) {
            console.error('Copy failed');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
                    <Link href="/profile" className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </Link>
                    <h1 className="text-lg font-bold text-slate-800">iOSショートカット設定</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto p-4">
                {/* Introduction */}
                <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl p-5 text-white mb-6">
                    <div className="flex items-center gap-3 mb-3">
                        <Smartphone size={28} />
                        <h2 className="text-xl font-bold">iPhoneでも簡単保存！</h2>
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed">
                        Appleの「ショートカット」アプリを使うと、
                        Instagram・TikTokから直接レシピを保存できます。
                    </p>
                </div>

                {/* Method 1: Manual Setup */}
                <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-500 text-white text-sm rounded-full flex items-center justify-center">1</span>
                        かんたん設定（URLコピー方式）
                    </h3>

                    <div className="space-y-4 text-sm text-slate-600">
                        <div className="flex gap-3">
                            <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-slate-500">1</span>
                            </div>
                            <p>InstagramやTikTokでレシピ動画を見つけたら、「リンクをコピー」をタップ</p>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-slate-500">2</span>
                            </div>
                            <p>あんしんレシピを開く</p>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-slate-500">3</span>
                            </div>
                            <p>自動的に「レシピURLを検出しました」と表示されるので「保存する」をタップ</p>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                            <CheckCircle size={16} />
                            この機能は既に有効です！
                        </div>
                    </div>
                </div>

                {/* Method 2: Shortcut App */}
                <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 bg-purple-500 text-white text-sm rounded-full flex items-center justify-center">2</span>
                        もっと便利に（ショートカット連携）
                    </h3>

                    <p className="text-sm text-slate-600 mb-4">
                        「ショートカット」アプリを設定すると、共有メニューから直接保存できます。
                    </p>

                    <div className="space-y-4 text-sm text-slate-600">
                        <div className="flex gap-3">
                            <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-slate-500">1</span>
                            </div>
                            <div>
                                <p className="mb-2">「ショートカット」アプリを開く</p>
                                <a
                                    href="shortcuts://"
                                    className="inline-flex items-center gap-1 text-blue-500 font-medium"
                                >
                                    <ExternalLink size={14} />
                                    ショートカットを開く
                                </a>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-slate-500">2</span>
                            </div>
                            <p>右上の「＋」で新規ショートカットを作成</p>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-slate-500">3</span>
                            </div>
                            <div>
                                <p className="mb-2">「アクションを追加」→「Web」→「URLを開く」を選択</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-slate-500">4</span>
                            </div>
                            <div>
                                <p className="mb-2">URLに以下を設定:</p>
                                <div className="bg-slate-100 p-2 rounded-lg font-mono text-xs break-all">
                                    https://anshin-recipe.vercel.app/recipe/quick-save?url=[ショートカットの入力]
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-slate-500">5</span>
                            </div>
                            <p>下部の「共有シートに表示」をONにする</p>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-slate-500">6</span>
                            </div>
                            <p>「あんしんレシピに保存」などの名前を付けて完了！</p>
                        </div>
                    </div>
                </div>

                {/* Tips */}
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <h4 className="font-bold text-amber-800 text-sm mb-2">💡 ヒント</h4>
                    <p className="text-amber-700 text-xs leading-relaxed">
                        ショートカットを設定すると、InstagramやTikTokの共有メニューに
                        「あんしんレシピに保存」が表示されるようになります。
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ShortcutGuidePage;
