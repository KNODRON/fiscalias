// sw.js — PWA Fiscales RM (GitHub Pages friendly)
const CACHE_NAME = 'pwa-fiscales-v5';
const ASSETS = [
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json',
  // agrega otros assets si lo deseas
];

// === INSTALACIÓN ===
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(ASSETS.map(url =>
        cache.add(new Request(url, { cache: 'reload' }))
      ));
    })
  );

  // Permite que el SW nuevo pase a "waiting"
  self.skipWaiting();
});

// === ACTIVACIÓN ===
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
      );
      await self.clients.claim();
    })()
  );
});

// === COMUNICACIÓN: permitir skip-waiting manual ===
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// === DETECTAR ACTUALIZACIONES ===
// Cuando este SW pasa a "waiting", significa que hay una versión nueva
self.addEventListener('install', () => {
  // Nada más, queda en waiting
});

// Avisar a los clientes que hay una actualización disponible
self.addEventListener('activate', () => {
  notifyClients('update-available');
});

// Función para enviar mensaje
function notifyClients(msg) {
  self.clients.matchAll().then((clients) => {
    clients.forEach(client => client.postMessage(msg));
  });
}

// === FETCH: Mantener tu comportamiento original ===
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;

  // Navegación → network-first
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put('index.html', fresh.clone());
          return fresh;
        } catch (e) {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match('index.html');
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Archivos estáticos → stale-while-revalidate
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            cache.put(req, res.clone());
          }
          return res;
        })
        .catch(() => null);

      return cached || fetchPromise || new Response('', { status: 504 });
    })()
  );
});
