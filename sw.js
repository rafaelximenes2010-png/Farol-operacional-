// Farol Operacional — service worker
// Rede primeiro para o app (recebe as atualizações na hora) e cópia guardada para abrir sem internet.
const CACHE="farol-v32"; const APP=["./","index.html","instalar.html","icons/qr-instalar.svg","parser.js","pacote.js","vendor/jspdf.umd.min.js","vendor/html2canvas.min.js","vendor/pdf.min.mjs","vendor/pdf.worker.min.mjs","manifest.webmanifest","icons/icon-192-v2.png","icons/icon-512-v2.png","icons/apple-touch-v2.png","icons/logo-los.png","icons/simbolo-los.png","icons/icone-96.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET"||u.origin!==location.origin)return;
  const pesado=/\/vendor\//.test(u.pathname);
  if(pesado){e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));return;}
  e.respondWith(fetch(u.href,{cache:"no-cache"}).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));}return r;})
    .catch(()=>caches.match(e.request,{ignoreSearch:true})));});
