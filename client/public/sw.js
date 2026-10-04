// Minimal service worker: network-first, falling back to cache when offline.
// Phrase clips get cached as they are played, so phrase cards work offline
// after first use. API calls are never cached.
const CACHE = 'rohingya-voice-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/') && url.pathname !== '/api/phrases') return;
  if (url.pathname.startsWith('/recordings/')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => (await caches.match(request)) ?? (await caches.match('/')) ?? Response.error()),
  );
});
