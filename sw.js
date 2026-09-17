const CACHE_NAME = 'finanzapp-v2';

// Todos los archivos de tu árbol de proyecto
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/pollito-assistant.png',
  './styles/main.css',
  './js/app.js',
  './js/supabaseClient.js',
  './js/transacciones.js',
  './js/UI.js',
  './components/form.html',
  './components/list.html',
  './components/sidebar.html',
  './components/stats.html',
  './components/topbar.html'
];

const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  'https://unpkg.com/@phosphor-icons/web'
];

// Instalación: Carga de archivos críticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(LOCAL_ASSETS);
      await Promise.allSettled(
        EXTERNAL_ASSETS.map(url => cache.add(new Request(url, { mode: 'no-cors' })))
      );
    })
  );
  self.skipWaiting();
});

// Activación: Limpieza de versión v1
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Manejo de peticiones de red
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorar API Supabase para no cachear datos dinámicos
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Sin conexión a la red. No se pudieron actualizar los datos.' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Estrategia Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});