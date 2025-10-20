import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Workbox } from 'workbox-window';

// Create the root element
createRoot(document.getElementById("root")!).render(<App />);

// Register the service worker for production and development for better testing
if ('serviceWorker' in navigator) {
  const wb = new Workbox('/service-worker.js');
  
  // Add event listeners for service worker lifecycle
  wb.addEventListener('installed', (event) => {
    if (event.isUpdate) {
      // If it's an update, show a notification to the user
      console.log('New version available! Reload to update.');
      // Force page reload to apply updates immediately
      window.location.reload();
    } else {
      console.log('App is ready for offline use.');
    }
  });
  
  wb.addEventListener('waiting', () => {
    // When a new service worker is waiting
    console.log('New service worker is waiting to activate.');
    
    // Force the waiting service worker to become active
    wb.messageSkipWaiting();
  });
  
  wb.addEventListener('controlling', () => {
    // A new service worker has taken control
    console.log('New service worker is controlling the page.');
    
    // Reload the page to ensure all assets come from the new service worker
    window.location.reload();
  });
  
  wb.addEventListener('activated', (event) => {
    if (event.isUpdate) {
      console.log('New service worker activated.');
      // Reload to ensure we're using the fresh content
      window.location.reload();
    }
  });
  
  // Register the service worker
  wb.register();
  
  // Handle online/offline status changes
  window.addEventListener('online', () => {
    console.log('App is online.');
    // Opmerking: We synchroniseren niet automatisch meer bij online gaan
    // Dit gebeurt alleen bij app opstart en handmatige synchronisatie
  });
  
  window.addEventListener('offline', () => {
    console.log('App is offline. Changes will be synced when connection returns.');
    // Could show a notification to the user here
  });
}
