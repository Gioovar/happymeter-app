
self.addEventListener('install', function (event) {
    console.log('SW: Install event, skipping waiting');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
    console.log('SW: Activate event, claiming clients');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json()
        const options = {
            body: data.body,
            icon: data.icon || '/happymeter_logo.png',
            badge: '/happymeter_logo.png',
            vibrate: [200, 100, 200, 100, 200, 100, 200],
            tag: 'renotify',
            renotify: true,
            requireInteraction: true,
            actions: [
                {
                    action: 'open',
                    title: 'Ver ahora',
                }
            ],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '2',
                url: data.url || '/'
            },
        }
        event.waitUntil(
            self.registration.showNotification(data.title, options)
                .then(() => {
                    // Try to play custom sound by messaging all open clients
                    return self.clients.matchAll({ type: 'window' }).then(clients => {
                        clients.forEach(client => {
                            client.postMessage({
                                type: 'PLAY_NOTIFICATION_SOUND',
                                url: '/notification.mp3'
                            });
                        });
                    });
                })
        )
    }
})

self.addEventListener('notificationclick', function (event) {
    console.log('Notification click received.')
    event.notification.close()
    event.waitUntil(
        self.clients.openWindow(event.notification.data.url)
    )
})
