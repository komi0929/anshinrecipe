'use client';

import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useProfile } from '@/hooks/useProfile';

export const BookmarkButton = ({ restaurantId, initialBookmarked = false, className = '' }) => {
    const { user } = useProfile();
    const [bookmarked, setBookmarked] = useState(initialBookmarked);
    const [loading, setLoading] = useState(false);

    // Initial check (optional, if prop not reliable)
    useEffect(() => {
        if (user && restaurantId && initialBookmarked === undefined) {
            const checkStatus = async () => {
                const { data } = await supabase
                    .from('bookmarks')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('restaurant_id', restaurantId)
                    .single();
                if (data) setBookmarked(true);
            };
            checkStatus();
        }
    }, [user, restaurantId, initialBookmarked]);

    const handleToggle = async (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (!user) {
            alert('ログインが必要です');
            return;
        }
        if (loading) return;

        setLoading(true);
        // Optimistic
        const newState = !bookmarked;
        setBookmarked(newState);

        try {
            if (newState) {
                // Add Bookmark
                const { error } = await supabase
                    .from('bookmarks')
                    .insert({ user_id: user.id, restaurant_id: restaurantId });
                if (error) throw error;
            } else {
                // Remove Bookmark
                const { error } = await supabase
                    .from('bookmarks')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('restaurant_id', restaurantId);
                if (error) throw error;
            }
        } catch (err) {
            console.error('Bookmark toggle failed:', err);
            setBookmarked(!newState); // Revert
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`p-2 rounded-full backdrop-blur-md transition-all ${bookmarked
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                    : 'bg-white/80 text-slate-400 hover:bg-white border-transparent'
                } ${className}`}
        >
            <Bookmark
                size={22}
                fill={bookmarked ? 'currentColor' : 'none'}
                strokeWidth={2}
            />
        </button>
    );
};
