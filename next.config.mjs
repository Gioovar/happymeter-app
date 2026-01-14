
import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
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
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '4mb',
        },
    },
};

const pwaConfig = withPWA({
    dest: "public",
    // disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
    importScripts: ["/sw-push.js"],
});

export default pwaConfig(nextConfig);