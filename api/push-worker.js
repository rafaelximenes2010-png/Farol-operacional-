/* =====================================================================
   FAROL OPERACIONAL · NOTIFICAÇÕES (Cloudflare Worker)
   Faz a notificação chegar com o celular BLOQUEADO (iPhone e Android).

   Como funciona
   - O app, depois que a pessoa autoriza notificações, se inscreve aqui (POST /inscrever).
   - A cada 5 minutos este Worker lê data/aviso.json do Farol. Quando aparece um aviso novo
     (ex.: "Flash Atualizado!" de cada edição), manda para todos os aparelhos inscritos.
   - As chaves de envio (VAPID) são criadas aqui na primeira vez e ficam só no KV.
     Nenhum segredo passa pelo GitHub nem por chat.

   Instalação (painel da Cloudflare, ~10 min)
   1. Storage & Databases › KV › Create › nome "farol-push".
   2. Workers & Pages › Create › Worker › nome "farol-push" › Deploy › Edit code ›
      apague tudo, cole ESTE arquivo inteiro › Deploy.
   3. No Worker: Settings › Bindings › Add › KV namespace › Variable name: PUSH ›
      escolha "farol-push" › Save.
   4. Settings › Trigger Events › Add › Cron Triggers › escolha "a cada 5 minutos" (Every 5 minutes) › Add.
   5. Copie o endereço (https://farol-push.SEU-USUARIO.workers.dev) e coloque em
      data/push.json no repositório ({"worker":"https://..."}).

   Endpoints
   GET  /vapid       chave pública (o app usa para se inscrever)
   POST /inscrever   {sub:<PushSubscription>, nome, regional}
   POST /sair        {endpoint}
   POST /teste       {endpoint}  manda uma notificação de teste só para aquele aparelho
   GET  /status      quantidade de aparelhos inscritos e último aviso enviado
   ===================================================================== */

const APP = "https://rafaelximenes2010-png.github.io/Farol-operacional-/";
const ORIGENS = ["https://rafaelximenes2010-png.github.io"];

const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const deb64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const txt = s => new TextEncoder().encode(s);
const junta = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };

async function hkdf(salt, ikm, info, len) {
  const k = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, k, len * 8));
}

/* chaves VAPID: criadas na primeira chamada e guardadas no KV */
async function chaves(env) {
  let j = await env.PUSH.get("vapid", "json");
  if (!j) {
    const par = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    j = { priv: await crypto.subtle.exportKey("jwk", par.privateKey), pub: b64u(await crypto.subtle.exportKey("raw", par.publicKey)) };
    await env.PUSH.put("vapid", JSON.stringify(j));
  }
  return j;
}

async function jwtVapid(env, endpoint) {
  const v = await chaves(env), aud = new URL(endpoint).origin;
  const cab = b64u(txt(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const corpo = b64u(txt(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 3600, sub: APP })));
  const k = await crypto.subtle.importKey("jwk", v.priv, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const ass = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, k, txt(cab + "." + corpo));
  return { jwt: cab + "." + corpo + "." + b64u(ass), pub: v.pub };
}

