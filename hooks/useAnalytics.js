'use client'

import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useProfile } from '@/hooks/useProfile';

// Generate a session ID that persists for the browser session
const getSessionId = () => {
    if (typeof window === 'undefined') return null;
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
};

/**
 * Analytics hook for tracking user events
 * 
 * Events to track:
 * - page_view: { path }
 * - recipe_view: { recipe_id }
 * - recipe_save: { recipe_id }
 * - recipe_like: { recipe_id }
 * - recipe_create: { recipe_id, has_url, has_image }
 * - smart_import_start: { url }
 * - smart_import_success: { url, has_ingredients }
 * - smart_import_fail: { url, error }
 * - search_execute: { query }
 * - filter_change: { filter_type, value }
 * - child_register: {}
 * - tried_report_create: { recipe_id }
 */
export const useAnalytics = () => {
    const { user } = useProfile();
    const sessionId = useRef(null);

    useEffect(() => {
        sessionId.current = getSessionId();
    }, []);

    const track = useCallback(async (eventName, properties = {}) => {
        try {
            const eventData = {
                event_name: eventName,
                user_id: user?.id || null,
                session_id: sessionId.current,
                properties: {
                    ...properties,
                    timestamp: new Date().toISOString(),
                    url: typeof window !== 'undefined' ? window.location.pathname : null,
                    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
                }
            };

            // Fire and forget - don't wait for response
            supabase
                .from('analytics_events')
                .insert(eventData)
                .then(({ error }) => {
                    if (error) console.warn('Analytics error:', error.message);
                });

        } catch (error) {
            // Silently fail - analytics should never break the app
            console.warn('Analytics tracking failed:', error);
        }
    }, [user?.id]);

    // Convenience methods for common events
    const trackPageView = useCallback((path) => {
        track('page_view', { path });
    }, [track]);

    const trackRecipeView = useCallback((recipeId) => {
        track('recipe_view', { recipe_id: recipeId });
    }, [track]);

    const trackRecipeSave = useCallback((recipeId) => {
        track('recipe_save', { recipe_id: recipeId });
    }, [track]);

    const trackRecipeLike = useCallback((recipeId) => {
        track('recipe_like', { recipe_id: recipeId });
    }, [track]);

    const trackRecipeCreate = useCallback((recipeId, hasUrl, hasImage) => {
        track('recipe_create', { recipe_id: recipeId, has_url: hasUrl, has_image: hasImage });
    }, [track]);

    const trackSmartImportStart = useCallback((url) => {
        track('smart_import_start', { url });
    }, [track]);

    const trackSmartImportSuccess = useCallback((url, hasIngredients) => {
        track('smart_import_success', { url, has_ingredients: hasIngredients });
    }, [track]);

    const trackSmartImportFail = useCallback((url, error) => {
        track('smart_import_fail', { url, error: error?.toString() });
    }, [track]);

    const trackSearch = useCallback((query) => {
        track('search_execute', { query });
    }, [track]);

    const trackFilterChange = useCallback((filterType, value) => {
        track('filter_change', { filter_type: filterType, value });
    }, [track]);

    const trackChildRegister = useCallback(() => {
        track('child_register', {});
    }, [track]);

    const trackTriedReport = useCallback((recipeId) => {
        track('tried_report_create', { recipe_id: recipeId });
    }, [track]);

    return {
        track,
        trackPageView,
        trackRecipeView,
        trackRecipeSave,
        trackRecipeLike,
        trackRecipeCreate,
        trackSmartImportStart,
        trackSmartImportSuccess,
        trackSmartImportFail,
        trackSearch,
        trackFilterChange,
        trackChildRegister,
        trackTriedReport
    };
};

export default useAnalytics;
