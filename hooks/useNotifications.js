'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const useNotifications = (userId) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select(`
                    id,
                    type,
                    created_at,
                    is_read,
                    actor_id,
                    recipe_id,
                    actor:profiles!actor_id (
                        display_name,
                        avatar_url
                    ),
                    recipe:recipes!recipe_id (
                        title,
                        image_url
                    )
                `)
                .eq('recipient_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                console.warn('Error fetching notifications (suppressed):', error);
                // Don't throw, just set empty to prevent crash
                setNotifications([]);
                return;
            }

            if (data) {
                setNotifications(data);
                const unread = data.filter(n => !n.is_read).length;
                setUnreadCount(unread);
            }
        } catch (err) {
            console.error('Unexpected error in useNotifications:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchNotifications();

        // Optional: Realtime subscription could go here
    }, [fetchNotifications]);

    const markAsRead = async (notificationId) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (!error) {
                setNotifications(prev =>
                    prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('recipient_id', userId)
                .eq('is_read', false);

            if (!error) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications
    };
};
