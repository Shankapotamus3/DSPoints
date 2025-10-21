import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register the Service Worker reset script to clear cached version
if ('serviceWorker' in navigator) {
  console.log('[App] Registering Service Worker reset script...');
  
  // Listen for completion message
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SW_RESET_COMPLETE') {
      console.log('[App] Service Worker reset complete - reloading page...');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  });
  
  // Register the reset script (this will override any cached Service Worker)
  navigator.serviceWorker.register('/sw-reset.js?v=' + Date.now(), {
    updateViaCache: 'none'
  }).then((registration) => {
    console.log('[App] Reset script registered successfully');
    
    // Force update to bypass any caching
    registration.update();
  }).catch((error) => {
    console.error('[App] Failed to register reset script:', error);
  });
} else {
  console.log('[App] Service Workers not supported');
}

createRoot(document.getElementById("root")!).render(<App />);
