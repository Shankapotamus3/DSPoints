// Enhanced Service Worker for PWA with caching and push notifications
const CACHE_NAME = 'chore-rewards-v3';
const STATIC_CACHE_NAME = 'chore-rewards-static-v3';
const DYNAMIC_CACHE_NAME = 'chore-rewards-dynamic-v3';

// Assets to cache on install - only essential files that exist in production
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-192x192.svg',
  '/icon-512x512.svg'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/chores',
  '/api/rewards',
  '/api/family',
  '/api/notifications'
];

// Install event - cache static assets with error handling
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        console.log('Service Worker: Caching static assets');
        try {
          // Try to cache essential files, but don't fail installation if some are missing
          const cachePromises = STATIC_ASSETS.map(async (asset) => {
            try {
              const response = await fetch(asset);
              if (response.ok) {
                await cache.put(asset, response);
                console.log('Service Worker: Cached asset:', asset);
              } else {
                console.warn('Service Worker: Failed to cache asset (not found):', asset);
              }
            } catch (error) {
              console.warn('Service Worker: Failed to cache asset:', asset, error);
            }
          });
          await Promise.all(cachePromises);
        } catch (error) {
          console.warn('Service Worker: Some assets failed to cache, but installation continues:', error);
        }
      }),
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Dynamic cache ready');
        return cache;
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('Service Worker: Installation failed:', error);
      // Still allow installation to proceed
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Cache cleanup complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle static assets with cache-first strategy
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
    return;
  }

  // Handle API requests with network-first strategy
  if (isAPIRequest(url)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Default: try network first, then cache
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Cache-first strategy for static assets
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Serving from cache:', request.url);
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('Service Worker: Cached new asset:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Cache-first failed:', error);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline content not available', { status: 503 });
  }
}

// Network-first strategy for dynamic content
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('Service Worker: Updated cache for:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for API requests
    if (isAPIRequest(new URL(request.url))) {
      return new Response(JSON.stringify({ 
        error: 'Offline', 
        message: 'This feature is not available offline' 
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Helper functions
function isStaticAsset(url) {
  const pathname = url.pathname;
  return pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico)$/) ||
         pathname === '/' ||
         pathname === '/index.html' ||
         pathname === '/manifest.json';
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync event:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Handle any queued offline actions here
    console.log('Service Worker: Processing background sync');
    
    // Example: sync offline chore completions
    const offlineActions = await getOfflineActions();
    for (const action of offlineActions) {
      await processOfflineAction(action);
    }
    
    await clearOfflineActions();
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

async function getOfflineActions() {
  try {
    const db = await openIndexedDB();
    // Return queued offline actions
    return [];
  } catch (error) {
    console.error('Service Worker: Failed to get offline actions:', error);
    return [];
  }
}

async function processOfflineAction(action) {
  try {
    await fetch(action.url, {
      method: action.method,
      headers: action.headers,
      body: JSON.stringify(action.data)
    });
    console.log('Service Worker: Processed offline action:', action);
  } catch (error) {
    console.error('Service Worker: Failed to process offline action:', error);
    throw error;
  }
}

async function clearOfflineActions() {
  console.log('Service Worker: Cleared offline actions');
}

async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ChoreRewardsDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineActions')) {
        db.createObjectStore('offlineActions', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Push notification handling (existing functionality)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received', event);
  
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const title = data.title || 'ChoreRewards';
  
  let actions = [];
  if (data.type === 'chore_completed') {
    actions = [{
      action: 'view',
      title: 'View Chores'
    }];
  } else if (data.type === 'new_message') {
    actions = [{
      action: 'view',
      title: 'View Message'
    }];
  }
  
  const options = {
    body: data.message || 'You have a new notification',
    icon: '/icon-192x192.svg',
    badge: '/icon-192x192.svg',
    tag: data.choreId || data.type || 'general',
    requireInteraction: data.type === 'chore_completed' || data.type === 'new_message',
    data: data,
    actions: actions
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event (existing functionality)
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();

  const notificationData = event.notification.data;
  let targetUrl = '/';
  
  // Navigate to appropriate page based on notification type
  if (notificationData && notificationData.type === 'new_message') {
    targetUrl = '/messages';
  } else if (notificationData && notificationData.type === 'chore_completed') {
    targetUrl = '/chores';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Check if there's already a window open
      for (const client of clients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          // Navigate to target URL and focus
          client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          return client.focus();
        }
      }
      // If no window is open, open a new one
      return self.clients.openWindow(targetUrl);
    })
  );
});

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});