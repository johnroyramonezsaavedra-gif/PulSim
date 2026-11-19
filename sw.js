// PulSim service worker: network-first, so updates show up as soon as you are online.
// Falls back to the saved copy when offline. Bump VERSION to force a cache reset.
const VERSION = 'pulsim-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
const THREE = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(CORE);
    try { await c.add(THREE); } catch (_) {}
  }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin && url.href !== THREE) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
  );
});
