/* Woolzip Service Worker - PWA shell & basic caching */
const CACHE_NAME = 'woolzip-cache-v1';
const ASSET_CACHE = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSET_CACHE)).catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Navigation: network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, resClone));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))) // fallback to cached shell
    );
    return;
  }

  // Static assets: cache-first for same-origin files (icons/manifest/css/js)
  if (isSameOrigin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, resClone));
          return res;
        });
      })
    );
  }
});

// Placeholder for background sync tags (sync:signal, sync:med) if needed later.
self.addEventListener('sync', (event) => {
  // Implement POST 재시도 로직 here when offline queue is ready.
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    try {
      payload = JSON.parse(event.data.text());
    } catch {
      payload = { title: '울집', body: '새 알림이 도착했어요.' };
    }
  }

  const title = payload.title || '울집';
  const body = payload.body || '새 알림이 도착했어요.';
  const url = payload.url || '/';
  const icon = payload.icon || '/icons/icon-192.png';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/icons/icon-192.png',
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const client = clients.find((c) => c.url.includes(self.location.origin));
      if (client) {
        client.focus();
        if (targetUrl) client.navigate(targetUrl);
        return;
      }
      self.clients.openWindow(targetUrl);
    })
  );
});
