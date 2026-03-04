self.addEventListener('install', () => {
    console.log('SW installed');
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
});