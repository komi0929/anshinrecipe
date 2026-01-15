const withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public",
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    swcMinify: true,
    disable: process.env.NODE_ENV === "development", // Disable PWA in dev mode
    workboxOptions: {
        disableDevLogs: true,
        // 🚀 Runtime caching for Supabase API calls
        runtimeCaching: [
            // Auth and profile related - always get fresh data
            {
                urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/,
                handler: 'NetworkOnly', // Never cache auth
            },
            {
                urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(profiles|children|saved_recipes|likes)\?.*/,
                handler: 'NetworkFirst', // Profile data - prefer network
                options: {
                    cacheName: 'supabase-profile-cache',
                    networkTimeoutSeconds: 5,
                    expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 60, // Only 1 minute cache
                    },
                },
            },
            // Other Supabase API calls - use stale-while-revalidate
            {
                urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'supabase-api-cache',
                    expiration: {
                        maxEntries: 100,
                        maxAgeSeconds: 60 * 60, // 1 hour
                    },
                },
            },
            {
                urlPattern: /^https:\/\/i\.ytimg\.com\/.*/,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'youtube-thumbnail-cache',
                    expiration: {
                        maxEntries: 200,
                        maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
                    },
                },
            },
        ],
    },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'www.cotta.jp',
            },
            {
                protocol: 'https',
                hostname: 'i.ytimg.com',
            },
            {
                protocol: 'https',
                hostname: 'og-image.cookpad.com',
            },
            {
                protocol: 'https',
                hostname: 'image.delishkitchen.tv',
            },
            {
                protocol: 'https',
                hostname: 'profile.line-scdn.net',
            },
            {
                protocol: 'https',
                hostname: 'obs.line-scdn.net',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
        ],
    },
}

module.exports = withPWA(nextConfig);
