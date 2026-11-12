/* =====================================================================
   FAROL OPERACIONAL · API (Cloudflare Worker)
   Busca os indicadores no Power BI (REST "Execute Queries") e o orçamento
   no SharePoint (Microsoft Graph), monta o JSON do app e guarda o histórico.

   Variáveis (Cloudflare › Worker › Settings › Variables):
     TENANT_ID        (Text)    ID do tenant Microsoft do Grupo LOS
     CLIENT_ID        (Text)    ID do aplicativo registrado no Entra ID
     CLIENT_SECRET    (Secret)  segredo do aplicativo
     PBI_WORKSPACE_ID (Text)    workspace do Power BI
     PBI_DATASET_ID   (Text)    conjunto de dados do indicadores_flash
     ORC_DRIVE_ID     (Text)    drive do SharePoint com orcamento_ano.xlsx
     ORC_ITEM_ID      (Text)    id do arquivo orcamento_ano.xlsx
     ORC_SHEET        (Text)    nome da aba (ex.: "Orçamento 2026")
     APP_ORIGIN       (Text)    endereço do app (ex.: https://farol.grupolos.com.br)
   KV namespace: FAROL (histórico: chave "dia:AAAA-MM-DD" e "ultimo")
   Gatilhos (Triggers › Cron): "30 9 * * *" (06h30 Brasília) e "0,15,30,45 9-11 * * *"
   Login: proteger o domínio com Cloudflare Access (conta Microsoft corporativa).

   IMPORTANTE: os nomes de tabelas e medidas DAX abaixo são EXEMPLOS.
   A TI/BI do Grupo LOS precisa confirmar os nomes reais do modelo.
   ===================================================================== */

const DAX = {
  // Faturamento, meta e margens por dia do mês corrente (consolidado)
  dias: `
EVALUATE
SUMMARIZECOLUMNS(
  'Calendario'[Data],
  FILTER(ALL('Calendario'), 'Calendario'[Data] >= DATE(YEAR(TODAY()),MONTH(TODAY()-1),1) && 'Calendario'[Data] < TODAY()),
  "fat",  [Faturamento],
  "meta", [Meta Diaria],
  "mgT",  [Margem Terceiros %],
  "mgA",  [Margem Agregados %]
)`,
  // Atingimento do D-1 por regional (farol)
  farolD1: `
EVALUATE
SUMMARIZECOLUMNS(
  'Regional'[Regional],
  FILTER(ALL('Calendario'), 'Calendario'[Data] = TODAY()-1),
  "fat",  [Faturamento],
  "meta", [Meta Diaria]
)`,
  // Fechamento do mês por regional/operação
  regionais: `
EVALUATE
SUMMARIZECOLUMNS(
  'Regional'[Regional],
  FILTER(ALL('Calendario'), 'Calendario'[Data] >= DATE(YEAR(TODAY()),MONTH(TODAY()-1),1) && 'Calendario'[Data] < TODAY()),
  "fat",      [Faturamento],
  "metaMes",  [Meta Mes],
  "metaProp", [Meta Proporcional],
  "mgT",      [Margem Terceiros %],
  "mgA",      [Margem Agregados %]
)`,
  // Indicadores do mês (meta Power BI e projeção)
  mes: `
EVALUATE
ROW(
  "metaBI",  [Meta Mes],
  "projBI",  [Projecao Fechamento]
)`
};

/* ---------- autenticação Microsoft (client credentials) ---------- */
async function msToken(env, scope) {
  const cacheKey = "tok:" + scope;
  const hit = await env.FAROL.get(cacheKey, "json");
  if (hit && hit.exp > Date.now() + 60000) return hit.token;
  const r = await fetch(`https://login.microsoftonline.com/${env.TENANT_ID}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: env.CLIENT_ID, client_secret: env.CLIENT_SECRET, scope })
  });
  if (!r.ok) throw new Error("login Microsoft: " + r.status + " " + (await r.text()).slice(0, 200));
  const j = await r.json();
  await env.FAROL.put(cacheKey, JSON.stringify({ token: j.access_token, exp: Date.now() + j.expires_in * 1000 }), { expirationTtl: j.expires_in });
  return j.access_token;
}

/* ---------- Power BI: Execute Queries ---------- */
async function dax(env, query) {
  const tok = await msToken(env, "https://analysis.windows.net/powerbi/api/.default");
  const r = await fetch(`https://api.powerbi.com/v1.0/myorg/groups/${env.PBI_WORKSPACE_ID}/datasets/${env.PBI_DATASET_ID}/executeQueries`, {
    method: "POST",
    headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" },
    body: JSON.stringify({ queries: [{ query }], serializerSettings: { includeNulls: true } })
  });
  if (!r.ok) throw new Error("Power BI: " + r.status + " " + (await r.text()).slice(0, 300));
  const j = await r.json();
  // linhas chegam como {"Tabela[Coluna]": valor, "[medida]": valor}; normaliza para chaves curtas
  return (j.results[0].tables[0].rows || []).map(row => {
    const o = {}; for (const k in row) o[k.replace(/^.*\[|\]$/g, "")] = row[k]; return o;
  });
}

