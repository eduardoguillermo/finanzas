const CACHE = 'finanzas-v11';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    const url = e.request.url;
    // HTML y JS siempre desde la red — nunca cachear
    if (url.includes('.html') || url.includes('.js')) {
        e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
        return;
    }
    // El resto se cachea normalmente
    e.respondWith(
        caches.match(e.request).then(r => r || fetch(e.request))
    );
});
