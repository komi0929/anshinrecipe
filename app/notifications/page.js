'use client'

import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationList from '@/components/NotificationList';
import { ArrowLeft, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
    const router = useRouter();
    const { user, loading: profileLoading } = useProfile();
    const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications(user?.id);

    if (profileLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center px-6">
                    <Bell size={48} className="mx-auto text-slate-300 mb-4" />
                    <h2 className="text-lg font-bold text-slate-700 mb-2">ログインが必要です</h2>
                    <p className="text-sm text-slate-500">通知を確認するにはログインしてください</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-100">
                <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Bell size={20} className="text-primary" />
                        通知
                        {unreadCount > 0 && (
                            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </h1>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-lg mx-auto p-4">
                <NotificationList
                    notifications={notifications}
                    onRead={markAsRead}
                    onMarkAllRead={markAllAsRead}
                    unreadCount={unreadCount}
                />
            </div>
        </div>
    );
}
