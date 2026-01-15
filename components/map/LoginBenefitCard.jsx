import React from 'react';
import { Bookmark, PenTool, Share2, Star } from 'lucide-react';
import Link from 'next/link';

export const LoginBenefitCard = () => {
    return (
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-[24px] p-6 shadow-sm border border-orange-200 my-4 text-center">
            <h3 className="font-bold text-lg text-orange-800 mb-4">会員登録でもっと便利に！</h3>

            <div className="flex justify-center gap-6 mb-6">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm border border-orange-100">
                        <Bookmark size={20} />
                    </div>
                    <span className="text-xs font-bold text-orange-700">お店を保存</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm border border-orange-100">
                        <PenTool size={20} />
                    </div>
                    <span className="text-xs font-bold text-orange-700">口コミ投稿</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm border border-orange-100">
                        <Star size={20} />
                    </div>
                    <span className="text-xs font-bold text-orange-700">アレルギー設定</span>
                </div>
            </div>

            <p className="text-xs text-orange-600 mb-4 font-bold">
                アレルギーっ子のための外食マップを<br />みんなで作りませんか？
            </p>

            <Link href="/login" className="block w-full py-3 bg-orange-500 text-white rounded-full font-bold shadow-md hover:bg-orange-600 transition-colors">
                無料で登録 / ログイン
            </Link>

            <div className="mt-3 text-[10px] text-slate-400">
                ※ LINEで簡単に登録できます
            </div>
        </div>
    );
};
