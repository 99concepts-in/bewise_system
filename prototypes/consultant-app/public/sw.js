/* BeWise consultant prototype — static asset cache for instant repeat loads.
 * Caches only the app shell and static files (no API data exists in this prototype; the real app never caches /consult API responses). */
const VERSION = 'bw-consult-v3'
self.addEventListener('install', (e) => { self.skipWaiting() })
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== location.origin) return
  // hashed assets, fonts, images: cache first (immutable)
  if (/\/(assets|fonts|img)\//.test(url.pathname) || /\.(png|ico|webmanifest)$/.test(url.pathname)) {
    e.respondWith(caches.open(VERSION).then(async (c) => {
      const hit = await c.match(req)
      if (hit) return hit
      const res = await fetch(req)
      if (res.ok) c.put(req, res.clone())
      return res
    }))
    return
  }
  // the page itself: network first, fall back to cache when offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res })
      .catch(() => caches.match(req).then((r) => r || caches.match('./'))))
  }
})
