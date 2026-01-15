'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useProfile } from '@/hooks/useProfile';

export const LikeButton = ({ reviewId, initialCount = 0, initialLiked = false }) => {
    const { user } = useProfile();
    const [liked, setLiked] = useState(initialLiked);
    const [count, setCount] = useState(initialCount);
    const [animating, setAnimating] = useState(false);

    const handleToggle = async (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (!user) {
            alert('ログインが必要です');
            return;
        }

        // Optimistic Update
        const newLiked = !liked;
        setLiked(newLiked);
        setCount(prev => newLiked ? prev + 1 : prev - 1);
        setAnimating(true);
        setTimeout(() => setAnimating(false), 300);

        try {
            // Call DB Function
            const { error } = await supabase.rpc('toggle_review_like', {
                target_review_id: reviewId
            });

            if (error) throw error;
        } catch (err) {
            console.error('Like toggle failed:', err);
            // Revert on error
            setLiked(!newLiked);
            setCount(prev => !newLiked ? prev + 1 : prev - 1);
        }
    };

    return (
        <button
            onClick={handleToggle}
            className={`flex items-center gap-1 transition-colors ${liked ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <Heart
                size={18}
                fill={liked ? 'currentColor' : 'none'}
                className={`transition-transform ${animating ? 'scale-125' : 'scale-100'}`}
            />
            <span className="text-sm font-medium">{count > 0 ? count : ''}</span>
        </button>
    );
};
