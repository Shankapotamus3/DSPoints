import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Clear all service worker caches and force unregister
if ('serviceWorker' in navigator) {
  // Unregister all service workers
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    if (registrations.length > 0) {
      console.log(`Unregistering ${registrations.length} service worker(s)...`);
      registrations.forEach(registration => {
        registration.unregister().then(() => {
          console.log('Service Worker unregistered');
        });
      });
    }
  });
}

// Clear ALL caches
if ('caches' in window) {
  caches.keys().then((cacheNames) => {
    if (cacheNames.length > 0) {
      console.log(`Clearing ${cacheNames.length} cache(s)...`);
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName).then(() => {
          console.log('Cache cleared:', cacheName);
        });
      });
    }
  });
}

console.log('Service Worker cleanup initiated');

createRoot(document.getElementById("root")!).render(<App />);
