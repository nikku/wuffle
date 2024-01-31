import AVATAR_SVG from './avatar.svg';

const CACHE = 'wuffle-cache-v1';

function precache() {
  return caches.open(CACHE).then(function(cache) {
    return cache.addAll([
      '/board',
      '/board/apple-touch-icon.png',
      '/board/bundle.css',
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

function cacheResponse(event, request, response) {

  // only cache http(s) resources
  if (!/^https?:/.test(request.url)) {
    return;
  }

  return caches.open(CACHE).then(cache => {

    if (!event.clientId) {
      cache.put(request, response);

      return;
    }

    /* global clients */
    return clients.get(event.clientId).then(client => {

      return cache.match(request).then(matchingResponse => {

        if (matchingResponse) {

          const oldEtag = matchingResponse.headers.get('ETag');
          const newEtag = response.headers.get('ETag');

          if (oldEtag !== newEtag) {
            client.postMessage({
              message: 'resource.changed',
              url: request.url
            });
          }
        }

        cache.put(request, response);
      });
    });
  });
}

function fromNetwork(event, request) {

  return fetch(request).then(response => {

    if (response && response.status === 200) {
      const cachedResponse = response.clone();

      event.waitUntil(
        cacheResponse(event, request, cachedResponse)
      );
    }

    return response;
  });
}

function serveFallbackAvatar() {
  return Promise.resolve(new Response(AVATAR_SVG, {
    headers: {
      'Content-Type': 'image/svg+xml'
    }
  }));
}

function fromCache(event, request) {
  return caches.open(CACHE).then(cache => {
    return cache.match(request).then(matching => {
      return matching || Promise.reject('not-in-cache');
    });
  });
}

self.addEventListener('install', event => {
  event.waitUntil(
    precache()
  );

  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

// actual fetching logic ////////////

self.addEventListener('fetch', function(event) {

  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
    return;
  }

  const { request } = event;

  const { url } = request;

  if (/^https:\/\/avatars[\d]+\.githubusercontent\.com/.test(url)) {
    event.respondWith(
      fromCache(event, request)
        .catch(() => fromNetwork(event, request))
        .catch(() => serveFallbackAvatar())
    );

    return;
  }

  if (/\/probot\//.test(url)) {
    return;
  }

  if (/\/board\?.*$/.test(url)) {

    const cachedRequest = new Request('/board');

    const remoteFetch = fromNetwork(event, cachedRequest);

    event.respondWith(
      fromCache(event, cachedRequest)
        .catch(() => remoteFetch)
    );

    event.waitUntil(remoteFetch);

    return;
  }

  if (!/\/wuffle\/.*/.test(url) || /\/wuffle\/board$/.test(url)) {
    const remoteFetch = fromNetwork(event, request);

    event.respondWith(
      fromCache(event, request)
        .catch(() => remoteFetch)
    );

    event.waitUntil(remoteFetch);

    return;
  }
});