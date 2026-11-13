// Busca diária de dicas de segurança em fontes oficiais e de referência (gov.br/PRF, Fundacentro,
// Ministério do Trabalho, Observatório Nacional de Segurança Viária, SEST SENAT).
// Roda no GitHub Actions e grava data/seguranca.json com as 3 dicas do dia (7h, 11h e 15h).
import fs from "fs";
const OUT = "data/seguranca.json";
const GN = q => "https://news.google.com/rss/search?q=" + encodeURIComponent(q) + "&hl=pt-BR&gl=BR&ceid=BR:pt-419";
const FONTES = [
  { nome: "ONSV", url: "https://www.onsv.org.br/rss" },
  { nome: "Revista Proteção", url: "https://protecao.com.br/feed/" },
  { nome: "ANAMT", url: "https://anamt.org.br/portal/feed/" },
  { nome: "PRF", url: GN("site:gov.br/prf caminhão OR motorista OR carga when:30d"), gn: true },
  { nome: "Fundacentro", url: GN("site:gov.br/fundacentro segurança when:60d"), gn: true },
  { nome: "Ministério do Trabalho", url: GN("site:gov.br/trabalho-e-emprego segurança do trabalho when:60d"), gn: true },
  { nome: "Notícias", url: GN("segurança caminhoneiro dicas OR prevenção acidentes transporte de carga when:14d"), gn: true },
];
const BOM = /(dica|cuidado|orienta|alerta|evite|previn|segur|acidente|motorista|caminh|rodovi|epi|trabalhador|fadiga|chuva|velocidade|cinto|ultrapass|carga|sono|álcool|alcool)/i;
const RUIM = /(morre|morte|morreu|mort|preso|prisão|prisao|apreen|tráfico|trafico|droga|crime|assalt|roubo|furto|operação policial|licita|edital|nomea|portaria|concurso|resultado final|posse|agenda do ministro|reunião|reuniao|convênio|convenio|leil)/i;
const tira = s => String(s || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#8211;|&#8212;/g, "—").replace(/&#8217;|&#8216;/g, "'").replace(/&#8220;|&#8221;/g, '"').replace(/&#\d+;/g, "").replace(/\s+/g, " ").trim();
const corta = (s, n) => s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n)) + "…";
async function rss(f) {
  const r = await fetch(f.url, { headers: { "user-agent": "Mozilla/5.0 FarolOperacional/1.0", accept: "application/rss+xml,application/xml,text/xml,*/*" }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(r.status);
  const x = await r.text();
  return [...x.matchAll(/<item[\s>][\s\S]*?<\/item>/g)].slice(0, 25).map(m => {
    const g = t => (m[0].match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)) || [])[1];
    let ti = tira(g("title")), fo = f.nome; if (f.gn) { const k = ti.lastIndexOf(" - "); if (k > 20) { if (f.nome === "Notícias") fo = ti.slice(k + 3); ti = ti.slice(0, k); } }
    return { fonte: fo, titulo: ti, texto: f.gn ? "" : tira(g("description")), url: tira(g("link")), data: tira(g("pubDate") || g("dc:date")) };
  });
}
const log = [], achados = [];
for (const f of FONTES) { try { const it = await rss(f); achados.push(...it); log.push(`${f.nome}: ${it.length}`); } catch (e) { log.push(`${f.nome}: erro ${e.message}`); } }
const limite = Date.now() - 45 * 864e5;
const bons = achados.filter(a => a.titulo && BOM.test(a.titulo + " " + a.texto) && !RUIM.test(a.titulo) && (!a.data || isNaN(Date.parse(a.data)) || Date.parse(a.data) > limite));
// variedade: alterna fontes e evita repetir o que já saiu nos últimos dias
const ant = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
const usados = new Set((ant.usados || []).slice(-60));
const novos = bons.filter(a => !usados.has(a.url || a.titulo));
// prioriza o nosso negócio: transporte rodoviário de carga a granel (cimento, cal, agro), frota e pátios
const NEG = [[/caminh|carreta|veículo pesado|veiculo pesado/i,5],[/carga|granel|cimento|silo|tombamento|amarra/i,5],[/motorista|condutor/i,4],[/rodovi|estrada|br-\d/i,3],[/fadiga|sono|jornada|descanso/i,4],[/freio|pneu|manuten/i,3],[/epi|trabalho em altura|espaço confinado|espaco confinado|nr-?\d+/i,3],[/chuva|neblina|velocidade|ultrapass|cinto|celular|álcool|alcool/i,2],[/acidente|prevenção|prevencao|dica|cuidado|orienta/i,1]];
const nota = a => NEG.reduce((t,[r,p]) => t + (r.test(a.titulo + " " + a.texto) ? p : 0), 0);
const pool = (novos.length >= 3 ? novos : bons).filter(a => nota(a) >= 3).sort((a,b) => nota(b) - nota(a));
const escolhidos = [], fontes = new Set();
for (const a of pool) { if (escolhidos.length >= 3) break; if (!fontes.has(a.fonte) || pool.filter(x => !fontes.has(x.fonte)).length === 0) { escolhidos.push(a); fontes.add(a.fonte); } }
for (const a of pool) { if (escolhidos.length >= 3) break; if (!escolhidos.includes(a)) escolhidos.push(a); }
const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const dicas = escolhidos.map(a => ({ titulo: corta(a.titulo, 90), texto: corta(a.texto || a.titulo, 180), fonte: a.fonte, url: a.url }));
const out = { data: hoje, horas: [7, 11, 15], dicas, fontes: FONTES.map(f => f.nome), usados: [...(ant.usados || []), ...escolhidos.map(a => a.url || a.titulo)].slice(-90), log, atualizado: new Date().toISOString() };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(log.join("\n")); console.log(`candidatos ${bons.length} · escolhidos ${dicas.length}`); dicas.forEach(d => console.log("-", d.fonte, "|", d.titulo));
