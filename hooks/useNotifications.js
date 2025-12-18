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
                const formatted = data.map(n => ({
                    id: n.id,
                    type: n.type,
                    createdAt: n.created_at,
                    isRead: n.is_read,
                    actorId: n.actor_id,
                    recipeId: n.recipe_id,
                    actor: {
                        displayName: n.actor?.display_name || 'ゲスト',
                        avatarUrl: n.actor?.avatar_url
                    },
                    recipe: n.recipe ? {
                        title: n.recipe.title,
                        imageUrl: n.recipe.image_url
                    } : null
                }));
                setNotifications(formatted);
                const unread = formatted.filter(n => !n.isRead).length;
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

        // Set up realtime subscription for notifications
        if (!userId) return;

        const channel = supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${userId}`
                },
                (payload) => {
                    // Fetch the new notification with joined data
                    fetchNotifications();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${userId}`
                },
                (payload) => {
                    // Update the notification in state
                    if (payload.new) {
                        setNotifications(prev =>
                            prev.map(n => n.id === payload.new.id ? {
                                ...n,
                                isRead: payload.new.is_read
                            } : n)
                        );
                        // Recalculate unread count
                        setUnreadCount(prev => {
                            const updated = payload.new;
                            if (updated.is_read) {
                                return Math.max(0, prev - 1);
                            }
                            return prev;
                        });
                    }
                }
            )
            .subscribe();

        // Cleanup subscription on unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchNotifications, userId]);

    const markAsRead = async (notificationId) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (!error) {
                setNotifications(prev =>
                    prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
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
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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
