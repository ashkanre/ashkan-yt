const CACHE_NAME = "ashkan-yt-shell-v8";
const CORE = ["./", "./index.html", "./manifest.json", "./icon.svg"];

async function putIfGood(cache, request, response) {
  if (response && response.ok) {
    try { await cache.put(request, response.clone()); } catch (e) {}
  }
  return response;
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
      event.waitUntil(
        fetch(request)
          .then(response => putIfGood(cache, request.mode === "navigate" ? "./index.html" : request, response))
          .catch(() => null)
      );
      return cached;
    }

    try {
      const response = await fetch(request);
      return await putIfGood(cache, request.mode === "navigate" ? "./index.html" : request, response);
    } catch (e) {
      if (request.mode === "navigate") return cache.match("./index.html");
      throw e;
    }
  })());
});
