"use client";

import { Heart, Eye, ChevronUp, ChevronDown, CheckCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useProfile } from "@/hooks/useProfile";
import { useNotifications } from "@/hooks/useNotifications";

const NotificationsPage = () => {
  const router = useRouter(); // Initialize router
  const { user, loading: profileLoading } = useProfile();
  const {
    notifications,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications(user?.id);
  const [activeTab, setActiveTab] = useState("activity"); // 'activity' | 'announcements'
  const [showReadNotifications, setShowReadNotifications] = useState(false);

  // Announcements from database
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

  // Auth Protection
  useEffect(() => {
    if (!profileLoading && !user) {
      router.push("/login");
    }
  }, [user, profileLoading, router]);

  // Fetch announcements from database
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch("/api/announcements");
        const data = await response.json();
        if (data.success && data.announcements) {
          setAnnouncements(data.announcements);
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setAnnouncementsLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  // Show skeleton while loading - prevents blank flash
  if (profileLoading || !user) {
    return (
      <div className="container max-w-md mx-auto min-h-screen bg-background pb-24">
        <div className="page-header sticky top-0 bg-background z-10 border-b border-slate-100">
          <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
          <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="px-4 pt-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "たった今";
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Improved notification message with recipe name inline
  const getNotificationMessage = (notification) => {
    const actorName =
      notification.actor?.displayName ||
      notification.actor?.display_name ||
      "ユーザー";
    const recipeTitle = notification.recipe?.title || "レシピ";

    switch (notification.type) {
      case "like":
        return (
          <span>
            <strong className="text-slate-800">{actorName}</strong>
            <span className="text-slate-600"> さんが「</span>
            <span className="text-primary font-medium">{recipeTitle}</span>
            <span className="text-slate-600">」に</span>
            <span className="text-pink-500 font-bold">いいね！</span>
          </span>
        );
      case "save":
        return (
          <span>
            <strong className="text-slate-800">{actorName}</strong>
            <span className="text-slate-600"> さんが「</span>
            <span className="text-primary font-medium">{recipeTitle}</span>
            <span className="text-slate-600">」を</span>
            <span className="text-orange-500 font-bold">保存</span>
          </span>
        );
      case "report":
        return (
          <span>
            <strong className="text-slate-800">{actorName}</strong>
            <span className="text-slate-600"> さんが「</span>
            <span className="text-primary font-medium">{recipeTitle}</span>
            <span className="text-slate-600">」に</span>
            <span className="text-blue-500 font-bold">つくレポ</span>
            <span className="text-slate-600">を投稿</span>
          </span>
        );
      case "report_like":
        return (
          <span>
            <strong className="text-slate-800">{actorName}</strong>
            <span className="text-slate-600"> さんが「</span>
            <span className="text-primary font-medium">{recipeTitle}</span>
            <span className="text-slate-600">」のつくレポに</span>
            <span className="text-pink-500 font-bold">いいね！</span>
          </span>
        );
      case "thanks": {
        const emoji = notification.metadata?.emoji || "💕";
        const message = notification.metadata?.message || "感謝を送りました";
        return (
          <span>
            <strong className="text-slate-800">{actorName}</strong>
            <span className="text-slate-600"> さんが「</span>
            <span className="text-primary font-medium">{recipeTitle}</span>
            <span className="text-slate-600">」に</span>
            <span className="text-green-500 font-bold">
              {emoji} {message}
            </span>
          </span>
        );
      }
      case "announcement": {
        const announcementEmoji = notification.metadata?.emoji || "📢";
        const announcementTitle = notification.metadata?.title || "お知らせ";
        return (
          <span>
            <span className="text-orange-500 font-bold">
              {announcementEmoji} 運営より:{" "}
            </span>
            <span className="text-slate-700 font-medium">
              {announcementTitle}
            </span>
          </span>
        );
      }
      default:
        return (
          <span>
            <strong className="text-slate-800">{actorName}</strong>
            <span className="text-slate-600"> さんからの通知</span>
          </span>
        );
    }
  };

  // Calculate actual unread count from data
  const actualUnreadCount = notifications.filter(
    (n) => !n.isRead && !n.is_read,
  ).length;

  // Separate read and unread notifications
  const unreadNotifications = notifications.filter(
    (n) => !n.isRead && !n.is_read,
  );
  const readNotifications = notifications.filter((n) => n.isRead || n.is_read);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead && !notification.is_read) {
      markAsRead(notification.id);
    }
    // Navigate to recipe if available
    if (notification.recipeId || notification.recipe_id) {
      const recipeId = notification.recipeId || notification.recipe_id;
      // Add hash for report notifications to scroll directly to reports section
      const hash =
        notification.type === "report" || notification.type === "report_like"
          ? "#tried-reports"
          : "";
      window.location.href = `/recipe/${recipeId}${hash}`;
    }
  };

  const renderNotification = (notification, isUnread = false) => (
    <div
      key={notification.id}
      onClick={() => handleNotificationClick(notification)}
      className={`p-4 rounded-2xl transition-all cursor-pointer ${
        isUnread
          ? "bg-gradient-to-r from-orange-50 to-amber-50/50 border-l-4 border-l-orange-400 border border-orange-100 shadow-sm hover:from-orange-100"
          : "bg-white border border-slate-100 hover:bg-slate-50 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 shadow-sm">
          {notification.actor?.avatarUrl ? (
            <img
              src={notification.actor.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-gradient-to-br from-slate-100 to-slate-200">
              👤
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed">
            {getNotificationMessage(notification)}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={`text-xs ${isUnread ? "text-orange-500 font-medium" : "text-slate-400"}`}
            >
              {formatDate(notification.createdAt || notification.created_at)}
            </span>
            {!isUnread && (
              <span className="text-[10px] text-slate-400 flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded-full">
                <Eye size={10} />
                既読
              </span>
            )}
          </div>
        </div>
        {isUnread && (
          <div className="w-2.5 h-2.5 bg-orange-500 rounded-full flex-shrink-0 mt-2 animate-pulse shadow-sm shadow-orange-300"></div>
        )}
      </div>
    </div>
  );

  return (
    <div className="container max-w-md mx-auto min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="page-header sticky top-0 bg-background z-10 border-b border-slate-100 mb-2">
        <h1 className="page-title">お知らせ</h1>
        {activeTab === "activity" && actualUnreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="ml-auto text-xs text-primary font-bold flex items-center gap-1 hover:bg-orange-50 px-2 py-1 rounded-lg transition-colors"
          >
            <CheckCheck size={14} />
            すべて既読
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-slate-100 p-1 rounded-2xl m-4 space-x-1">
        <button
          onClick={() => setActiveTab("activity")}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2
                        ${
                          activeTab === "activity"
                            ? "bg-white text-primary shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
        >
          <Heart size={16} />
          みんなの反応
          {actualUnreadCount > 0 && (
            <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {actualUnreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("announcements")}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2
                        ${
                          activeTab === "announcements"
                            ? "bg-white text-primary shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
        >
          <Megaphone size={16} />
          運営からのお知らせ
        </button>
      </div>

      {/* Content */}
      <div className="px-4">
        {activeTab === "activity" ? (
          <div className="space-y-3">
            {notificationsLoading ? (
              <div className="text-center py-8 text-slate-400">
                読み込み中...
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart size={24} className="text-slate-300" />
                </div>
                <p className="text-slate-400 text-sm">まだ通知はありません</p>
                <p className="text-slate-300 text-xs mt-1">
                  レシピにいいね！がつくとここに表示されます
                </p>
              </div>
            ) : (
              <>
                {/* Unread Notifications */}
                {unreadNotifications.length > 0 ? (
                  <div className="space-y-2">
                    {unreadNotifications.map((n) =>
                      renderNotification(n, true),
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-green-50/50 rounded-2xl border border-green-100">
                    <CheckCheck
                      size={24}
                      className="mx-auto mb-2 text-green-400"
                    />
                    <p className="text-sm text-green-600 font-medium">
                      未読の通知はありません
                    </p>
                  </div>
                )}

                {/* Read Notifications (Collapsible) */}
                {readNotifications.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <button
                      onClick={() =>
                        setShowReadNotifications(!showReadNotifications)
                      }
                      className="w-full flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-600 py-2 px-1 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Eye size={12} />
                        既読の通知 ({readNotifications.length}件)
                      </span>
                      {showReadNotifications ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>

                    {showReadNotifications && (
                      <div className="space-y-2 mt-2">
                        {readNotifications.map((n) =>
                          renderNotification(n, false),
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {announcementsLoading ? (
              <div className="text-center py-8 text-slate-400">
                読み込み中...
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Megaphone size={24} className="text-slate-300" />
                </div>
                <p className="text-slate-400 text-sm">
                  まだお知らせはありません
                </p>
              </div>
            ) : (
              announcements.map((announcement) => {
                // Format date from database timestamp
                const dateStr = announcement.created_at
                  ? new Date(announcement.created_at).toLocaleDateString(
                      "ja-JP",
                      { year: "numeric", month: "long", day: "numeric" },
                    )
                  : "";
                // Check if announcement is within last 7 days
                const isNew = announcement.created_at
                  ? new Date() - new Date(announcement.created_at) <
                    7 * 24 * 60 * 60 * 1000
                  : false;

                return (
                  <div
                    key={announcement.id}
                    className={`bg-white rounded-2xl p-5 border shadow-sm ${isNew ? "border-orange-200 bg-gradient-to-r from-orange-50/50 to-white" : "border-slate-100"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center flex-shrink-0 text-lg">
                        {announcement.emoji || "📢"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-700 mb-1">
                            {announcement.title}
                          </h3>
                          {isNew && (
                            <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {announcement.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-xs text-slate-400">{dateStr}</p>
                          <a
                            href="https://line.me/R/ti/p/@668fqaht"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#06C755] font-medium hover:underline"
                          >
                            ご意見・ご要望はこちら
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

