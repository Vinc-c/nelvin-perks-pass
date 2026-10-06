// Nelvin Benefits — Service Worker (installable PWA, offline app shell).
//
// Only same-origin GET requests are handled. API calls (Supabase, PSPs, logo
// services…) always go straight to the network: they must never be served
// from a stale cache, and a failure there must surface to the app as a normal
// fetch error rather than a broken service-worker response.

const CACHE_VERSION = "nelvin-v3";
const APP_SHELL = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined) // never block installation on a missing file
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const offlinePage = () =>
  new Response(
    "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>Hors ligne</title>" +
      "<body style='font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#0F172A;color:#fff;text-align:center'>" +
      "<div><h1>Vous êtes hors ligne</h1><p>Reconnectez-vous à internet puis rechargez la page.</p></div>",
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let the browser handle it

  // Page loads: network first, then the cached shell (SPA), then an offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put("/index.html", copy));
          }
          return res;
        })
        .catch(async () => (await caches.match("/index.html")) || (await caches.match("/")) || offlinePage())
    );
    return;
  }

  // Hashed build assets and images: cache first, then network.
  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/images/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request)
            .then((res) => {
              if (res.ok) {
                const copy = res.clone();
                caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
              }
              return res;
            })
            .catch(() => Response.error())
      )
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
