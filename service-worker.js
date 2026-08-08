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

const CACHE_VERSION = 'ppa-v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const PAGE_CACHE   = `pages-${CACHE_VERSION}`;

// ── Pages to pre-cache on install ──────────────────────────
// Add every calculator route your site has.
// These will be available offline immediately after first visit.
const PRECACHE_PAGES = [
  '/',
  '/calculators.html',
  // ── Piping Mechanical Design ──
  '/tools/pipe-wall-thickness-calculator.html',
  '/tools/pipe-volume-weight-calculator.html',
  '/tools/pressure-sustaining-calculator.html',
  '/tools/expansion-loop-calculator.html',
  // ── Add your other calculator pages below ──
  // '/tools/hydro-pneumo-test-calculator.html',
  // '/tools/pipeline-wall-thickness-calculator.html',
  // ... etc.
];

// ── Static assets to pre-cache ─────────────────────────────
// Add your CSS, JS bundles, shared images, and fonts.
const PRECACHE_ASSETS = [
  // '/css/main.css',
  // '/js/calculators.js',
  // '/images/ppa-logo.png',
  // Add your actual asset paths here
];

// ── Install: pre-cache critical resources ──────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker:', CACHE_VERSION);
  event.waitUntil(
    Promise.all([
      caches.open(PAGE_CACHE).then((cache) => cache.addAll(PRECACHE_PAGES)),
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS)),
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

  // Skip non-http(s) requests and Memberstack/Stripe/analytics calls
  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) return;

  const SKIP_DOMAINS = [
    'api.memberstack.com',
    'js.stripe.com',
    'api.stripe.com',
    'www.google-analytics.com',
    'www.googletagmanager.com',
    'cdn.memberstack.com',
  ];
  if (SKIP_DOMAINS.some((d) => url.hostname.includes(d))) return;

  // HTML pages → stale-while-revalidate
  if (request.headers.get('Accept')?.includes('text/html') || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(staleWhileRevalidate(request, PAGE_CACHE));
    return;
  }

  // Static assets → cache-first
  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

// ── Cache-first strategy ───────────────────────────────────
// Great for CSS, JS, images that don't change often.
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    // Offline and not cached — return a basic fallback
    return new Response('Offline — resource not cached', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// ── Stale-while-revalidate strategy ────────────────────────
// Serve cached version instantly, update cache in background.
// User gets fast load; next visit gets the updated page.
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cached); // If network fails, fall back to cache

  // Return cached immediately if available, otherwise wait for network
  return cached || fetchPromise;
}
