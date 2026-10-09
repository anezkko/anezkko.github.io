/* ZID offline helper: keeps a copy of the site on the device so the app opens without a connection.
   Online, it always fetches the newest upload first, so updates show straight away. */
const CACHE = 'zid-v1';
const CORE = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-maskable.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE)
    .then((c) => Promise.all(CORE.map((u) => c.add(u).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const save = (req, res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); };

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin === self.location.origin) {
    e.respondWith(fetch(req)
      .then((res) => { if (res && res.ok) save(req, res); return res; })
      .catch(() => caches.match(req)
        .then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : null))
        .then((hit) => hit || Response.error())));
  } else if (font) {
    e.respondWith(caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => { if (res && (res.ok || res.type === 'opaque')) save(req, res); return res; })
        .catch(() => hit || Response.error());
      return hit || net;
    }));
  }
});
