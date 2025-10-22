// sw.js — PWA Fiscales RM (GitHub Pages friendly)
const CACHE_NAME = 'pwa-fiscales-v4';
const ASSETS = [
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json',
  // agrega aquí otros assets si los tienes (por ejemplo, icons si quieres precachearlos)
  // 'icons/icon-192.png',
  // 'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // evita servir desde caché HTTP del navegador al precachear
      await Promise.all(ASSETS.map(url => cache.add(new Request(url, { cache: 'reload' }))));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // borra caches viejos
      const keys = await caches.keys();
      await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
      await self.clients.claim();
    })()
  );
});

// Permite activar el SW nuevo sin tener que cerrar pestañas
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Sólo GET
  if (req.method !== 'GET') return;

  // 1) Navegación (documentos HTML): network-first con fallback a cache (index.html)
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          // opcional: actualiza copia de index.html
          const cache = await caches.open(CACHE_NAME);
          cache.put('index.html', fresh.clone());
          return fresh;
        } catch (e) {
          // offline → devuelve index.html si está cacheado
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match('index.html');
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // 2) Archivos estáticos (css/js/json/png/svg/etc): stale-while-revalidate
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then((res) => {
        // guarda sólo respuestas válidas
        if (res && res.status === 200 && res.type === 'basic') {
          cache.put(req, res.clone());
        }
        return res;
      }).catch(() => null);

      // sirve cache inmediato y luego se revalida en background
      return cached || fetchPromise || new Response('', { status: 504 });
    })()
  );
});
