
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
};

const pwaConfig = withPWA({
    dest: "public",
    // disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
});

export default pwaConfig(nextConfig);