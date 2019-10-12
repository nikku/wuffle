import AVATAR_SVG from './avatar.svg';

const CACHE = 'wuffle-cache-v1';

function precache() {
  return caches.open(CACHE).then(function(cache) {
    return cache.addAll([
      '/board',
      '/board/bundle.css',
      '/board/bundle.css.map',
      '/board/bundle.js',
      '/board/bundle.js.map',
      '/board/favicon.png',
      '/board/global.css',
      '/board/logo-192.png',
      '/board/logo-512.png',
      '/board/logo.svg',
      '/board/manifest.json'
    ]).catch(err => console.error('caching failed', err));
  });
}

function fromNetwork(request) {
  return caches.open(CACHE).then(cache => {
    return fetch(request).then(response => {

      if (response.ok && response.status < 400) {
        cache.put(request, response);
      }

      return response;
    });
  });
}

function serveFallbackAvatar() {
  return Promise.resolve(new Response(AVATAR_SVG, {
    headers: {
      'Content-Type': 'image/svg+xml'
    }
  }));
}

function fromCache(request) {
  return caches.open(CACHE).then(cache => {
    return cache.match(request).then(matching => {
      return matching || Promise.reject('not-in-cache');
    });
  });
}

self.addEventListener('install', event => {
  event.waitUntil(precache().then(() => {
    return self.skipWaiting();
  }));
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

// actual fetching logic ////////////

self.addEventListener('fetch', function(event) {

  const { request } = event;

  const { url } = request;

  if (/^https:\/\/avatars[\d]+\.githubusercontent\.com/.test(url)) {
    event.respondWith(
      fromCache(request).catch(() => fromNetwork(request)).catch(() => serveFallbackAvatar())
    );

    return;
  }

  if (!/\/wuffle\/.*/.test(url)) {
    const remoteFetch = fromNetwork(request);

    event.respondWith(
      fromCache(request).catch(() => remoteFetch)
    );

    event.waitUntil(remoteFetch);

    return;
  }
});