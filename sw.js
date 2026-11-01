/* ZID offline helper: keeps a copy of the site on the device so the app opens without a connection.
   Online, it always fetches the newest upload first, so updates show straight away.
   The shell (page, core script, fonts, the pictures on the first screen) is stored when the helper installs. Every
   other file of the site is stored the first time it's fetched, so after one game the game works offline too. */
const CACHE = 'zid-v22';
const CORE = [
  './', 'index.html', '404.html', 'manifest.json',
  'js/core.js',
  'fonts/press-start-2p.woff2', 'fonts/jersey-10.woff2', 'fonts/bricolage-grotesque.woff2', 'fonts/archivo.woff2', 'fonts/martian-mono.woff2', 'fonts/sedgwick-ave-display.woff2',
  'img/tagwall.webp', 'img/01.png', 'img/02.webp',
  'icon-192.png', 'icon-512.png', 'icon-maskable.png', 'apple-touch-icon.png',
];

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
  if (url.origin !== self.location.origin) return;   /* the scoreboard and analytics go straight to the network */
  e.respondWith(fetch(req)
    .then((res) => { if (res && res.ok) save(req, res); return res; })
    .catch(() => caches.match(req, { ignoreSearch: url.pathname.endsWith('.json') })
      .then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : null))
      .then((hit) => hit || Response.error())));
});
