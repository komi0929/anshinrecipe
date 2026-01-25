"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Heart, User, Map } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useNotifications } from "@/hooks/useNotifications";
import "./BottomNav.css";

/**
 * BottomNav 改善版（92件改善 Phase3）
 * 3.9 BottomNavに投稿ボタン追加
 */
const BottomNav = () => {
  const pathname = usePathname();
  const { user, profile } = useProfile();
  const { unreadCount } = useNotifications(user?.id);

  // Don't show bottom nav on login/welcome pages
  if (
    pathname === "/login" ||
    pathname === "/welcome" ||
    pathname === "/welcome/map"
  ) {
    return null;
  }

  // Context-Aware Mode
  const isMapMode = pathname?.startsWith("/map");

  return (
    <nav className="bottom-nav">
      <Link
        href="/"
        className={`nav-item ${pathname === "/" ? "active" : ""}`}
        title="レシピ一覧"
      >
        <Home size={24} aria-hidden="true" />
        <span>レシピ</span>
      </Link>

      <Link
        href="/map"
        className={`nav-item ${pathname?.startsWith("/map") && pathname !== "/map/post" ? "active" : ""}`}
        title="あんしんマップ"
      >
        <Map size={24} aria-hidden="true" />
        <span>地図</span>
      </Link>

      {/* Center FAB - 投稿ボタン */}
      <Link
        href={isMapMode ? "/map/post" : "/recipe/new"}
        className="nav-item-fab"
        title={isMapMode ? "口コミ投稿" : "レシピ投稿"}
      >
        <div className="fab-button">
          <PlusCircle size={24} />
        </div>
        <span className="fab-label">{isMapMode ? "投稿" : "レシピ"}</span>
      </Link>

      <Link
        href="/notifications"
        className={`nav-item ${pathname === "/notifications" ? "active" : ""}`}
        title="お知らせ"
      >
        <div className="relative">
          <Heart size={24} aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-[9px] text-white font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </span>
          )}
        </div>
        <span>お知らせ</span>
      </Link>

      <Link
        href="/profile"
        className={`nav-item ${pathname === "/profile" ? "active" : ""}`}
        title="マイページ"
      >
        {profile?.avatarUrl ? (
          <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200">
            <img
              src={profile.avatarUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <User size={24} aria-hidden="true" />
        )}
        <span>マイページ</span>
      </Link>
    </nav>
  );
};

export default BottomNav;
