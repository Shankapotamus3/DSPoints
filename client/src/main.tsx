import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force unregister all service workers to fix login issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('Service Worker unregistered successfully');
        }
      });
    }
  });
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
        console.log('Cache cleared:', cacheName);
      });
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
