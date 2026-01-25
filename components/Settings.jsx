"use client";

import React, { useState } from "react";
import {
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  LogOut,
  ChevronRight,
  Moon,
  Bell,
  Lock,
  Trash2,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

/**
 * プロフィール編集・設定コンポーネント（92件改善 Phase5）
 * 5.96-5.97 設定・プロフィール機能
 */

// プロフィールヘッダー
export const ProfileHeader = ({ user, onAvatarChange }) => {
  const inputRef = React.useRef(null);

  const handleAvatarClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onAvatarChange?.(file);
    }
  };

  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={40} className="text-orange-400" />
          )}
        </div>
        <button
          onClick={handleAvatarClick}
          className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg"
        >
          <Camera size={16} />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      <h2 className="font-bold text-lg text-slate-800 mt-3">
        {user.username || "ゲスト"}
      </h2>
      <p className="text-sm text-slate-500">{user.email}</p>
    </div>
  );
};

// 設定メニュー項目
export const SettingsMenuItem = ({
  icon: Icon,
  label,
  value,
  onClick,
  danger = false,
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${danger ? "text-red-500" : ""}`}
  >
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? "bg-red-50" : "bg-slate-100"}`}
    >
      <Icon size={20} className={danger ? "text-red-500" : "text-slate-500"} />
    </div>
    <div className="flex-1 text-left">
      <div
        className={`font-medium text-sm ${danger ? "text-red-600" : "text-slate-700"}`}
      >
        {label}
      </div>
      {value && <div className="text-xs text-slate-400">{value}</div>}
    </div>
    <ChevronRight size={18} className="text-slate-300" />
  </button>
);

// 設定セクション
export const SettingsSection = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
    {title && (
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="font-bold text-sm text-slate-700">{title}</h3>
      </div>
    )}
    <div className="divide-y divide-slate-100">{children}</div>
  </div>
);

// フル設定画面
export const SettingsPage = ({
  user,
  onLogout,
  onDeleteAccount,
  onNavigate,
}) => {
  const { theme, toggleTheme } = useTheme?.() || {
    theme: "light",
    toggleTheme: () => {},
  };

  return (
    <div className="space-y-4 pb-20">
      {/* プロフィール */}
      <SettingsSection>
        <SettingsMenuItem
          icon={User}
          label="プロフィール編集"
          value={user?.username}
          onClick={() => onNavigate?.("/settings/profile")}
        />
        <SettingsMenuItem
          icon={Mail}
          label="メールアドレス"
          value={user?.email}
          onClick={() => onNavigate?.("/settings/email")}
        />
      </SettingsSection>

      {/* 通知・表示 */}
      <SettingsSection title="通知・表示">
        <SettingsMenuItem
          icon={Bell}
          label="通知設定"
          onClick={() => onNavigate?.("/settings/notifications")}
        />
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Moon size={20} className="text-slate-500" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm text-slate-700">
              ダークモード
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              theme === "dark" ? "bg-orange-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                theme === "dark" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </SettingsSection>

      {/* アカウント */}
      <SettingsSection title="アカウント">
        <SettingsMenuItem
          icon={Lock}
          label="パスワード変更"
          onClick={() => onNavigate?.("/settings/password")}
        />
        <SettingsMenuItem
          icon={Shield}
          label="プライバシー設定"
          onClick={() => onNavigate?.("/settings/privacy")}
        />
      </SettingsSection>

      {/* その他 */}
      <SettingsSection>
        <SettingsMenuItem icon={LogOut} label="ログアウト" onClick={onLogout} />
        <SettingsMenuItem
          icon={Trash2}
          label="アカウント削除"
          onClick={onDeleteAccount}
          danger
        />
      </SettingsSection>
    </div>
  );
};

export default {
  ProfileHeader,
  SettingsMenuItem,
  SettingsSection,
  SettingsPage,
};
