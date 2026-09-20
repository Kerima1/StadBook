const CACHE = "stadbook-v6";
const SHELL = [
  "./",
  "index.html",
  "manifest.json",
  "icon.svg",
  "apple-touch-icon.png"
];

self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return Promise.all(
        SHELL.map(function(url) {
          return c.add(url).catch(function() {});
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e) {
  if (e.request.method !== "GET") return;
  var url = e.request.url;
  if (url.indexOf("firestore.googleapis.com") >= 0) return;
  if (url.indexOf("identitytoolkit.googleapis.com") >= 0) return;
  if (url.indexOf("securetoken.googleapis.com") >= 0) return;

  e.respondWith(
    fetch(e.request).then(function(response) {
      // CDN scripts (React/Firebase/Babel) load without CORS permission, so
      // the browser reports them as "opaque" instead of status 200 — even
      // though they loaded fine. Without this check, they never get cached.
      if (response && (response.status === 200 || response.type === "opaque")) {
        var clone = response.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
      }
      return response;
    }).catch(function() {
      return caches.match(e.request).then(function(cached) {
        return cached || caches.match("index.html");
      });
    })
  );
});
