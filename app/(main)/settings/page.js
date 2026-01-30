"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { LogOut, User, Bell, Shield, HelpCircle, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SettingsPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const SettingItem = ({ icon: Icon, label, href, onClick, destructive }) => {
    const content = (
      <div
        className={`flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm mb-3 active:scale-[0.98] transition-all ${destructive ? "text-red-500" : "text-slate-700"}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full ${destructive ? "bg-red-50" : "bg-orange-50"}`}
          >
            <Icon
              size={20}
              className={destructive ? "text-red-500" : "text-orange-500"}
            />
          </div>
          <span className="font-bold text-sm">{label}</span>
        </div>
        <div className="text-slate-300">
          <ChevronLeft size={20} className="rotate-180" />
        </div>
      </div>
    );

    if (onClick) {
      return (
        <button className="w-full text-left" onClick={onClick}>
          {content}
        </button>
      );
    }

    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  };
  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#FFF8F5] pb-24">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-orange-100">
        <div className="flex items-center px-4 h-14">
          <Link href="/profile" className="p-2 -ml-2 text-slate-400">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="flex-1 text-center font-bold text-slate-700">設定</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <main className="p-4 max-w-md mx-auto">
        <section className="mb-6">
          <h2 className="text-xs font-bold text-slate-400 mb-3 px-2">
            アカウント
          </h2>
          <SettingItem
            icon={User}
            label="プロフィール編集"
            href="/profile/edit"
          />
          <SettingItem
            icon={Bell}
            label="通知設定"
            href="/settings/notifications"
          />
        </section>

        <section className="mb-6">
          <h2 className="text-xs font-bold text-slate-400 mb-3 px-2">
            サポート・規約
          </h2>
          <SettingItem
            icon={HelpCircle}
            label="ヘルプ・よくある質問"
            href="/help"
          />
          <SettingItem
            icon={Shield}
            label="プライバシーポリシー"
            href="/privacy"
          />
          <SettingItem icon={FileText} label="利用規約" href="/terms" />
        </section>

        <section>
          <SettingItem
            icon={LogOut}
            label="ログアウト"
            onClick={handleLogout}
            destructive
          />
        </section>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">あんしんレシピ v1.0.0</p>
        </div>
      </main>
    </div>
  );
}

