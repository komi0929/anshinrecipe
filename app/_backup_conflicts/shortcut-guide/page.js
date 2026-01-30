'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Share, CheckCircle, Smartphone, ExternalLink } from 'lucide-react';

const IOSShortcutPage = () => {
    const [isIOS, setIsIOS] = useState(false);
    const [copied, setCopied] = useState(false);

    // The shortcut URL - this opens directly in iOS Shortcuts app
    const shortcutInstallUrl = `https://www.icloud.com/shortcuts/api/records/YOUR_SHORTCUT_ID`;

    // Manual shortcut creation URL (opens Shortcuts with pre-filled action)
    const createShortcutUrl = `shortcuts://create-shortcut?name=${encodeURIComponent('あんしんレシピに保存')}&actions=${encodeURIComponent(JSON.stringify([
        {
            "WFWorkflowActionIdentifier": "is.workflow.actions.openurl",
            "WFWorkflowActionParameters": {
                "WFInput": {
                    "Value": {
                        "string": "https://anshin-recipe.vercel.app/recipe/quick-save?url=",
                        "attachmentsByRange": {}
                    },
                    "WFSerializationType": "WFTextTokenString"
                }
            }
        }
    ]))}`;

    useEffect(() => {
        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    }, []);

    const handleCopyUrl = async () => {
        const url = 'https://anshin-recipe.vercel.app/recipe/quick-save?url=';
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch (err) {
            console.error('Copy failed');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
                    <Link href="/quick-save-guide" className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </Link>
                    <h1 className="text-lg font-bold text-slate-800">iOSショートカット設定</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto p-4">
                {/* Hero */}
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white mb-6">
                    <div className="flex items-center gap-3 mb-3">
                        <Smartphone size={28} />
                        <h2 className="text-xl font-bold">2タップで保存！</h2>
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed">
                        ショートカットを設定すると、Instagramの共有メニューから
                        直接レシピを保存できます。
                    </p>
                </div>

                {/* Step by Step */}
                <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                    <h3 className="font-bold text-slate-800 mb-4">かんたん設定（2分）</h3>

                    <div className="space-y-5">
                        {/* Step 1 */}
                        <div className="flex gap-3">
                            <div className="w-7 h-7 bg-purple-500 text-white text-sm font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                1
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-slate-800 mb-2">ショートカットアプリを開く</p>
                                <a
                                    href="shortcuts://"
                                    className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-sm font-medium text-slate-700"
                                >
                                    <ExternalLink size={16} />
                                    ショートカットを開く
                                </a>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-3">
                            <div className="w-7 h-7 bg-purple-500 text-white text-sm font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                2
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-slate-800 mb-2">新規ショートカットを作成</p>
                                <p className="text-sm text-slate-500">右上の「+」ボタンをタップ</p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-3">
                            <div className="w-7 h-7 bg-purple-500 text-white text-sm font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                3
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-slate-800 mb-2">アクションを追加</p>
                                <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                                    <li>「アクションを追加」をタップ</li>
                                    <li>「Web」→「URLを開く」を選択</li>
                                </ol>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-3">
                            <div className="w-7 h-7 bg-purple-500 text-white text-sm font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                4
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-slate-800 mb-3">URLを設定</p>
                                <div className="bg-slate-100 p-3 rounded-xl mb-2">
                                    <p className="text-xs text-slate-500 mb-1">以下をコピー:</p>
                                    <code className="text-xs text-slate-700 break-all">
                                        https://anshin-recipe.vercel.app/recipe/quick-save?url=
                                    </code>
                                </div>
                                <button
                                    onClick={handleCopyUrl}
                                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${copied
                                            ? 'bg-green-500 text-white'
                                            : 'bg-purple-500 text-white'
                                        }`}
                                >
                                    {copied ? (
                                        <>
                                            <CheckCircle size={16} />
                                            コピーしました！
                                        </>
                                    ) : (
                                        'URLをコピー'
                                    )}
                                </button>
                                <p className="text-xs text-slate-500 mt-2">
                                    ※ URLの後ろに「ショートカットの入力」を追加してください
                                </p>
                            </div>
                        </div>

                        {/* Step 5 */}
                        <div className="flex gap-3">
                            <div className="w-7 h-7 bg-purple-500 text-white text-sm font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                5
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-slate-800 mb-2">共有シートに表示</p>
                                <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                                    <li>画面下部の「ⓘ」をタップ</li>
                                    <li>「共有シートに表示」をON</li>
                                    <li>名前を「あんしんレシピに保存」に変更</li>
                                    <li>「完了」をタップ</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                {/* How to use */}
                <div className="bg-green-50 rounded-2xl p-5 border border-green-100 mb-4">
                    <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                        <CheckCircle size={20} />
                        設定完了後の使い方
                    </h4>
                    <div className="space-y-2 text-sm text-green-700">
                        <p>1️⃣ Instagramでレシピを見つける</p>
                        <p>2️⃣ 共有ボタン →「あんしんレシピに保存」</p>
                        <p>3️⃣ 自動で保存完了！</p>
                    </div>
                </div>

                {/* Note */}
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <p className="text-amber-700 text-xs leading-relaxed">
                        💡 TikTok、YouTube、料理サイトなど、URLを共有できる全てのアプリで使えます。
                    </p>
                </div>
            </div>
        </div>
    );
};

export default IOSShortcutPage;
