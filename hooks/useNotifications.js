'use client';

import { useState, useEffect } from 'react';

// SAFE MODE: Temporarily disabled fetching to restore UI
export const useNotifications = (userId) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const markAsRead = async () => { };
    const markAllAsRead = async () => { };

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refreshNotifications: () => { }
    };
};
