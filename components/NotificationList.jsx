'use client';

import React, { useState } from 'react';
import { Heart, Bookmark, MessageCircle, Clock, CheckCheck, ChevronDown, ChevronUp, Eye, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const NotificationList = ({ notifications, onRead, onMarkAllRead, unreadCount = 0 }) => {
    const router = useRouter();
    const [showRead, setShowRead] = useState(false);

    if (!notifications || notifications.length === 0) {
        return (
            <div className="text-center py-12 text-slate-400 text-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <Clock size={24} className="text-slate-300" />
                </div>
                まだ通知はありません
            </div>
        );
    }

    // Calculate actual unread count from notifications data
    const actualUnreadCount = notifications.filter(n => {
        const isRead = n.isRead !== undefined ? n.isRead : n.is_read;
        return !isRead;
    }).length;

    const unreadNotifications = notifications.filter(n => {
        const isRead = n.isRead !== undefined ? n.isRead : n.is_read;
        return !isRead;
    });

    const readNotifications = notifications.filter(n => {
        const isRead = n.isRead !== undefined ? n.isRead : n.is_read;
        return isRead;
    });

    const handleClick = (notification) => {
        const isRead = notification.isRead !== undefined ? notification.isRead : notification.is_read;
        const recipeId = notification.recipeId || notification.recipe_id;
        if (!isRead) {
            onRead(notification.id);
        }

        // Navigate to the recipe
        if (recipeId) {
            let target = `/recipe/${recipeId}`;
            if (notification.type === 'report') {
                target += '#tried-reports';
            }
            router.push(target);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'like': return <Heart size={18} className="text-pink-500 fill-pink-500" />;
            case 'report_like': return <Heart size={18} className="text-pink-500 fill-pink-500" />;
            case 'save': return <Bookmark size={18} className="text-orange-500 fill-orange-500" />;
            case 'report': return <MessageCircle size={18} className="text-blue-500 fill-blue-500" />;
            case 'thanks': return <Sparkles size={18} className="text-amber-500 fill-amber-500" />;
            default: return <Clock size={18} className="text-slate-400" />;
        }
    };

    const getMessage = (notification) => {
        const actorName = notification.actor?.displayName || notification.actor?.username || notification.actor?.display_name || '誰か';
        const recipeTitle = notification.recipe?.title || 'レシピ';

        switch (notification.type) {
            case 'like':
                return (
                    <span>
                        <strong className="text-slate-800">{actorName}</strong>
                        <span className="text-slate-600">があなたのレシピに</span>
                        <span className="text-pink-500 font-bold">いいね！</span>
                        <span className="text-slate-600">しました</span>
                    </span>
                );
            case 'save':
                return (
                    <span>
                        <strong className="text-slate-800">{actorName}</strong>
                        <span className="text-slate-600">があなたのレシピを</span>
                        <span className="text-orange-500 font-bold">保存</span>
                        <span className="text-slate-600">しました</span>
                    </span>
                );
            case 'report':
                return (
                    <span>
                        <strong className="text-slate-800">{actorName}</strong>
                        <span className="text-slate-600">があなたのレシピに</span>
                        <span className="text-blue-500 font-bold">つくレポ</span>
                        <span className="text-slate-600">を投稿しました</span>
                    </span>
                );
            case 'report_like':
                return (
                    <span>
                        <strong className="text-slate-800">{actorName}</strong>
                        <span className="text-slate-600">があなたのつくレポに</span>
                        <span className="text-pink-500 font-bold">いいね！</span>
                        <span className="text-slate-600">しました</span>
                    </span>
                );
            case 'thanks':
                // Get the thanks message from metadata if available
                const thanksEmoji = notification.metadata?.emoji || '💕';
                const thanksMessage = notification.metadata?.message || '感謝';
                return (
                    <span>
                        <strong className="text-slate-800">{actorName}</strong>
                        <span className="text-slate-600">から</span>
                        <span className="text-amber-500 font-bold"> {thanksEmoji} {thanksMessage}</span>
                        <span className="text-slate-600">が届きました！</span>
                    </span>
                );
            default:
                return '新しい通知があります';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'たった今';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分前`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}時間前`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}日前`;
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    const renderNotificationItem = (n, isUnread = false) => {
        const isRead = n.isRead !== undefined ? n.isRead : n.is_read;
        const createdAt = n.createdAt || n.created_at;
        const recipeImage = n.recipe?.imageUrl || n.recipe?.image_url;
        const actorAvatar = n.actor?.avatarUrl || n.actor?.avatar_url;

        return (
            <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`
                    flex items-start gap-3 p-4 cursor-pointer transition-all duration-200
                    ${isUnread
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50/50 border-l-4 border-l-orange-400 hover:from-orange-100 hover:to-amber-100/50'
                        : 'bg-slate-50/50 opacity-70 hover:opacity-100 hover:bg-slate-100/50'
                    }
                `}
            >
                {/* Actor Avatar or Recipe Image */}
                <div className="relative flex-shrink-0">
                    {actorAvatar ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200">
                            <Image
                                src={actorAvatar}
                                alt=""
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                            <span className="text-xl">👤</span>
                        </div>
                    )}
                    {/* Icon Badge */}
                    <div className={`
                        absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-sm
                        ${n.type === 'like' || n.type === 'report_like' ? 'bg-pink-100' :
                            n.type === 'save' ? 'bg-orange-100' :
                                n.type === 'thanks' ? 'bg-amber-100' :
                                    n.type === 'report' ? 'bg-blue-100' : 'bg-slate-100'}
                    `}>
                        {getIcon(n.type)}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-grow min-w-0">
                    <p className="text-sm leading-relaxed mb-1">
                        {getMessage(n)}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs ${isUnread ? 'text-orange-500 font-medium' : 'text-slate-400'}`}>
                            {formatDate(createdAt)}
                        </span>
                        {isRead && (
                            <span className="text-xs text-slate-300 flex items-center gap-0.5">
                                <Eye size={10} />
                                既読
                            </span>
                        )}
                    </div>
                </div>

                {/* Unread Indicator */}
                {isUnread && (
                    <div className="flex-shrink-0 mt-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse shadow-sm shadow-orange-300" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    アクティビティ
                    {actualUnreadCount > 0 && (
                        <span className="text-[11px] bg-orange-500 text-white px-2.5 py-0.5 rounded-full font-bold">
                            {actualUnreadCount}件
                        </span>
                    )}
                </h3>
                {actualUnreadCount > 0 && onMarkAllRead && (
                    <button
                        onClick={onMarkAllRead}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium transition-colors px-2 py-1 rounded-lg hover:bg-orange-50"
                    >
                        <CheckCheck size={14} />
                        すべて既読
                    </button>
                )}
            </div>

            {/* Unread Notifications */}
            {unreadNotifications.length > 0 ? (
                <div className="divide-y divide-orange-100/50">
                    {unreadNotifications.map(n => renderNotificationItem(n, true))}
                </div>
            ) : (
                <div className="py-6 text-center text-slate-400 text-sm">
                    <CheckCheck size={20} className="mx-auto mb-2 text-green-400" />
                    未読の通知はありません
                </div>
            )}

            {/* Read Notifications (Collapsible) */}
            {readNotifications.length > 0 && (
                <div className="border-t border-slate-100">
                    <button
                        onClick={() => setShowRead(!showRead)}
                        className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <span className="flex items-center gap-1.5">
                            <Eye size={12} />
                            既読の通知 ({readNotifications.length}件)
                        </span>
                        {showRead ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {showRead && (
                        <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                            {readNotifications.map(n => renderNotificationItem(n, false))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationList;
