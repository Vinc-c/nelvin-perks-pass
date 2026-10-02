// Nelvin Benefits — Service Worker (offline-first PWA)
// Caches the app shell so portals + QR redemption work without a network connection.

const CACHE_VERSION = "nelvin-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/pricing",
  "/employee",
  "/member",
  "/hr",
  "/merchant",
  "/admin",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Navigation requests (page loads): network-first, fall back to cached shell so the
// app keeps working offline (critical for the QR/TOTP redemption flow).
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/index.html")))
    );
    return;
  }

  // Static assets: cache-first, then network.
  event.respondWith(
    caches.match(request).then((cached) =>
      cached ||
      fetch(request)
        .then((res) => {
          if (res && res.status === 200 && request.url.startsWith(self.location.origin)) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached)
    )
  );
});

// Allow the app to trigger an immediate update when a new SW is available.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
