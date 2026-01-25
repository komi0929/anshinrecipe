"use client";

import React, { useState, useEffect } from "react";
import { Bell, X, Check, Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";

/**
 * 通知パネルコンポーネント（92件改善 Phase4）
 * 4.13-4.15 通知機能
 */

export const NotificationPanel = ({
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  open,
  onClose,
}) => {
  if (!open) return null;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "review":
        return "💬";
      case "like":
        return "❤️";
      case "badge":
        return "🏆";
      case "reply":
        return "↩️";
      default:
        return "🔔";
    }
  };

  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case "review":
      case "like":
        return notification.recipeId
          ? `/recipes/${notification.recipeId}`
          : "#";
      case "badge":
        return "/profile/badges";
      default:
        return "#";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="absolute top-0 right-0 w-full max-w-sm h-full bg-white shadow-2xl animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-orange-500" />
            <h2 className="font-bold text-lg text-slate-800">通知</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
            <button
              onClick={onMarkAllRead}
              className="text-xs text-orange-600 font-bold flex items-center gap-1"
            >
              <Check size={12} /> すべて既読
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div
          className="overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 120px)" }}
        >
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Bell size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm">通知はありません</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <Link
                key={notification.id}
                href={getNotificationLink(notification)}
                onClick={() => onMarkRead?.(notification.id)}
                className={`flex items-start gap-3 p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                  !notification.isRead ? "bg-orange-50/50" : ""
                }`}
              >
                {/* Icon */}
                <div className="text-2xl">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">
                    <span className="font-bold">
                      {notification.actor?.displayName || "ユーザー"}
                    </span>
                    {notification.type === "like" &&
                      "さんがあなたの投稿にいいねしました"}
                    {notification.type === "review" &&
                      "さんが口コミを投稿しました"}
                    {notification.type === "badge" &&
                      "新しいバッジを獲得しました"}
                    {notification.type === "reply" && "さんが返信しました"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(notification.createdAt).toLocaleDateString(
                      "ja-JP",
                    )}
                  </p>
                </div>

                {/* Unread Dot */}
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// 通知ベルボタン
export const NotificationBell = ({ unreadCount = 0, onClick }) => (
  <button
    onClick={onClick}
    className="relative w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
  >
    <Bell size={20} className="text-slate-600" />
    {unreadCount > 0 && (
      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
    )}
  </button>
);

export default { NotificationPanel, NotificationBell };