/* ---------- Orçamento: planilha no SharePoint via Graph ---------- */
async function orcamento(env) {
  const tok = await msToken(env, "https://graph.microsoft.com/.default");
  const url = `https://graph.microsoft.com/v1.0/drives/${env.ORC_DRIVE_ID}/items/${env.ORC_ITEM_ID}/workbook/worksheets('${encodeURIComponent(env.ORC_SHEET)}')/usedRange(valuesOnly=true)`;
  const r = await fetch(url, { headers: { Authorization: "Bearer " + tok } });
  if (!r.ok) throw new Error("Orçamento (Graph): " + r.status);
  const v = (await r.json()).values; // 1ª linha = cabeçalho: Mês | Meta orçada | Realizado | AGRO | Centro de custo ...
  const head = v[0].map(h => String(h).toLowerCase());
  const col = n => head.findIndex(h => h.includes(n));
  return v.slice(1).filter(x => x[0]).map(x => ({ mes: x[col("mês")], metaOrc: +x[col("meta")] || 0, real: x[col("realiz")] === "" ? null : +x[col("realiz")], agro: x[col("agro")] === "" ? null : +x[col("agro")], cc: x[col("centro")] || null }));
}

/* ---------- regras de cálculo (iguais às do app) ---------- */
const FERIADOS = ["01-01","04-21","05-01","09-07","10-12","11-02","11-15","11-20","12-25"]; // nacionais fixos (+ móveis: ajustar)
const diaUtil = d => { const w = d.getUTCDay(); const md = d.toISOString().slice(5, 10); return w > 0 && w < 6 && !FERIADOS.includes(md); };
function diasUteisRestantes(d1) { let n = 0; const d = new Date(d1); d.setUTCDate(d.getUTCDate() + 1); const m = d.getUTCMonth();
  while (d.getUTCMonth() === m) { if (diaUtil(d)) n++; d.setUTCDate(d.getUTCDate() + 1); } return n; }