/* criptografia do conteúdo (RFC 8291, aes128gcm) */
export async function cifrar(sub, mensagem) {
  const uaPub = deb64u(sub.keys.p256dh), auth = deb64u(sub.keys.auth);
  const par = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", par.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const comum = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, par.privateKey, 256));
  const ikm = await hkdf(auth, comum, junta(txt("WebPush: info\0"), uaPub, asPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, txt("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, txt("Content-Encoding: nonce\0"), 12);
  const k = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, k, junta(txt(mensagem), new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]); // 4096
  return junta(salt, rs, new Uint8Array([asPub.length]), asPub, ct);
}

async function enviar(env, sub, dados) {
  const { jwt, pub } = await jwtVapid(env, sub.endpoint);
  const corpo = await cifrar(sub, JSON.stringify(dados));
  const r = await fetch(sub.endpoint, {
    method: "POST", body: corpo,
    headers: { Authorization: `vapid t=${jwt}, k=${pub}`, TTL: "86400", Urgency: "high", "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream" }
  });
  return r.status;
}

/* só aceita endereços dos serviços de push dos navegadores (Google/Android/Chrome, Apple/iPhone, Mozilla, Microsoft) */
const PUSH_OK = /^https:\/\/(fcm\.googleapis\.com|android\.googleapis\.com|[a-z0-9.-]*\.push\.apple\.com|web\.push\.apple\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]*\.notify\.windows\.com)\//i;
const idSub = async endpoint => b64u(await crypto.subtle.digest("SHA-256", txt(endpoint))).slice(0, 32);

async function paraTodos(env, dados) {
  let cursor, ok = 0, fora = 0, erro = 0;
  do {
    const l = await env.PUSH.list({ prefix: "sub:", cursor });
    for (const k of l.keys) {
      const s = await env.PUSH.get(k.name, "json"); if (!s) continue;
      try {
        const st = await enviar(env, s.sub, dados);
        if (st === 404 || st === 410) { await env.PUSH.delete(k.name); fora++; } else if (st < 300) ok++; else erro++;
      } catch (e) { erro++; }
    }
    cursor = l.list_complete ? null : l.cursor;
  } while (cursor);
  return { ok, fora, erro };
}

/* lê o aviso publicado no Farol e manda se for novo */
async function verificarAviso(env) {
  let a;
  try { a = await (await fetch(APP + "data/aviso.json?t=" + Date.now(), { cf: { cacheTtl: 0 } })).json(); } catch (e) { return { erro: "aviso ilegível" }; }
  if (!a || !a.id || !a.titulo) return { nada: "sem aviso" };
  if (a.ate && Date.now() > Date.parse(a.ate)) return { nada: "aviso vencido" };
  if ((await env.PUSH.get("ultimoAviso")) === a.id) return { nada: "já enviado", id: a.id };
  await env.PUSH.put("ultimoAviso", a.id);
  const r = await paraTodos(env, { titulo: a.titulo, texto: a.texto || "", tag: "aviso-" + a.id, id: a.id, url: APP });
  await env.PUSH.put("ultimoEnvio", JSON.stringify({ id: a.id, em: new Date().toISOString(), ...r }));
  return r;
}

const cors = req => {
  const o = req.headers.get("Origin") || "";
  return { "Access-Control-Allow-Origin": ORIGENS.includes(o) ? o : ORIGENS[0], "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
};

export default {
  async fetch(req, env) {
    const h = cors(req), u = new URL(req.url), J = (x, s = 200) => new Response(JSON.stringify(x), { status: s, headers: h });
    if (req.method === "OPTIONS") return new Response(null, { headers: h });
    try {
      if (u.pathname === "/vapid") return J({ chave: (await chaves(env)).pub });
      if (u.pathname === "/status") {
        let n = 0, cursor; do { const l = await env.PUSH.list({ prefix: "sub:", cursor }); n += l.keys.length; cursor = l.list_complete ? null : l.cursor; } while (cursor);
        return J({ aparelhos: n, ultimoEnvio: await env.PUSH.get("ultimoEnvio", "json") });
      }
      if (req.method !== "POST") return J({ erro: "rota" }, 404);
      const b = await req.json();
      if (u.pathname === "/inscrever") {
        const s = b && b.sub;
        if (!s || !PUSH_OK.test(s.endpoint || "") || !s.keys || !s.keys.p256dh || !s.keys.auth) return J({ erro: "inscrição inválida" }, 400);
        await env.PUSH.put("sub:" + await idSub(s.endpoint), JSON.stringify({ sub: { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } }, nome: String(b.nome || "").slice(0, 60), regional: String(b.regional || "").slice(0, 40), em: new Date().toISOString() }));
        return J({ ok: true });
      }
      if (u.pathname === "/sair") { if (b && b.endpoint) await env.PUSH.delete("sub:" + await idSub(b.endpoint)); return J({ ok: true }); }
      if (u.pathname === "/teste") {
        const s = b && b.endpoint && await env.PUSH.get("sub:" + await idSub(b.endpoint), "json");
        if (!s) return J({ erro: "aparelho não inscrito" }, 404);
        const st = await enviar(env, s.sub, { titulo: "Farol · Teste", texto: "Notificação com a tela bloqueada funcionando.", tag: "teste-" + Date.now(), url: APP });
        return J({ ok: st < 300, status: st });
      }
      return J({ erro: "rota" }, 404);
    } catch (e) { return J({ erro: String(e && e.message || e) }, 500); }
  },
  async scheduled(ev, env, ctx) { ctx.waitUntil(verificarAviso(env)); }
};
