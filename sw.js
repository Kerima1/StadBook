// StadBook Service Worker — Offline PWA
const CACHE_NAME = “stadbook-v1”;

// Files to cache for offline use
const STATIC_ASSETS = [
“/StadBook/”,
“/StadBook/index.html”,
“/StadBook/manifest.json”,
“/StadBook/icon.svg”,
“/StadBook/apple-touch-icon.png”,
“https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js”,
“https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js”,
“https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js”,
“https://unpkg.com/react@18/umd/react.production.min.js”,
“https://unpkg.com/react-dom@18/umd/react-dom.production.min.js”,
“https://unpkg.com/@babel/standalone/babel.min.js”,
“https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Cairo:wght@400;600;700;800;900&display=swap”,
];

// Install: cache all static assets
self.addEventListener(“install”, function (event) {
event.waitUntil(
caches.open(CACHE_NAME).then(function (cache) {
return cache.addAll(STATIC_ASSETS).catch(function (err) {
// Some CDN files may fail to cache — that’s okay
console.log(“StadBook SW: some assets could not be cached”, err);
});
})
);
self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener(“activate”, function (event) {
event.waitUntil(
caches.keys().then(function (keys) {
return Promise.all(
keys
.filter(function (key) {
return key !== CACHE_NAME;
})
.map(function (key) {
return caches.delete(key);
})
);
})
);
self.clients.claim();
});

// Fetch: serve from cache first, fall back to network
self.addEventListener(“fetch”, function (event) {
// Skip non-GET requests and Firebase API calls (those need network)
if (event.request.method !== “GET”) return;
if (event.request.url.includes(“firestore.googleapis.com”)) return;
if (event.request.url.includes(“identitytoolkit.googleapis.com”)) return;
if (event.request.url.includes(“securetoken.googleapis.com”)) return;

event.respondWith(
caches.match(event.request).then(function (cached) {
if (cached) {
// Return cached version and update in background
fetch(event.request)
.then(function (response) {
if (response && response.status === 200) {
caches.open(CACHE_NAME).then(function (cache) {
cache.put(event.request, response);
});
}
})
.catch(function () {});
return cached;
}
// Not in cache — try network
return fetch(event.request)
.then(function (response) {
if (response && response.status === 200) {
const clone = response.clone();
caches.open(CACHE_NAME).then(function (cache) {
cache.put(event.request, clone);
});
}
return response;
})
.catch(function () {
// Offline and not cached — return the main app page
return caches.match(”/StadBook/index.html”);
});
})
);
});