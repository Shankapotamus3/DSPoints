import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// TEMPORARILY DISABLED: Register service worker for PWA functionality
// The service worker is caching auth responses, preventing login from working
// TODO: Re-enable after fixing auth caching issues
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('PWA: Service Worker registered successfully');
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          console.log('PWA: New service worker version found');
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New version available
                  console.log('PWA: New version available, ready to update');
                  if (confirm('A new version of ChoreRewards is available. Update now?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                } else {
                  // First time installation
                  console.log('PWA: App cached for offline use');
                }
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.error('PWA: Service Worker registration failed:', registrationError);
      });

    // Listen for service worker controller changes (updates)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('PWA: Service Worker updated, reloading page');
      window.location.reload();
    });
  });
} else {
  console.warn('PWA: Service Worker not supported in this browser');
}
*/
console.log('Service Worker temporarily disabled for debugging');

createRoot(document.getElementById("root")!).render(<App />);
