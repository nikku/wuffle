import Taskboard from './Taskboard.svelte';

console.timeEnd('Wuffle#load');

console.time('Taskboard#create');

const taskboard = new Taskboard({
  target: document.body
});

console.timeEnd('Taskboard#create');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((err) => {
      console.warn('Failed to register service worker', err);
    });
  });
}

export default taskboard;