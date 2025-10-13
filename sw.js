const CACHE_NAME = 'pwa-fiscalias-v3';
const FILES_TO_CACHE = ['/', '/index.html', '/manifest.json', '/styles.css', '/app.js'];
self.addEventListener('install', (evt) => { evt.waitUntil(caches.open(CACHE_NAME).then((cache)=> cache.addAll(FILES_TO_CACHE))); self.skipWaiting();});
self.addEventListener('activate', (evt)=>{ evt.waitUntil(clients.claim());});
self.addEventListener('fetch', (evt)=>{ evt.respondWith(caches.match(evt.request).then(resp => resp || fetch(evt.request)));});
