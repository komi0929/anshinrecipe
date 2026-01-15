const withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public",
    cacheOnFrontEndNav: false, // Disable aggressive caching for navigation
    aggressiveFrontEndNavCaching: false, // Disable to prevent stale HTML
    reloadOnOnline: true,
    swcMinify: true,
    disable: true, // Force disable PWA
    skipWaiting: true, // Immediately activate new service worker
    register: true,
    workboxOptions: {
        disableDevLogs: true,
        skipWaiting: true,
        clientsClaim: true, // Take control of all clients immediately
        // 🚀 Runtime caching for different resources
        runtimeCaching: [
            // HTML pages - ALWAYS get fresh from network
            {
                urlPattern: /^https:\/\/.*\.(com|vercel\.app)\/?.*$/,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'html-cache',
                    networkTimeoutSeconds: 3,
                    expiration: {
                        maxEntries: 32,
                        maxAgeSeconds: 60 * 60, // 1 hour
                    },
                },
            },
            // Auth and profile related - NEVER cache
            {
                urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/,
                handler: 'NetworkOnly',
            },
            {
                urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(profiles|children|saved_recipes|likes)\?.*/,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'supabase-profile-cache',
                    networkTimeoutSeconds: 5,
                    expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 60,
                    },
                },
            },
            // Other Supabase API calls
            {
                urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'supabase-api-cache',
                    expiration: {
                        maxEntries: 100,
                        maxAgeSeconds: 60 * 60,
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
                        maxAgeSeconds: 60 * 60 * 24 * 7,
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
