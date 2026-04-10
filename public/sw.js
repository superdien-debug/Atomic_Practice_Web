const CACHE_NAME = 'atomic-practice-v1';

// We can add assets to cache during installation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // basic fetch handler to satisfy PWA requirements
  event.respondWith(
    fetch(event.request).catch(() => {
      // fallback if offline
      return caches.match(event.request);
    })
  );
});
