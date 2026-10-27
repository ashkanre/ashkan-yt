const CACHE_NAME = "ashkan-yt-shell-v12";
const CORE = ["./", "./index.html", "./manifest.json", "./icon.svg"];

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
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith("ashkan-yt-shell-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  const key = request.mode === "navigate" ? "./index.html" : request;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(key);

    if (cached) {
      if (request.mode === "navigate") {
        event.waitUntil(
          fetch(request)
            .then(response => response.ok ? cache.put("./index.html", response.clone()) : null)
            .catch(() => null)
        );
      }
      return cached;
    }

    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(key, response.clone());
      return response;
    } catch (error) {
      if (request.mode === "navigate") {
        return (await cache.match("./index.html")) || (await cache.match("./"));
      }
      throw error;
    }
  })());
});
