const CACHE = 'finanzas-v22';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',e=>{
  const url=e.request.url;
  if(url.includes('.html')||url.includes('.js')){
    e.respondWith(
      fetch(e.request).then(r=>{
        if(!r||!r.ok) return r;
        const rc=r.clone();
        caches.open(CACHE).then(c=>c.put(e.request,rc));
        return r;
      }).catch(()=>caches.match(e.request).then(r=>r||new Response('Offline',{status:503,headers:{'Content-Type':'text/plain'}})))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
      if(!res||!res.ok) return res;
      const rc=res.clone();
      caches.open(CACHE).then(c=>c.put(e.request,rc));
      return res;
    }))
  );
});
