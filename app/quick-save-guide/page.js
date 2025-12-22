'use client'

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Smartphone, Settings, RefreshCw, Home } from 'lucide-react';

const QuickSaveGuidePage = () => {
    // Handle anchor scroll on page load
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash) {
            const hash = window.location.hash.replace('#', '');
            setTimeout(() => {
                const element = document.getElementById(hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
                    <Link href="/profile" className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </Link>
                    <h1 className="text-lg font-bold text-slate-800">ホーム画面に追加する</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto p-4">
                {/* Hero - PWA推奨 */}
                <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl p-5 text-white mb-6">
                    <div className="flex items-center gap-3 mb-3">
                        <Home size={28} />
                        <h2 className="text-xl font-bold">アプリのように使えます！</h2>
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed">
                        ホーム画面に追加すると、ワンタップで起動！<br />
                        全画面表示で料理中も見やすくなります。
                    </p>
                </div>

                {/* PWA Install Section */}
                <div id="pwa-install" className="bg-white rounded-2xl p-5 shadow-sm mb-4 border-2 border-emerald-100 scroll-mt-20">
                    <div className="space-y-3 mb-6">
                        <p className="text-sm text-slate-700 font-bold">追加するメリット：</p>
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
                            <li>インストール完了！</li>
                        </ol>
                    </div>
                </div>

                {/* Tips - PWA更新の注意点 */}
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <h4 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-2">
                        <RefreshCw size={16} />
                        最新の情報にするには
                    </h4>
                    <p className="text-amber-700 text-xs leading-relaxed mb-3">
                        ホーム画面から起動した場合、古い情報が表示されることがあります。
                    </p>
                    <div className="bg-white rounded-lg p-3 text-xs text-slate-600 space-y-2">
                        <div className="flex items-start gap-2">
                            <span className="text-amber-500 font-bold">💡</span>
                            <p><b>画面を下に引っ張る</b>と、最新のレシピが読み込まれます</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-amber-500 font-bold">💡</span>
                            <p><b>アプリを一度閉じて再度開く</b>と、最新バージョンに更新されます</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickSaveGuidePage;
