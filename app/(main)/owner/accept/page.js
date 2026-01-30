"use client";

import Link from "next/link";
import { Store } from "lucide-react";

export default function AcceptInvitationPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-xl">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Store size={32} className="text-orange-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">
          オーナー登録受付
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          現在メンテナンス中です。管理者にお問い合わせください。
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors inline-block"
        >
          ホームへ戻る
        </Link>
      </div>
    </div>
  );
}
