// Busca diária de indicadores oficiais de mercado (Banco Central) e geração de alertas.
// Roda no GitHub Actions; grava data/mercado.json e data/alertas-mercado.json.
import fs from "fs";
const MK = "data/mercado.json", AL = "data/alertas-mercado.json";
const m = JSON.parse(fs.readFileSync(MK, "utf8"));
const al = fs.existsSync(AL) ? JSON.parse(fs.readFileSync(AL, "utf8")) : { alertas: [] };
const hoje = new Date(Date.now() - 3 * 3600e3), dBR = hoje.toISOString().slice(0, 10).split("-").reverse().join("/");
const nf = (v, c) => v.toLocaleString("pt-BR", { minimumFractionDigits: c, maximumFractionDigits: c });
const get = async u => { for (let i = 0; i < 3; i++) { try { const r = await fetch(u, { headers: { accept: "application/json" } }); if (r.ok) return r.json(); } catch (e) {} await new Promise(r => setTimeout(r, 2000)); } throw new Error("falha " + u); };
const sgs = async (n, k) => (await get(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${n}/dados/ultimos/${k}?formato=json`)).map(x => ({ d: x.data, v: parseFloat(String(x.valor).replace(",", ".")) }));
const it = id => m.itens.find(x => x.id === id) || (m.macro || []).find(x => x.id === id);
const novos = [];
const alerta = (id, nivel, titulo, texto) => { if (!al.alertas.some(a => a.id === id)) novos.push({ id, nivel, titulo, texto, data: dBR, em: new Date().toISOString() }); };
const log = [];
// PTAX
try {
  const f = d => `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}-${d.getFullYear()}`;
  const v = (await get(`https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@a,dataFinalCotacao=@b)?@a='${f(new Date(hoje - 12 * 864e5))}'&@b='${f(hoje)}'&$format=json`)).value;
  if (v.length) { const a = v[v.length - 1], b = v[v.length - 2], p = b ? (a.cotacaoVenda / b.cotacaoVenda - 1) * 100 : 0, dt = a.dataHoraCotacao.slice(0, 10).split("-").reverse().join("/");
    Object.assign(it("usd"), { valor: "R$ " + nf(a.cotacaoVenda, 4), var: (p >= 0 ? "+" : "−") + nf(Math.abs(p), 2) + "%", dir: p >= 0 ? 1 : -1, ref: dt.slice(0, 5) + " · Banco Central" });
    if (Math.abs(p) >= 1) alerta("ptax-" + dt, "importante", `Dólar ${p > 0 ? "sobe" : "cai"} ${nf(Math.abs(p), 2)}%`, `PTAX de ${dt}: R$ ${nf(a.cotacaoVenda, 4)} (Banco Central). Impacta diesel, peças e contratos atrelados ao câmbio.`);
    log.push("ptax ok"); }
} catch (e) { log.push("ptax erro"); }
// Selic
try { const s = await sgs(432, 1), u = it("selic"), ant = parseFloat(String(u.valor).replace(",", "."));
  if (!isNaN(ant) && Math.abs(ant - s[0].v) > 0.001) alerta("selic-" + s[0].d, "importante", `Selic ${s[0].v > ant ? "sobe" : "cai"} para ${nf(s[0].v, 2)}% a.a.`, `Decisão do Copom (Banco Central): de ${nf(ant, 2)}% para ${nf(s[0].v, 2)}% ao ano. Afeta custo de financiamento de frota.`);
  Object.assign(u, { valor: nf(s[0].v, 2) + "% a.a.", ref: "meta vigente · Copom/Banco Central" }); log.push("selic ok");
} catch (e) { log.push("selic erro"); }
// IPCA
try { const [mm, aa] = await Promise.all([sgs(433, 1), sgs(13522, 1)]), u = it("ipca"), ref = mm[0].d.slice(3);
  if (!String(u.ref).startsWith(ref)) alerta("ipca-" + ref, aa[0].v > 4.5 ? "importante" : "info", `IPCA de ${ref}: ${nf(mm[0].v, 2)}%`, `Inflação oficial (IBGE): ${nf(mm[0].v, 2)}% no mês e ${nf(aa[0].v, 2)}% em 12 meses${aa[0].v > 4.5 ? ", acima do teto da meta (4,5%)" : ""}.`);
  Object.assign(u, { valor: nf(mm[0].v, 2) + "%", var: "12 meses: " + nf(aa[0].v, 2) + "%", ref: ref + " · IBGE/BCB" }); log.push("ipca ok");
} catch (e) { log.push("ipca erro"); }
// Ouro B3
try { const g = await sgs(4, 2); const _d = g.length ? g[g.length - 1].d.split("/") : null; if (g.length && (Date.now() - new Date(+_d[2], _d[1] - 1, +_d[0])) < 7 * 864e5) { const a = g[g.length - 1], p = g.length > 1 ? (a.v / g[0].v - 1) * 100 : 0;
  Object.assign(it("ouro"), { valor: "R$ " + nf(a.v, 2) + "/g", var: (p >= 0 ? "+" : "−") + nf(Math.abs(p), 2) + "% no dia", dir: p >= 0 ? 1 : -1, ref: a.d.slice(0, 5) + " · B3 via Banco Central" });
  if (Math.abs(p) >= 2) alerta("ouro-" + a.d, "info", `Ouro ${p > 0 ? "sobe" : "cai"} ${nf(Math.abs(p), 2)}%`, `Ouro na B3: R$ ${nf(a.v, 2)} por grama em ${a.d} (série oficial do Banco Central).`);
  log.push("ouro ok"); } } catch (e) { log.push("ouro erro"); }
m.atualizado = dBR; m.buscaAuto = new Date().toISOString();
al.alertas = novos.concat(al.alertas).slice(0, 40); al.atualizado = new Date().toISOString();
fs.writeFileSync(MK, JSON.stringify(m, null, 1)); fs.writeFileSync(AL, JSON.stringify(al, null, 1));
console.log(log.join(" | "), "· novos alertas:", novos.length);
