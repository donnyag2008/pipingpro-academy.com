// ============================================================
// PipingPro Academy — Service Worker (PWA Offline Support)
// ============================================================
// Deploy to: root of pipingpro-academy.com (same level as index.html)
//
// Strategy:
//   - Static assets (CSS, JS, images, fonts): Cache-first
//   - HTML pages: Stale-while-revalidate (serve cached, update in background)
//   - Calculator pages: Pre-cached on install for full offline use
//
// Bump CACHE_VERSION when you deploy updated calculators/pages.
// ============================================================

const CACHE_VERSION = 'ppa-v2';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const PAGE_CACHE   = `pages-${CACHE_VERSION}`;

// ── Pages to pre-cache on install ──────────────────────────
// Add every calculator route your site has.
// These will be available offline immediately after first visit.
const PRECACHE_PAGES = [
  '/calculators/',
  '/calculators/basic/pipe-wall-thickness.html',
  '/calculators/basic/pipe-weight.html',
  // removed — old tool,
  '/calculators/basic/expansion-loop.html',
  // ── Add your other calculator pages below ──
  // '/tools/hydro-pneumo-test-calculator.html',
  // '/tools/pipeline-wall-thickness-calculator.html',
  // ... etc.
];

// ── Static assets to pre-cache ─────────────────────────────
// Add your CSS, JS bundles, shared images, and fonts.
const PRECACHE_ASSETS = [
  '/js/ppa-pipe-data.js',
  '/js/ppa-materials.js',
  '/js/ppa-tier.js',
  // Add your actual CSS/image paths here
  // '/css/main.css',
  // '/images/ppa-logo.png',
];

// ── Helper: strip redirect from response so it can be cached ──
async function cleanResponse(response) {
  if (response.redirected) {
    const body = await response.blob();
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }
  return response;
}

// ── Install: pre-cache critical resources ──────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker:', CACHE_VERSION);
  event.waitUntil(
    Promise.all([
      caches.open(PAGE_CACHE).then(async (cache) => {
        for (const url of PRECACHE_PAGES) {
          try {
            const response = await fetch(url, { redirect: 'follow' });
            if (response.ok) {
              const clean = await cleanResponse(response);
              await cache.put(url, clean);
            }
          } catch (err) {
            console.warn('[SW] Failed to pre-cache:', url, err);
          }
        }
      }),
      caches.open(STATIC_CACHE).then(async (cache) => {
        for (const url of PRECACHE_ASSETS) {
          try {
            const response = await fetch(url, { redirect: 'follow' });
            if (response.ok) {
              const clean = await cleanResponse(response);
              await cache.put(url, clean);
            }
          } catch (err) {
            console.warn('[SW] Failed to pre-cache:', url, err);
          }
        }
      }),
    ]).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ──────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE)
          .map((key) => {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: serve from cache with smart fallback ────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Only handle same-origin requests
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Skip Memberstack/Stripe/analytics calls
  const SKIP_DOMAINS = [
    'api.memberstack.com',
    'js.stripe.com',
    'api.stripe.com',
    'www.google-analytics.com',
    'www.googletagmanager.com',
    'cdn.memberstack.com',
  ];
  if (SKIP_DOMAINS.some((d) => url.hostname.includes(d))) return;

  // Skip API and functions routes
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/functions/')) return;

  // HTML pages → stale-while-revalidate
  if (request.headers.get('Accept')?.includes('text/html') || url.pathname.endsWith('.html')) {
    event.respondWith(staleWhileRevalidate(request, PAGE_CACHE));
    return;
  }

  // Static assets → cache-first
  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

// ── Cache-first strategy ───────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const clean = await cleanResponse(networkResponse);
      const cache = await caches.open(cacheName);
      cache.put(request, clean.clone());
      return clean;
    }
    return networkResponse;
  } catch (err) {
    return new Response('Offline — resource not cached', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// ── Stale-while-revalidate strategy ────────────────────────
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        const clean = await cleanResponse(networkResponse);
        cache.put(request, clean.clone());
        return clean;
      }
      return networkResponse;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}
