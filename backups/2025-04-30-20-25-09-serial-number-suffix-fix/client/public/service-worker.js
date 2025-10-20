// Service Worker for StoneWhistle Workshop App
const CACHE_NAME = 'stonewhistle-workshop-v1';

// Application shell files to be cached
const APP_SHELL = [
  '/',
  '/index.html',
  '/src/index.css',
  '/src/main.tsx',
  '/src/App.tsx',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/apple-icon-180.png',
  '/icons/apple-icon-167.png',
  '/icons/maskable-icon.png',
  '/icons/apple-splash-2048-2732.jpg',
  '/icons/apple-splash-1668-2388.jpg',
  '/icons/apple-splash-1536-2048.jpg',
  '/icons/apple-splash-1242-2688.jpg',
  '/icons/apple-splash-1125-2436.jpg',
  '/icons/apple-splash-828-1792.jpg',
];

// Install service worker and cache app shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching App Shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting on install');
        return self.skipWaiting();
      })
  );
});

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Serve from cache, then network with cache update
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // For API requests, use network-first strategy
  if (event.request.url.includes('/api/')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }

  // For other requests, use cache-first strategy
  event.respondWith(cacheFirstStrategy(event.request));
});

// Network-first strategy for API requests
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, try from cache
    console.log('[Service Worker] Network request failed, getting from cache', request.url);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response(JSON.stringify({ 
      error: 'You are offline and this data is not available in cache.'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Updated cache-first strategy with network refresh
async function cacheFirstStrategy(request) {
  // Always fetch from network for HTML files to ensure updates appear
  if (request.url.endsWith('.html') || request.url.endsWith('/') || 
      request.url.includes('settings') || request.url.includes('/src/')) {
    try {
      console.log('[Service Worker] Always checking network first for:', request.url);
      const networkResponse = await fetch(request);
      
      if (networkResponse && networkResponse.status === 200) {
        // Cache the fresh response
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
    } catch (error) {
      // Network failed, fall back to cache
      console.log('[Service Worker] Network failed for critical resource:', request.url);
    }
  }

  // Try cache first for non-critical resources
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Return cached response but refresh cache in background
    const refreshCache = async () => {
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, networkResponse);
          console.log('[Service Worker] Updated cache for:', request.url);
        }
      } catch (e) {
        console.log('[Service Worker] Background refresh failed for:', request.url);
      }
    };
    
    // Don't await this - let it update in background
    refreshCache();
    
    return cachedResponse;
  }
  
  try {
    // If not in cache, get from network
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      // Cache the new response
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If both cache and network fail
    console.error('[Service Worker] Both cache and network failed for', request.url);
    return new Response('Network and cache both failed.', { status: 408 });
  }
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});