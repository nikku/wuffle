import {
  debounce
} from 'min-dash';

import Taskboard from './Taskboard.svelte';

console.timeEnd('Wuffle#load');

console.time('Taskboard#create');

const taskboard = new Taskboard({
  target: document.body
});

console.timeEnd('Taskboard#create');

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

export default taskboard;