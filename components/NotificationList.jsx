'use client';

import React from 'react';
import { Heart, Bookmark, MessageCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

const NotificationList = ({ notifications, onRead }) => {
    const router = useRouter();

    if (!notifications || notifications.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400 text-sm">
                まだ通知はありません
            </div>
        );
    }

    const handleClick = (notification) => {
        if (!notification.is_read) {
            onRead(notification.id);
        }
        // Navigate to the recipe
        if (notification.recipe_id) {
            router.push(`/recipe/${notification.recipe_id}`);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'like': return <Heart size={16} className="text-pink-500 fill-pink-500" />;
            case 'save': return <Bookmark size={16} className="text-orange-500 fill-orange-500" />;
            case 'report': return <MessageCircle size={16} className="text-blue-500 fill-blue-500" />;
            default: return <Clock size={16} className="text-slate-400" />;
        }
    };

    const getMessage = (notification) => {
        const actorName = notification.actor?.display_name || notification.actor?.username || '誰か';
        const recipeTitle = notification.recipe?.title || 'レシピ';

        switch (notification.type) {
            case 'like':
                return (
                    <span>
                        <strong>{actorName}</strong>さんが
                        「<strong>{recipeTitle}</strong>」にいいねしました
                    </span>
                );
            case 'save':
                return (
                    <span>
                        <strong>{actorName}</strong>さんが
                        「<strong>{recipeTitle}</strong>」を保存しました
                    </span>
                );
            case 'report':
                return (
                    <span>
                        <strong>{actorName}</strong>さんが
                        「<strong>{recipeTitle}</strong>」のレポートを投稿しました
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

        if (diffInSeconds < 60) return '今';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分前`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}時間前`;
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {notifications.map((n) => (
                <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`
                        flex items-start gap-3 p-4 border-b border-slate-50 last:border-0 cursor-pointer transition-colors
                        ${n.is_read ? 'bg-white' : 'bg-orange-50/50'}
                        hover:bg-slate-50
                    `}
                >
                    <div className="mt-1 flex-shrink-0">
                        {getIcon(n.type)}
                    </div>
                    <div className="flex-grow min-w-0">
                        <p className="text-sm text-slate-700 leading-snug">
                            {getMessage(n)}
                        </p>
                        <span className="text-xs text-slate-400 mt-1 block">
                            {formatDate(n.created_at)}
                        </span>
                    </div>
                    {!n.is_read && (
                        <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0"></div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default NotificationList;
