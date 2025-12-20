'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart, Megaphone, Check, CheckCheck } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import Image from 'next/image';

const NotificationsPage = () => {
    const { user, profile, loading: profileLoading } = useProfile();
    const { notifications, loading: notificationsLoading, markAsRead, markAllAsRead } = useNotifications(user?.id);
    const [activeTab, setActiveTab] = useState('activity'); // 'activity' | 'announcements'

    // App announcements (static for now)
    const announcements = [
        {
            id: 1,
            title: 'あんしんレシピ へようこそ！',
            content: 'アレルギーっ子のパパ・ママのためのレシピ共有アプリです。ご意見・ご要望はお気軽にお問い合わせからお寄せください。',
            date: '2024-12-01',
            isNew: false
        }
    ];

    if (profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
                <div className="animate-pulse">
                    <Image
                        src="/logo.png"
                        alt="Loading..."
                        width={180}
                        height={45}
                        className="object-contain opacity-50"
                    />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container max-w-md mx-auto min-h-screen bg-background pb-20 px-4 pt-6">
                <p className="text-center text-slate-500">ログインが必要です</p>
            </div>
        );
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (hours < 1) return 'たった今';
        if (hours < 24) return `${hours}時間前`;
        if (days < 7) return `${days}日前`;
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    const getNotificationMessage = (notification) => {
        switch (notification.type) {
            case 'like':
                return 'があなたのレシピにいいね！しました';
            case 'tried':
                return 'があなたのレシピを作りました';
            case 'comment':
                return 'がコメントしました';
            default:
                return 'からの通知';
        }
    };

    return (
        <div className="container max-w-md mx-auto min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="page-header sticky top-0 bg-background z-10 border-b border-slate-100">
                <Link href="/" className="back-button">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="page-title">お知らせ</h1>
                {activeTab === 'activity' && notifications.some(n => !n.is_read) && (
                    <button
                        onClick={markAllAsRead}
                        className="ml-auto text-xs text-primary font-bold flex items-center gap-1"
                    >
                        <CheckCheck size={14} />
                        すべて既読
                    </button>
                )}
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-2xl m-4 space-x-1">
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2
                        ${activeTab === 'activity'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Heart size={16} />
                    アクティビティ
                    {notifications.filter(n => !n.is_read).length > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            {notifications.filter(n => !n.is_read).length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('announcements')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2
                        ${activeTab === 'announcements'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Megaphone size={16} />
                    運営からのお知らせ
                </button>
            </div>

            {/* Content */}
            <div className="px-4">
                {activeTab === 'activity' ? (
                    <div className="space-y-2">
                        {notificationsLoading ? (
                            <div className="text-center py-8 text-slate-400">読み込み中...</div>
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
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => {
                                        if (!notification.is_read) markAsRead(notification.id);
                                    }}
                                    className={`p-4 rounded-2xl transition-all cursor-pointer ${notification.is_read
                                        ? 'bg-white border border-slate-100'
                                        : 'bg-orange-50 border border-orange-100'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                                            {notification.actor?.avatarUrl ? (
                                                <img
                                                    src={notification.actor.avatarUrl}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    👤
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-700">
                                                <span className="font-bold">
                                                    {notification.actor?.displayName || 'ユーザー'}
                                                </span>
                                                {getNotificationMessage(notification)}
                                            </p>
                                            {notification.recipe && (
                                                <Link
                                                    href={`/recipe/${notification.recipeId}`}
                                                    className="text-xs text-primary mt-1 block truncate hover:underline"
                                                >
                                                    {notification.recipe.title}
                                                </Link>
                                            )}
                                            <p className="text-xs text-slate-400 mt-1">
                                                {formatDate(notification.createdAt)}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0 mt-2"></div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {announcements.map((announcement) => (
                            <div
                                key={announcement.id}
                                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Megaphone size={18} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-700 mb-1">
                                            {announcement.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            {announcement.content}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-2">
                                            {announcement.date}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
};

export default NotificationsPage;
