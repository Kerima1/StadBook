const CACHE="stadbook-v2";
const SHELL=["/StadBook/","/StadBook/index.html","/StadBook/manifest.json","/StadBook/icon.svg","/StadBook/apple-touch-icon.png"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  const url=e.request.url;
  if(url.includes("firestore.googleapis.com")||url.includes("identitytoolkit")||url.includes("securetoken")) return;
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const net=fetch(e.request).then(res=>{
        if(res&&res.status===200&&res.type!=="opaque"){
          caches.open(CACHE).then(c=>c.put(e.request,res.clone()));
        }
        return res;
      }).catch(()=>cached||caches.match("/StadBook/index.html"));
      return cached||net;
    })
  );
});
