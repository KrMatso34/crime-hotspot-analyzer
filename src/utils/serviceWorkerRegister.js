/**
 * Register and manage the Service Worker for PWA functionality
 */

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      '/service-worker.js',
      { scope: '/' }
    );

    console.log('✓ Service Worker registered successfully:', registration);

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'activated') {
          // New service worker is ready
          console.log('✓ New Service Worker activated');
          
          // Notify user about update if desired
          if (window.confirm('A new version of Safety Router is available. Refresh to update?')) {
            window.location.reload();
          }
        }
      });
    });

    // Handle controller change
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('Service Worker controller changed - app updated');
      }
    });

    return registration;
  } catch (error) {
    console.error('✗ Service Worker registration failed:', error);
    return null;
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
  }
}

export function requestPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
