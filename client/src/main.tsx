import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  // Unregister existing service workers to ensure fresh load
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
      console.log('PWA: Unregistered old service worker');
    }
  });

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
                  // New version available - auto-update instead of prompting
                  console.log('PWA: New version available, updating automatically');
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
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

createRoot(document.getElementById("root")!).render(<App />);
