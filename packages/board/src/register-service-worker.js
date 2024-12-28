import {
  debounce
} from 'min-dash';


export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {

    const triggerReload = debounce(() => {
      window.location.reload();
    }, 1500);

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch((err) => {
        console.warn('Failed to register service worker', err);
      });

      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.message === 'resource.changed') {
          console.log('Resource changed', event.data.url);

          triggerReload();
        }
      });
    });
  }
}
