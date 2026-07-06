const CACHE_NAME = 'tigerchef-cache-v2';
const NETWORK_FIRST_URLS = ['/index.html', '/'];
const CACHE_FIRST_URLS = [
  '/img/back.webp',
  '/img/bg.png',
  '/img/favicon.png',
  '/img/tc192.png',
  '/img/tc512.png',
  '/snd/deal.opus',
  '/snd/snap.opus',
  '/snd/plop.opus',
  '/snd/ding.opus',
  '/snd/music.mp3'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_FIRST_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (NETWORK_FIRST_URLS.includes(url.pathname)) {
    event.respondWith(networkFirst(event.request));
  } else if (CACHE_FIRST_URLS.includes(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
  } else {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
  }
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    throw new Error(`${request.url} not available offline`);
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;
  const response = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}