async function montar(env) {
  const [dias, farol, regs, mes, orc] = await Promise.all([dax(env, DAX.dias), dax(env, DAX.farolD1), dax(env, DAX.regionais), dax(env, DAX.mes), orcamento(env)]);
  if (!dias.length) throw new Error("D-1 ainda não disponível no Power BI");
  const semana = ["dom","seg","ter","qua","qui","sex","sáb"], ext = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];
  const dd = dias.map(x => { const d = new Date(x.Data); return { d, row: [d.toISOString().slice(8,10)+"/"+d.toISOString().slice(5,7), semana[d.getUTCDay()], +x.fat, +x.meta, x.mgT*100, x.mgA==null?null:x.mgA*100] }; });
  const last = dd[dd.length - 1], prev = dd[dd.length - 2];
  const acum = dd.reduce((s, x) => s + x.row[2], 0), metaAcBI = dd.reduce((s, x) => s + x.row[3], 0);
  const mIdx = last.d.getUTCMonth(), mOrc = orc[mIdx] || {};
  const metaOrc = mOrc.metaOrc, metaBI = +mes[0].metaBI;
  const metaAcOrc = metaOrc * (metaAcBI / metaBI);            // meta orçada distribuída pelo calendário de metas
  const uteis = dd.filter(x => diaUtil(x.d)).length, duRest = diasUteisRestantes(last.d);
  const mediaDU = acum / Math.max(1, uteis);
  const wavg = k => dd.reduce((s, x) => s + (x.row[k] || 0) * x.row[2], 0) / acum;
  const ds = last.row[0] + "/" + last.d.getUTCFullYear();
  return {
    meta: { modo: "api", fonte: "Power BI + orçamento", atualizado: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) },
    d1: { data: ds, dia: ext[last.d.getUTCDay()], fat: last.row[2], meta: last.row[3], vsD2: prev ? (last.row[2] / prev.row[2] - 1) * 100 : null },
    mes: { acum, metaAcOrc, metaAcBI, metaOrc, metaBI, proj: +mes[0].projBI, mgT: wavg(4), mgA: wavg(5), mediaDU,
           diasMeta: dd.filter(x => x.row[2] >= x.row[3]).length, diasTot: dd.length, duRest, metaMediaRest: (metaBI - metaAcBI) / Math.max(1, duRest) },
    proj3: [["Power BI", +mes[0].projBI / 1e6], ["Calendário de metas", acum / metaAcBI * metaBI / 1e6], ["Ritmo por dia útil", (acum + mediaDU * duRest) / 1e6]],
    farol: farol.map(x => [x.Regional, Math.round(x.fat / x.meta * 100)]),
    reg: regs.map(x => { const parc = x.fat / x.metaProp * 100; const q = parc < 100 ? "Crítico" : (x.mgT != null && x.mgT < 0.03) ? "Proteger margem" : "Alavancar";
      return [x.Regional, +x.fat, +x.metaMes, Math.round(parc), x.mgT == null ? null : x.mgT * 100, x.mgA == null ? null : x.mgA * 100, x.fat - x.metaProp, q]; }),
    dias: dd.map(x => x.row),
    orc: orc.slice(0, 12).map((x, i) => [["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][i], x.metaOrc, i === mIdx ? metaBI : null, i === mIdx ? acum : x.real, x.agro, i === mIdx]),
    metaAno: orc.reduce((s, x) => s + x.metaOrc, 0),
    dds: (await env.FAROL.get("dds:" + ds, "json")) || (await env.FAROL.get("dds:padrao", "json")) || { titulo: "Segurança em primeiro lugar", texto: "Nenhuma meta vale mais do que voltar para casa em segurança.", autor: "Rafael Ximenes" },
    frase: (await env.FAROL.get("frase:" + ds, "json")) || { texto: "Carro parado é prejuízo.", autor: "CT LOS" }
  };
}

async function coletar(env) {
  const j = await montar(env);
  const key = "dia:" + j.d1.data.split("/").reverse().join("-");
  await env.FAROL.put(key, JSON.stringify(j));
  await env.FAROL.put("ultimo", JSON.stringify(j));
  return j;
}

/* ---------- HTTP ---------- */
const cors = env => ({ "Access-Control-Allow-Origin": env.APP_ORIGIN || "*", "Access-Control-Allow-Credentials": "true", "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
const json = (env, o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: cors(env) });

export default {
  async scheduled(event, env, ctx) { ctx.waitUntil(coletar(env).catch(e => env.FAROL.put("erro", JSON.stringify({ quando: new Date().toISOString(), msg: e.message })))); },
  async fetch(req, env) {
    const u = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { headers: { ...cors(env), "Access-Control-Allow-Methods": "GET,POST,PUT", "Access-Control-Allow-Headers": "Content-Type" } });
    // Cloudflare Access injeta este cabeçalho depois do login corporativo
    const user = req.headers.get("Cf-Access-Authenticated-User-Email");
    if (!user && env.EXIGIR_LOGIN !== "nao") return json(env, { erro: "login necessário" }, 401);
    try {
      if (u.pathname === "/api/hoje") { const j = await env.FAROL.get("ultimo", "json"); return json(env, j || await coletar(env)); }
      const m = u.pathname.match(/^\/api\/dia\/(\d{4}-\d{2}-\d{2})$/);
      if (m) { const j = await env.FAROL.get("dia:" + m[1], "json"); return j ? json(env, j) : json(env, { erro: "sem dados para " + m[1] }, 404); }
      if (u.pathname === "/api/status") return json(env, { erro: await env.FAROL.get("erro", "json"), ultimo: (await env.FAROL.get("ultimo", "json"))?.meta });
      if (u.pathname === "/api/coleta/agora" && req.method === "POST") return json(env, await coletar(env));
      if (u.pathname === "/api/dds" && req.method === "PUT") { const b = await req.json(); await env.FAROL.put("dds:" + (b.data || "padrao"), JSON.stringify(b)); return json(env, { ok: true }); }
      return json(env, { erro: "rota não encontrada" }, 404);
    } catch (e) { return json(env, { erro: e.message }, 502); }
  }
};
