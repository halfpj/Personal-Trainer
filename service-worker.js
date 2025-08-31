// This service worker handles caching of the application shell (HTML, CSS, JS, manifest, icons).
// Dynamic, user-specific data from the AI (like workout plans and exercise details) is
// handled at the application level using localStorage. This provides more granular
// control and avoids the complexities of caching POST requests in a service worker.

const CACHE_NAME = 'ai-trainer-cache-v2'; // Bumped version
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png', // Added icon for pre-caching
  '/icon-512x512.png'  // Added icon for pre-caching
];

// Install event: open cache and add app shell files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event: serve from cache first, then network for app shell assets
self.addEventListener('fetch', event => {
  // Always fetch API calls from the network, do not cache.
  if (event.request.url.includes('googleapis.com')) {
    return fetch(event.request);
  }

  // For all other requests, use a cache-first strategy.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache, fetch from network
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 && networkResponse.type !== 'opaque') {
              return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
          // This will be triggered if the network is unavailable.
          // For app shell files, this is okay if they are already cached.
          // For other dynamic content, the app itself handles the offline state.
          console.error('Fetching failed:', error);
          throw error;
        });
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});