// Farol Operacional — service worker
// Rede primeiro para o app (recebe as atualizações na hora) e cópia guardada para abrir sem internet.
const CACHE="farol-v73"; const APP=["./","index.html","instalar.html","icons/qr-instalar.svg","icons/convite-instalar.png","parser.js","pacote.js","seguranca.js","vendor/jspdf.umd.min.js","vendor/html2canvas.min.js","vendor/pdf.min.mjs","vendor/pdf.worker.min.mjs","manifest.webmanifest","icons/icon-192-v2.png","icons/icon-512-v2.png","icons/apple-touch-v2.png","icons/logo-los.png","icons/simbolo-los.png","icons/icone-96.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET"||u.origin!==location.origin)return;
  const pesado=/\/vendor\//.test(u.pathname);
  if(pesado){e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));return;}
  e.respondWith(fetch(u.href,{cache:"no-cache"}).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));}return r;})
    .catch(()=>caches.match(e.request,{ignoreSearch:true})));});
importScripts("seguranca.js");
// DDS do dia em segundo plano (Android/Chrome com o app instalado)
self.addEventListener("periodicsync",e=>{if(e.tag!=="farol-dds")return;e.waitUntil((async()=>{try{const d=new Date(),s=FarolSeg.slotAtual(d);if(s<0)return;let api=null;try{api=await (await fetch("data/seguranca.json?t="+Date.now(),{cache:"no-store"})).json();}catch(x){}const a=FarolSeg.aviso(d,s,api);
  const c=await caches.open("farol-dds");const v=await c.match("visto");if(v&&(await v.text())===a.chave)return;await c.put("visto",new Response(a.chave));
  await self.registration.showNotification("🦺 "+a.titulo,{body:a.texto+(a.fonte?"\nFonte: "+a.fonte+" · "+(a.contexto||""):""),icon:"icons/icon-192-v2.png",badge:"icons/icone-96.png",tag:"dds-"+a.chave});}catch(x){}})());});
// alertas de mercado em segundo plano (Android/Chrome com o app instalado)
self.addEventListener("periodicsync",e=>{if(e.tag!=="farol-mercado")return;e.waitUntil((async()=>{try{
  const r=await fetch("data/alertas-mercado.json?t="+Date.now(),{cache:"no-store"});const al=(await r.json()).alertas||[];
  const c=await caches.open("farol-alm");const v=await c.match("vistos");const vis=v?await v.json():null;
  if(vis){al.filter(a=>!vis.includes(a.id)&&a.nivel==="importante").slice(0,3).forEach(a=>self.registration.showNotification("Farol · Mercado",{body:a.titulo+" — "+a.texto,icon:"icons/icon-192-v2.png",tag:a.id}));}
  await c.put("vistos",new Response(JSON.stringify(al.map(a=>a.id))));}catch(x){}})());});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:"window"}).then(w=>w.length?w[0].focus():self.clients.openWindow("./")));});
