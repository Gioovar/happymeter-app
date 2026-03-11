
import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true },
    // Force Deploy: 2025-12-27 - MXN Pricing & Checkout Redirect Fix (Final)Keys
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    logging: {
        fetches: {
            fullUrl: true,
        },
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'img.clerk.com',
            },
            {
                protocol: 'https',
                hostname: '*.public.blob.vercel-storage.com',
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
    async rewrites() {
        return [
            { source: '/ops/manifest.json', destination: '/ops/manifest.json' },
            { source: '/rps/manifest.json', destination: '/rps/manifest.json' },
            // Ensure survey manifests resolve correctly
            { source: '/api/surveys/:surveyId/manifest', destination: '/api/surveys/:surveyId/manifest' },
            // fallback to default manifest for other routes
            { source: '/manifest.json', destination: '/manifest.json' },
        ];
    },
};

const pwaConfig = withPWA({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
    reloadOnOnline: true,
    runtimeCaching: [
        {
            urlPattern: /^\/s\/.*/i,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'survey-pages',
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 24 * 60 * 60, // 24 hours
                },
                networkTimeoutSeconds: 10,
            },
        },
        {
            urlPattern: /^\/api\/surveys\/.*\/manifest/i,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'survey-manifests',
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 24 * 60 * 60,
                },
            },
        }
    ]
});

export default pwaConfig(nextConfig);