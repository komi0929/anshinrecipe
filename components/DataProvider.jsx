'use client'

import { useEffect } from 'react';
import { SWRConfig, preload } from 'swr';
import { supabase } from '@/lib/supabaseClient';

// 🚀 Prefetch profile data on auth
const useSWRPrefetch = () => {
    useEffect(() => {

        // Listen for auth state changes and prefetch profile
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                // Preload profile data immediately after sign in
                preload(['profile', session.user.id], async () => {
                    const { data } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();
                    return data;
                });
            }
        });

        return () => subscription?.unsubscribe();
    }, []);
};

// Global SWR configuration for instant data access
export function DataProvider({ children }) {
    // Enable SWR prefetching on auth
    useSWRPrefetch();

    return (
        <SWRConfig
            value={{
                // Keep data fresh but never refetch on mount if we have cached data
                revalidateOnFocus: false,
                revalidateOnReconnect: false,
                // Use cached data immediately, revalidate in background
                revalidateIfStale: true,
                // Keep previous data while new data is loading (no flash)
                keepPreviousData: true,
                // Cache for 5 minutes
                dedupingInterval: 300000,
                // Show stale data while revalidating
                fallbackData: {},
            }}
        >
            {children}
        </SWRConfig>
    );
}
