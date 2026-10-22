/* eslint-disable no-restricted-globals */
/**
 * Service Worker SuperPOS.
 *
 * Strategi caching:
 * - Navigasi halaman : network-first, fallback ke cache, lalu halaman /offline.
 * - Aset statis Next : cache-first (nama file ber-hash, aman di-cache lama).
 * - Gambar           : stale-while-revalidate.
 * - API & Supabase   : selalu network (tidak pernah di-cache).
 */

const VERSION = "v1";
const STATIC_CACHE = `superpos-static-${VERSION}`;
const PAGE_CACHE = `superpos-pages-${VERSION}`;
const IMAGE_CACHE = `superpos-images-${VERSION}`;

const OFFLINE_URL = "/offline";
const NAVIGATION_TIMEOUT = 4000;
const MAX_PAGE_ENTRIES = 20;
const MAX_IMAGE_ENTRIES = 60;

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/logo-SP.png",
  "/icons/icon-96.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

const IMAGE_EXTENSIONS = /\.(?:png|jpe?g|svg|webp|gif|ico|bmp|avif)$/i;

const FALLBACK_HTML = `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Offline - SuperPOS</title>
    <style>
      body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f9fafb; color: #1f2937; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
      .box { max-width: 22rem; padding: 2rem; text-align: center; }
      h1 { font-size: 1.25rem; margin: 0 0 .5rem; }
      p { color: #6b7280; font-size: .875rem; line-height: 1.6; margin: 0 0 1.5rem; }
      a { display: inline-block; padding: .625rem 1.25rem; border-radius: .75rem; background: #2563eb; color: #fff; font-size: .875rem; font-weight: 600; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="box">
      <h1>Anda sedang offline</h1>
      <p>Periksa koneksi internet Anda, lalu buka kembali SuperPOS.</p>
      <a href="/">Coba Lagi</a>
    </div>
  </body>
</html>`;

/* ── Helpers ─────────────────────────────────────────────────────────── */

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(
    keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key))
  );
}

async function putInCache(cacheName, request, response) {
  if (!response || !response.ok || response.type === "opaque") return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
}

/* ── Strategi ────────────────────────────────────────────────────────── */

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  await putInCache(cacheName, request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cached = await caches.match(request);

  const network = fetch(request)
    .then(async (response) => {
      await putInCache(cacheName, request, response.clone());
      await trimCache(cacheName, maxEntries);
      return response;
    })
    .catch(() => null);

  if (cached) return cached;

  const response = await network;
  if (response) return response;
  throw new Error("Tidak ada koneksi dan tidak ada cache");
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    await putInCache(cacheName, request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw error;
  }
}

async function handleNavigation(event) {
  try {
    const preload = await event.preloadResponse;
    if (preload) return preload;

    const response = await withTimeout(
      fetch(event.request),
      NAVIGATION_TIMEOUT
    );
    await putInCache(PAGE_CACHE, event.request, response.clone());
    await trimCache(PAGE_CACHE, MAX_PAGE_ENTRIES);
    return response;
  } catch {
    const cachedPage = await caches.match(event.request, {
      ignoreSearch: true,
    });
    if (cachedPage) return cachedPage;

    const offlinePage = await caches.match(OFFLINE_URL);
    if (offlinePage) return offlinePage;

    return new Response(FALLBACK_HTML, {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

/* ── Lifecycle ───────────────────────────────────────────────────────── */

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" }))
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const validCaches = [STATIC_CACHE, PAGE_CACHE, IMAGE_CACHE];
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(
            (name) => name.startsWith("superpos-") && !validCaches.includes(name)
          )
          .map((name) => caches.delete(name))
      );

      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/* ── Fetch ───────────────────────────────────────────────────────────── */

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Hanya tangani request ke origin sendiri. Supabase & CDN dibiarkan network.
  if (url.origin !== self.location.origin) return;

  // API dan auth harus selalu realtime.
  if (url.pathname.startsWith("/api/")) return;

  // Jangan cache request range (video/audio/streaming).
  if (request.headers.has("range")) return;

  // Jangan cache payload RSC Next.js agar navigasi client tidak memakai data basi.
  if (request.headers.get("RSC") === "1") return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/logo-SP.png" ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (url.pathname.startsWith("/_next/image")) {
    event.respondWith(
      staleWhileRevalidate(request, IMAGE_CACHE, MAX_IMAGE_ENTRIES)
    );
    return;
  }

  if (IMAGE_EXTENSIONS.test(url.pathname)) {
    event.respondWith(
      staleWhileRevalidate(request, IMAGE_CACHE, MAX_IMAGE_ENTRIES)
    );
    return;
  }

  event.respondWith(networkFirst(request, STATIC_CACHE));
});
