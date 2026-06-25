const CACHE = 'finanzas-v19';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',e=>{const url=e.request.url;if(url.includes('.html')||url.includes('.js')){e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));return;}e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
