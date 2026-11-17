// Lightweight PWA Service Worker for PashuMitra AI
// Enables "Add to Home Screen" / Install App on Android Chrome while always serving fresh API data.

const CACHE_NAME = 'pashumitra-ai-pwa-v1';
const APP_SHELL = ['/', '/index.html', '/leaf.svg', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.url.includes('/api/')) return;
  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((res) => res || caches.match('/index.html')))
  );
});
