'use client'

import { SWRConfig } from 'swr';

// Global SWR configuration for instant data access
export function DataProvider({ children }) {
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
