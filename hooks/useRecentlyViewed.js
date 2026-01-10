'use client'

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'anshin_recently_viewed';
const MAX_ITEMS = 20;

/**
 * useRecentlyViewed - 閲覧履歴をローカルストレージで管理
 * 
 * ネットワーク遅延ゼロで履歴を表示可能。
 * PWAでオフラインでも履歴参照が可能。
 */
export const useRecentlyViewed = () => {
    const [recentlyViewed, setRecentlyViewed] = useState([]);

    // Load from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setRecentlyViewed(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load recently viewed:', error);
        }
    }, []);

    // Add item to history
    const addToHistory = useCallback((recipe) => {
        if (!recipe?.id) return;

        setRecentlyViewed(prev => {
            // Remove existing entry for this recipe
            const filtered = prev.filter(r => r.id !== recipe.id);

            // Add to front with timestamp
            const newItem = {
                id: recipe.id,
                title: recipe.title,
                image: recipe.image,
                viewedAt: Date.now()
            };

            const newItems = [newItem, ...filtered].slice(0, MAX_ITEMS);

            // Save to localStorage
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
            } catch (error) {
                console.error('Failed to save recently viewed:', error);
            }

            return newItems;
        });
    }, []);

    // Clear all history
    const clearHistory = useCallback(() => {
        setRecentlyViewed([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear recently viewed:', error);
        }
    }, []);

    return {
        recentlyViewed,
        addToHistory,
        clearHistory
    };
};

export default useRecentlyViewed;
