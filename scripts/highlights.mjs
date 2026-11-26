// Highlights do dia por setor (notícias diárias), em rodízio pelo dia da semana (horário de Brasília):
// seg cimento · ter aço · qua celulose · qui agro · sex alimentos · sáb saúde · dom combustíveis.
// Roda no GitHub Actions; busca manchetes das últimas 48 h no Google Notícias (pt-BR) e grava
// data/highlights.json com título, veículo, data e link de cada notícia (só a manchete, com link para a fonte).
import fs from "fs";
const ARQ = "data/highlights.json";
const SETORES = {
  1: { id: "cimento", nome: "Cimento", ic: "🏗️", q: "(cimento OR SNIC OR \"construção civil\") Brasil" },
  2: { id: "aco", nome: "Aço", ic: "🏭", q: "(aço OR siderurgia OR \"Aço Brasil\") Brasil" },
  3: { id: "celulose", nome: "Celulose", ic: "🌲", q: "(celulose OR \"papel e celulose\" OR Suzano OR Klabin)" },
  4: { id: "agro", nome: "Agro", ic: "🌾", q: "(agronegócio OR safra OR Conab OR soja OR milho) Brasil" },
  5: { id: "alimentos", nome: "Alimentos", ic: "🍞", q: "(\"indústria de alimentos\" OR ABIA OR \"preço dos alimentos\" OR alimentos inflação) Brasil" },
  6: { id: "saude", nome: "Saúde", ic: "🩺", q: "(\"Ministério da Saúde\" OR Anvisa OR \"saúde pública\" OR SUS) Brasil" },
  0: { id: "combustiveis", nome: "Combustíveis", ic: "⛽", q: "(diesel OR gasolina OR ANP OR combustíveis OR Petrobras preço) Brasil" },
};
const agoraBR = new Date(Date.now() - 3 * 3600e3), dow = agoraBR.getUTCDay();
const iso = agoraBR.toISOString().slice(0, 10), dBR = iso.split("-").reverse().join("/");
const DIAS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const S = SETORES[dow];
const url = "https://news.google.com/rss/search?q=" + encodeURIComponent(S.q + " when:2d") + "&hl=pt-BR&gl=BR&ceid=BR:pt-419";
const tira = t => String(t || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
async function buscar() {
  for (let t = 0; t < 3; t++) {
    try { const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 FarolOperacional/1.0", accept: "application/rss+xml,application/xml,text/xml,*/*" }, signal: AbortSignal.timeout(20000) }); if (r.ok) return await r.text(); } catch (e) {}
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error("Google Notícias não respondeu");
}
const xml = await buscar();
const itens = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
  const g = tag => { const x = m[1].match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)); return x ? tira(x[1]) : ""; };
  let titulo = g("title"); const fonte = g("source") || (titulo.match(/ - ([^-]+)$/) || [])[1] || "";
  if (fonte && titulo.endsWith(" - " + fonte)) titulo = titulo.slice(0, -(fonte.length + 3));
  const link = g("link"), em = Date.parse(g("pubDate"));
  return { t: titulo.replace(/[<>]/g, ""), fonte: fonte.replace(/[<>]/g, ""), link: /^https:\/\//.test(link) ? link : "", em: isNaN(em) ? null : new Date(em).toISOString() };
}).filter(x => x.t && x.link && x.em && Date.now() - Date.parse(x.em) < 48 * 3600e3);
const vistos = new Set(), sel = [];
for (const x of itens.sort((a, b) => Date.parse(b.em) - Date.parse(a.em))) {
  const k = x.t.toLowerCase().replace(/[^a-zà-ú0-9 ]/g, "").split(" ").slice(0, 6).join(" ");
  if (vistos.has(k) || sel.some(s => s.fonte === x.fonte && sel.filter(z => z.fonte === x.fonte).length >= 2)) continue;
  vistos.add(k); sel.push(x); if (sel.length >= 5) break;
}
if (!sel.length) { console.log("Sem notícias novas para", S.nome, "— arquivo mantido."); process.exit(0); }
const atual = fs.existsSync(ARQ) ? JSON.parse(fs.readFileSync(ARQ, "utf8")) : {};
const hist = (atual.historico || []).filter(h => h.data !== iso).slice(0, 13);
const hoje = { data: iso, dataBR: dBR, dia: DIAS[dow], setor: S.id, nome: S.nome, ic: S.ic, itens: sel, buscado: new Date().toISOString(), fonte: "Google Notícias (manchetes das últimas 48 h, com link para o veículo)" };
fs.writeFileSync(ARQ, JSON.stringify({ ...hoje, rodizio: ["Dom · Combustíveis", "Seg · Cimento", "Ter · Aço", "Qua · Celulose", "Qui · Agro", "Sex · Alimentos", "Sáb · Saúde"], historico: [hoje, ...hist].slice(0, 14) }, null, 1) + "\n");
console.log(`Highlights ${dBR} (${DIAS[dow]}) · ${S.nome}: ${sel.length} notícias`); sel.forEach(x => console.log(" -", x.t, "·", x.fonte));
