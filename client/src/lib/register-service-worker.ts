/**
 * Registers a service worker for offline functionality and PWA support
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/service-worker.js';
      
      navigator.serviceWorker.register(swUrl)
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Check for updates on page reload
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New content is available, refresh to use it
                    console.log('New version of the app is available. Please refresh to update.');
                  } else {
                    // All content is cached for offline use
                    console.log('Content is cached for offline use.');
                  }
                }
              });
            }
          });
        })
        .catch(error => {
          console.error('Error during service worker registration:', error);
        });
    });
  }
}

// Handle service worker updates
export function handleServiceWorkerUpdates() {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // The service worker controller has changed, refresh the page to use the new version
    window.location.reload();
  });
}

// Allow manual update triggering
export function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.update();
      })
      .catch(error => {
        console.error('Error updating service worker:', error);
      });
  }
}