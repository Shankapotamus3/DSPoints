// Basic Service Worker for Web Push Notifications
const CACHE_NAME = 'chore-rewards-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Claim clients immediately
  event.waitUntil(self.clients.claim());
});

// Push event for notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received', event);
  
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const title = data.title || 'ChoreRewards';
  const options = {
    body: data.message || 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.choreId || 'general',
    requireInteraction: data.type === 'chore_completed',
    data: data,
    actions: data.type === 'chore_completed' ? [
      {
        action: 'view',
        title: 'View Chores'
      }
    ] : []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();

  // Focus or open the app window
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      // If a client is already open, focus it
      if (clients.length > 0) {
        return clients[0].focus();
      }
      // Otherwise, open a new window
      return self.clients.openWindow('/');
    })
  );
});