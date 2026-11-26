// Farol Operacional — service worker
// Rede primeiro para o app (recebe as atualizações na hora) e cópia guardada para abrir sem internet.
const CACHE="farol-v139"; const APP=["./","index.html","instalar.html","icons/qr-instalar.svg","icons/convite-instalar.png","parser.js","revista.js","pacote.js","seguranca.js","vendor/jspdf.umd.min.js","vendor/html2canvas.min.js","vendor/pdf.min.mjs","vendor/pdf.worker.min.mjs","manifest.webmanifest","icons/icon-192-v2.png","icons/icon-512-v2.png","icons/apple-touch-v2.png","icons/logo-los.png","icons/marca-los.png","icons/simbolo-los-t.png","icons/simbolo-los.png","icons/icone-96.png"];
// instalação busca tudo direto do servidor (ignora cópias antigas do navegador) e assume na hora
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP.map(u=>new Request(u,{cache:"reload"})))));self.skipWaiting();});
// ao atualizar, apaga só as cópias antigas do próprio app (farol-vN); estados do usuário (avisos vistos, DDS, contador do ícone) ficam
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>/^farol-v\d+$/.test(x)&&x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim();});
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
// aviso para todos em segundo plano (Android/Chrome com o app instalado)
self.addEventListener("periodicsync",e=>{if(e.tag!=="farol-aviso")return;e.waitUntil((async()=>{try{
  const a=await (await fetch("data/aviso.json?t="+Date.now(),{cache:"no-store"})).json();if(!a||!a.id||(a.ate&&Date.now()>Date.parse(a.ate)))return;
  const c=await caches.open("farol-aviso");const v=await c.match("visto");if(v&&(await v.text())===a.id)return;await c.put("visto",new Response(a.id));
  await self.registration.showNotification(a.titulo,{body:a.texto||"",icon:"icons/icon-192-v2.png",badge:"icons/icone-96.png",tag:"aviso-"+a.id});await badgeMais();}catch(x){}})());});
// notificação com a tela bloqueada (Web Push, vem do Worker api/push-worker.js) + indicação no ícone do app
async function badgeMais(){try{const c=await caches.open("farol-badge");const r=await c.match("n");const n=(r?parseInt(await r.text(),10)||0:0)+1;await c.put("n",new Response(String(n)));if(self.navigator.setAppBadge)await self.navigator.setAppBadge(n);}catch(x){}}
self.addEventListener("push",e=>{let d={};try{d=e.data?e.data.json():{};}catch(x){d={texto:e.data?e.data.text():""};}
  e.waitUntil((async()=>{if(d.id){try{const c=await caches.open("farol-aviso");await c.put("visto",new Response(d.id));}catch(x){}}
    await self.registration.showNotification(d.titulo||"Farol Operacional",{body:d.texto||"",icon:"icons/icon-192-v2.png",badge:"icons/icone-96.png",tag:d.tag||"farol",data:{url:d.url||"./"}});
    await badgeMais();})());});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(w=>w.length?w[0].focus():self.clients.openWindow((e.notification.data&&e.notification.data.url)||"./")));});
