const CACHE = “stadbook-v3”;

self.addEventListener(“install”, function(e) {
e.waitUntil(
caches.open(CACHE).then(function(cache) {
return cache.addAll([
“/StadBook/”,
“/StadBook/index.html”,
“/StadBook/manifest.json”,
“/StadBook/icon.svg”,
“/StadBook/apple-touch-icon.png”
]);
}).then(function() {
return self.skipWaiting();
})
);
});

self.addEventListener(“activate”, function(e) {
e.waitUntil(
caches.keys().then(function(keys) {
return Promise.all(
keys.filter(function(k) { return k !== CACHE; })
.map(function(k) { return caches.delete(k); })
);
}).then(function() {
return self.clients.claim();
})
);
});

self.addEventListener(“fetch”, function(e) {
if (e.request.method !== “GET”) return;
var url = e.request.url;

// Never intercept Firebase API calls - they need network
if (url.indexOf(“firestore.googleapis.com”) >= 0) return;
if (url.indexOf(“identitytoolkit.googleapis.com”) >= 0) return;
if (url.indexOf(“securetoken.googleapis.com”) >= 0) return;
if (url.indexOf(“firebase”) >= 0 && url.indexOf(“googleapis.com”) >= 0) return;

e.respondWith(
caches.open(CACHE).then(function(cache) {
return cache.match(e.request).then(function(cached) {
// Try network first for CDN scripts so they stay fresh
var fetchPromise = fetch(e.request).then(function(response) {
if (response && response.status === 200) {
cache.put(e.request, response.clone());
}
return response;
}).catch(function() {
// Network failed - return cache if available
return cached || caches.match(”/StadBook/index.html”);
});

```
    // Return cached immediately if available, update in background
    return cached || fetchPromise;
  });
})
```

);
});
