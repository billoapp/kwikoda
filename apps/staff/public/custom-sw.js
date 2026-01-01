// Enhanced Service Worker for Tabeza Staff App
// Provides offline functionality and caching strategies

const CACHE_NAME = 'tabeza-staff-v1';
const OFFLINE_CACHE = 'tabeza-offline-v1';
const STATIC_CACHE = 'tabeza-static-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/favicon.ico',
  '/logo-192.png',
  '/logo-512.png',
  '/logo.png',
  '/logo-white.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing staff service worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching staff static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Staff static assets cached successfully');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating staff service worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== OFFLINE_CACHE) {
              console.log('[SW] Deleting old staff cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Staff service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests (except for API calls we want to cache)
  if (url.origin !== location.origin && !url.pathname.includes('/api/')) return;

  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Cache hit - return cached response
        if (response) {
          console.log('[SW] Staff cache hit:', request.url);
          return response;
        }

        // Cache miss - try network
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Cache successful responses
            console.log('[SW] Caching new staff response:', request.url);
            
            // Clone response since it can only be used once
            const responseToCache = networkResponse.clone();
            
            caches.open(STATIC_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.log('[SW] Staff network failed, trying offline fallback:', request.url);
            
            // If it's a navigation request, serve offline page
            if (request.mode === 'navigate') {
              return caches.match('/offline');
            }
            
            // For API requests, return offline response
            if (url.pathname.includes('/api/')) {
              return new Response(
                JSON.stringify({ 
                  error: 'Offline', 
                  message: 'No internet connection. Please check your network and try again.',
                  offline: true 
                }),
                { 
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            }
            
            // For other requests, try to find a cached alternative
            return caches.match(request)
              .then((cachedResponse) => {
                if (cachedResponse) {
                  return cachedResponse;
                }
                
                // Return a basic offline response for images
                if (request.destination === 'image') {
                  return new Response(
                    '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280">Offline</text></svg>',
                    { headers: { 'Content-Type': 'image/svg+xml' } }
                  );
                }
                
                // Return offline page for other requests
                return caches.match('/offline');
              });
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'staff-background-sync') {
    console.log('[SW] Staff background sync triggered');
    event.waitUntil(doStaffBackgroundSync());
  }
});

// Push notifications for staff
self.addEventListener('push', (event) => {
  console.log('[SW] Staff push message received');
  
  const options = {
    body: event.data ? event.data.text() : 'New staff notification from Tabeza',
    icon: '/logo-192.png',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/logo-192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/favicon.ico'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Tabeza Staff', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Staff notification click received');
  
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync function
async function doStaffBackgroundSync() {
  console.log('[SW] Performing staff background sync');
  
  // Future: Sync offline orders, tab updates, etc.
  return Promise.resolve();
}

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Staff service worker loaded successfully');
