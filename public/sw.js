/// <reference lib="webworker" />

const CACHE_NAME = "ltsd-v1";
const OFFLINE_URL = "/offline";

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  "/images/ltsd-logo.webp",
  "/manifest.json",
];

// ── Install: pre-cache critical assets ──────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: strategy per request type ────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests, API calls, and auth routes
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin/") ||
    url.pathname.startsWith("/_next/webpack")
  ) {
    return;
  }

  // Images: cache-first (long-lived)
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/) ||
    url.hostname.includes("images-na.ssl-images-amazon.com") ||
    url.hostname.includes("m.media-amazon.com")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Static assets (_next/static): cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Pages: network-first, fallback to offline page
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }
});

// ── Push notifications ──────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body ?? "You have a new notification",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: { url: data.url ?? "/dashboard" },
      vibrate: [100, 50, 100],
    };

    event.waitUntil(self.registration.showNotification(data.title ?? "LTSD", options));
  } catch {
    // Invalid push payload — ignore
  }
});

// ── Notification click: open the target URL ─────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      // Open new tab
      return self.clients.openWindow(targetUrl);
    })
  );
});
