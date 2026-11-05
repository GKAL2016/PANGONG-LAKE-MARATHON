// Pangong Lake Marathon - Service Worker v1.0 - 05_11_2026
// Stale-while-revalidate: opens instantly offline, picks up new versions on the next open.
const CACHE_NAME = 'pangong-v1.0';
const PREFIX = 'pangong';
const SHELL = ['./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
const EXTRA = [
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) =>
    cache.addAll(SHELL).then(() => Promise.all(EXTRA.map((u) => cache.add(u).catch(() => null))))
  ));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(
    names.filter((n) => n.startsWith(PREFIX) && n !== CACHE_NAME).map((n) => caches.delete(n))
  )));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = req.url;
  // Let Firestore's own traffic go straight to the network.
  if (url.includes('firestore.googleapis.com') || url.includes('googleapis.com/google.firestore')) return;
  event.respondWith(caches.open(CACHE_NAME).then((cache) =>
    cache.match(req).then((cached) => {
      const fresh = fetch(req).then((resp) => { if (resp && (resp.ok || resp.type === 'opaque')) cache.put(req, resp.clone()); return resp; }).catch(() => cached);
      return cached || fresh;
    })
  ));
});
