import Taskboard from './Taskboard.svelte';

const taskboard = new Taskboard({
  target: document.body
});


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((err) => {
      console.warn('Failed to register service worker', err);
    });
  });
}

export default taskboard;