// Temporary: Force unregister this service worker to fix login issues
// This service worker will immediately unregister itself

self.addEventListener('install', (event) => {
  console.log('Service Worker: Immediately unregistering...');
  event.waitUntil(
    self.registration.unregister().then(() => {
      console.log('Service Worker: Unregistered successfully');
      return self.clients.matchAll();
    }).then((clients) => {
      clients.forEach(client => client.navigate(client.url));
    })
  );
});
