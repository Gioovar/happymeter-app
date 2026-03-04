// ops-sw.js
// Custom Service Worker for HappyMeter OPS
// This ensures OPS has an isolated cache and operates independently from the main HappyMeter PWA.

const CACHE_NAME = 'ops-cache-v1';
const OFFLINE_URL = '/ops';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                OFFLINE_URL,
                '/ops_icon.png',
                // Add any other specific static assets needed offline for OPS here
            ]);
        })
    );
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete old OPS caches if version changes
                    if (cacheName.startsWith('ops-cache-') && cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Tell the active service worker to take control of the page immediately.
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Only intercept requests for the /ops/ scope to ensure complete independence
    if (event.request.url.includes('/ops/')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(event.request).then((response) => {
                    if (response) {
                        return response;
                    }
                    // For document requests, return the offline fallback
                    if (event.request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL);
                    }
                    return null;
                });
            })
        );
    }
});
