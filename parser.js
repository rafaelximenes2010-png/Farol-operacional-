/* Farol Operacional · leitura do PDF da revista "Morning Operational News"
   Recebe o texto de cada página (pdf.js) e devolve os dados no formato do app.
   Enquanto a API do Power BI não é liberada, o app é alimentado por este PDF. */
(function (root) {
  const num = s => s == null || /^—|^-$/.test(String(s).trim()) ? null : +String(s).replace(/[R$\s+]/g, "").replace(/−/g, "-").replace(/\./g, "").replace(",", ".").replace("%", "").replace("*", "");
  const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const SEM = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];
  function req(v, nome, faltas) { if (v == null || Number.isNaN(v)) faltas.push(nome); return v; }
  function parse(pages) {
    const all = pages.join("\n"), faltas = [];
    const pick = (re, src = all, g = 1) => { const m = src.match(re); return m ? m[g] : null; };
    // ---- dia a dia (página Acumulado Geral)
    const dias = [];
    const reD = /(\d\d\/\d\d)\s+(dom|seg|ter|qua|qui|sex|sáb)\s+([\d.]+)\s+([\d.]+)\s+\d+%\s+[−+-]R\$ [\d.]+\s+[\d.]+\s+\d+%\s+([\d,]+%|—)\s+([\d,]+%|—)/g;
    let m; while ((m = reD.exec(all))) dias.push([m[1], m[2], num(m[3]), num(m[4]), num(m[5]), num(m[6])]);
    if (!dias.length) throw new Error("Não encontrei a tabela “Performance por dia”. Este PDF é a revista Morning Operational News?");
    const last = dias[dias.length - 1];
    const dataD1 = pick(/Resultado de (?:[a-zç-]+, )?(\d\d\/\d\d\/\d{4})/i) || (last[0] + "/" + new Date().getFullYear());
    const [dd, mm, yy] = dataD1.split("/").map(Number);
    const wd = new Date(Date.UTC(yy, mm - 1, dd)).getUTCDay();
    const vsD2 = num(pick(/Faturamento vs D-2:\s*([+−-]?[\d,]+)%/));
    // ---- mês
    const tot = all.match(/Total do mês\s+([\d.]+)\s+([\d.]+)/);
    const acum = tot ? num(tot[1]) : dias.reduce((s, x) => s + x[2], 0), metaAcBI = tot ? num(tot[2]) : dias.reduce((s, x) => s + x[3], 0);
    const metaAcOrc = num(pick(/META ACUM\. ORÇADA\s+R\$ ([\d.]+)/));
    const proj = num(pick(/PROJEÇÃO DO MÊS\s+R\$ ([\d.]+)/));
    const mgs = all.match(/MARGENS TERC\. \| AGR\.\s+([\d,]+)%\s*\|\s*([\d,]+)%/);
    const mediaDU = num(pick(/MÉDIA POR DIA ÚTIL\s+R\$ ([\d.]+)/));
    const duRest = num(pick(/em (\d+) dias\s+úteis/));
    const metaMediaRest = num(pick(/R\$ ([\d,]+) mi\s+Meta média/)) * 1e6 || null;
    const p3 = all.match(/Power BI\s+R\$ ([\d,]+) mi\s+Calendário de metas\s+R\$ ([\d,]+) mi\s+Ritmo por dia útil\s+R\$ ([\d,]+) mi/);
    // ---- orçamento mês a mês
    const orc = []; let metaOrc = null, metaBI = null;
    all.split("\n").forEach(l => {
      const t = l.trim().split(/\s{2,}/); const mi = MESES.findIndex(x => t[0] === x + "/" + String(yy).slice(2));
      if (mi < 0 || t.length < 4) return;
      const parcial = /\*$/.test(t[3]);
      orc[mi] = [MESES[mi].slice(0, 3), num(t[1]), num(t[2]), num(t[3]), t.length >= 9 ? num(t[7]) : null, parcial || undefined];
      if (mi === mm - 1) { metaOrc = num(t[1]); metaBI = num(t[2]); }
    });
    const metaAno = num(pick(/Meta orçada do ano\s+([\d.]+)/));
    // ---- farol D-1 (capa): nome seguido do %, até o editorial
    const capa = (all.split(/E D I T O R I A L/)[0] || "");
    const farol = []; const reF = /([A-ZÇÃÁÉÍÓÚÂÊÔ][A-ZÇÃÁÉÍÓÚÂÊÔ\/\- 0-9\n]*?)\s*\n\s*(\d+)%/g;
    while ((m = reF.exec(capa))) farol.push([m[1].replace(/\s*\n\s*/g, " ").trim(), +m[2]]);
    // ---- fechamento por regional + quadrante
    const reg = [];
    const fech = (all.split("FECHAMENTO DO MÊS POR REGIONAL")[1] || "").split("Total das")[0];
    fech.split("\n").forEach(l => { const t = l.trim().split(/\s{2,}/); if (t.length >= 7 && /^[\d.]+$/.test(t[1]) && /%$/.test(t[4])) {
      const fat = num(t[1]), metaMes = num(t[2]), parc = num(t[4]);
      reg.push([t[0], fat, metaMes, parc, num(t[5]), num(t[6]), Math.round(fat - fat / (parc / 100)), "—"]); } });
    const quad = (all.split("FECHAMENTO PROJETADO POR REGIONAL")[1] || "").split("LEITURAS")[0];
    quad.split("\n").forEach(l => { const t = l.trim().split(/\s{2,}/); const r = reg.find(x => x[0] === t[0]); if (r && t.length >= 8) r[7] = t[7]; });
    // ---- textos: DDS, editorial, frase do dia
    const ddsM = all.match(/D D S D O D I A\s*\n\s*(.+?)\s*🦺?\s*\n([\s\S]+?)\n\s*—\s*([^\n]+)/);
    const edM = all.match(/Mensagem\s*\n?do dia\s*\n\s*([\s\S]+?)\n\s*—\s*([^\n]+)/);
    const frM = all.match(/“([\s\S]+?)\s*\n?\s*—\s*([^”\n]+)”/);
    const limpa = s => s.replace(/-\n/g, "").replace(/\s*\n\s*/g, " ").replace(/^E\s+stamos/, "Estamos").replace(/^(\w)\s+(\w)/, "$1$2").trim();
    const D = {
      meta: { modo: "pdf", fonte: "PDF da revista (Power BI importado)", atualizado: dataD1 },
      d1: { data: dataD1, dia: SEM[wd], fat: last[2], meta: last[3], vsD2 },
      mes: { acum, metaAcOrc: req(metaAcOrc, "meta acumulada orçada", faltas), metaAcBI, metaOrc: req(metaOrc, "meta orçada do mês", faltas), metaBI: req(metaBI, "meta Power BI do mês", faltas),
             proj: req(proj, "projeção", faltas), mgT: mgs ? num(mgs[1]) : null, mgA: mgs ? num(mgs[2]) : null, mediaDU: req(mediaDU, "média por dia útil", faltas),
             diasMeta: dias.filter(x => x[2] >= x[3]).length, diasTot: dias.length, duRest: req(duRest, "dias úteis restantes", faltas), metaMediaRest },
      proj3: p3 ? [["Power BI", num(p3[1])], ["Calendário de metas", num(p3[2])], ["Ritmo por dia útil", num(p3[3])]] : [["Power BI", proj / 1e6]],
      farol, reg, dias, orc: Array.from({ length: 12 }, (_, i) => orc[i] || [["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][i], null, null, null, null]),
      metaAno,
      dds: ddsM ? { titulo: ddsM[1].trim().replace(/^(.)(.*)$/, (a, b, c) => b + c.toLowerCase()), texto: limpa(ddsM[2]), autor: ddsM[3].trim() } : null,
      editorial: edM ? { texto: limpa(edM[1]), autor: edM[2].trim() } : null,
      frase: frM ? { texto: limpa(frM[1]).replace(/\.$/, "."), autor: frM[2].trim() } : null,
      avisos: []
    };
    if (!farol.length) D.avisos.push("Farol por regional não encontrado no PDF.");
    if (!reg.length) D.avisos.push("Fechamento por regional não encontrado no PDF.");
    if (faltas.length) D.avisos.push("Não encontrei: " + faltas.join(", ") + ".");
    const semFech = farol.filter(f => !reg.find(r => r[0] === f[0])).map(f => f[0]);
    if (semFech.length) D.avisos.push(semFech.join(" e ") + " aparecem no farol, mas não no fechamento do mês.");
    return D;
  }
  root.FarolPDF = { parse };
  if (typeof module !== "undefined") module.exports = { parse };
})(typeof window !== "undefined" ? window : globalThis);

/* ===== Leitura dos 2 PDFs padrão do Power BI (indicadores_flash) ===== */
(function (root) {
  const num = s => s == null ? null : +String(s).replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".").replace("%", "");
  const SEM = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"], AB = ["dom","seg","ter","qua","qui","sex","sáb"];
  const FER = ["01-01","04-03","04-21","05-01","09-07","10-12","11-02","11-15","11-20","12-25"];
  const util = d => { const w = d.getUTCDay(), md = d.toISOString().slice(5, 10); return w > 0 && w < 6 && !FER.includes(md); };
  const tipo = txt => /Fechamento por regional/i.test(txt) ? "reg" : /Faturamento do dia/i.test(txt) ? "dia" : null;
  function parseBI(dia, reg, prev) {
    const av = [];
    // ---------- arquivo 1: performance diária
    const dias = []; let m; const reD = /^\s*(\d\d\/\d\d)\s+([\d.]+)\s+([\d.]+)\s+\d+%\s+[\d.]+\s+([\d,]+)%(?:\s+([\d,]+)%)?\s*$/gm;
    while ((m = reD.exec(dia))) dias.push([m[1], null, num(m[2]), num(m[3]), num(m[4]), m[5] ? num(m[5]) : null]);
    if (!dias.length) throw new Error("Não encontrei a tabela diária no PDF “indicadores_flash”.");
    const ano = +((dia.match(/(\d\d)\/(\d\d)\/(20\d\d),/) || [])[3] || new Date().getFullYear());
    dias.forEach(x => { const [d, mm] = x[0].split("/").map(Number); x[1] = AB[new Date(Date.UTC(ano, mm - 1, d)).getUTCDay()]; });
    const tot = dia.match(/Total\s+([\d.]+)\s+([\d.]+)\s+(\d+)%\s+[\d.]+\s+([\d,]+)%\s+([\d,]+)%/);
    const head = dia.match(/R\$\s*([\d.]+)\s+R\$\s*([\d.]+)\s+.*?R\$\s*([\d.]+)\s+(\d+)%\s*\n?\s*(\d+)%/s);
    const base = num((dia.match(/Base\s*\n?\s*([\d.]{9,})/) || [])[1]);
    const last = dias[dias.length - 1], prv = dias[dias.length - 2];
    const [dd, mm] = last[0].split("/").map(Number); const d1d = new Date(Date.UTC(ano, mm - 1, dd));
    const acum = tot ? num(tot[1]) : dias.reduce((s, x) => s + x[2], 0), metaAcBI = tot ? num(tot[2]) : dias.reduce((s, x) => s + x[3], 0);
    const proj = head ? num(head[3]) : null; if (!proj) av.push("Projeção do Power BI não encontrada.");
    // ---------- arquivo 2: fechamento por regional e por gerente
    const secR = (reg.split(/Fechamento por regional/i)[1] || "").split(/\n\s*Total\s/)[0];
    const totR = ((reg.split(/Fechamento por regional/i)[1] || "").match(/\n\s*Total\s+([\d.]+)\s+([\d.]+)/) || []);
    const regs = []; let semReg = 0;
    secR.split("\n").forEach(l => { const r = l.match(/^\s*([A-ZÇÃÁÉÍÓÚÂÊÔ][A-ZÇÃÁÉÍÓÚÂÊÔ0-9\/ \-]*?)\s+([\d.]+)\s+([\d.]+)\s+(\d+)%\s+(\d+)%\s+(?:([\d,]+)%)?(?:\s+([\d,]+)%)?/);
      if (r) { const fat = num(r[2]), meta = num(r[3]), parc = +r[5]; regs.push([r[1].trim(), fat, meta, parc, r[6] ? num(r[6]) : null, r[7] ? num(r[7]) : null, Math.round(fat - fat / (parc / 100)), "—"]); }
      else { const z = l.match(/^\s*([\d.]{5,})\s+([\d,]+)%/); if (z) semReg += num(z[1]); } });
    if (!regs.length) throw new Error("Não encontrei o “Fechamento por regional” no PDF de regionais.");
    regs.forEach(r => { r[7] = r[3] < 100 ? "Crítico" : (r[4] != null && r[4] < 3) ? "Proteger margem" : "Alavancar"; });
    const ger = []; const secG = (reg.split(/Fechamento por gerente/i)[1] || "").split(/Fechamento por regional/i)[0].split(/\n\s*Total\s/)[0];
    secG.split("\n").forEach(l => { const r = l.match(/^\s*([A-ZÇÃÁÉÍÓÚÂÊÔ][A-ZÇÃÁÉÍÓÚÂÊÔ ()\-.]+?)\s+([\d.]+)\s+([\d.]+)\s+(\d+)%\s+(\d+)%\s+([\d,]+)%/); if (r) ger.push([r[1].trim(), num(r[2]), num(r[3]), +r[5], num(r[6])]); });
    const metaBI = num(totR[2]) || (prev && prev.mes.metaBI);
    const somaReg = regs.reduce((s, x) => s + x[1], 0) + semReg, totReg = num(totR[1]);
    if (semReg) av.push(`${(semReg).toLocaleString("pt-BR")} em linha sem regional no Power BI.`);
    if (totReg && Math.abs(totReg - acum) > 1000) av.push(`Total por regional (${totReg.toLocaleString("pt-BR")}) difere do acumulado diário (${acum.toLocaleString("pt-BR")}) em ${Math.abs(totReg - acum).toLocaleString("pt-BR")}.`);
    // ---------- farol D-1 por regional: diferença do acumulado em relação à edição anterior
    const ratio = last[3] / metaBI; let farol = []; let farolTipo = "dia";
    const pIso = prev ? prev.d1.data.split("/").reverse().join("-") : null, dIso = d1d.toISOString().slice(0, 10);
    const prevOk = prev && pIso < dIso && prev.reg && prev.reg.length;
    if (prevOk) {
      // dias entre as edições (se pulou dias, a diferença soma mais de um dia)
      const metaPeriodo = dias.filter(x => { const [a, b] = x[0].split("/").map(Number); const iso = new Date(Date.UTC(ano, b - 1, a)).toISOString().slice(0, 10); return iso > pIso && iso <= dIso; }).reduce((s, x) => s + x[3], 0);
      farol = regs.map(r => { const p = prev.reg.find(x => x[0] === r[0]); const mp = r[2] * metaPeriodo / metaBI; return p && mp > 0 ? [r[0], Math.round((r[1] - p[1]) / mp * 100)] : null; }).filter(Boolean);
      if (farol.length < regs.length) av.push("Farol do dia calculado para as regionais presentes na edição anterior.");
    }
    if (!farol.length) { farol = regs.map(r => [r[0], r[3]]); farolTipo = "mes"; av.push("Farol mostra o atingimento parcial do mês: carregue os PDFs todo dia para o farol D-1 por regional."); }
    // ---------- calendário
    const uteis = dias.filter(x => { const [a, b] = x[0].split("/").map(Number); return util(new Date(Date.UTC(ano, b - 1, a))); }).length;
    let duRest = 0; const t = new Date(d1d); t.setUTCDate(t.getUTCDate() + 1); while (t.getUTCMonth() === d1d.getUTCMonth()) { if (util(t)) duRest++; t.setUTCDate(t.getUTCDate() + 1); }
    const mediaDU = acum / Math.max(1, uteis);
    // ---------- orçamento (mantém a tabela anual e atualiza o mês corrente)
    const orc = prev && prev.orc ? JSON.parse(JSON.stringify(prev.orc)) : Array.from({ length: 12 }, (_, i) => [["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][i], null, null, null, null]);
    const mi = d1d.getUTCMonth(); orc.forEach((r, i) => { if (i === mi) { r[1] = base || r[1]; r[2] = metaBI; r[3] = acum; r[5] = true; } });
    const metaOrc = orc[mi][1] || base;
    const metaAcOrc = metaOrc * metaAcBI / metaBI;
    const ds = `${String(dd).padStart(2, "0")}/${String(mm).padStart(2, "0")}/${ano}`;
    return {
      meta: { modo: "pdf", fonte: "Power BI (indicadores_flash + regionais)", atualizado: ds, farolTipo },
      d1: { data: ds, dia: SEM[d1d.getUTCDay()], fat: last[2], meta: last[3], vsD2: prv ? (last[2] / prv[2] - 1) * 100 : null },
      mes: { acum, metaAcOrc, metaAcBI, metaOrc, metaBI, proj, mgT: tot ? num(tot[4]) : null, mgA: tot ? num(tot[5]) : null, mediaDU, diasMeta: dias.filter(x => x[2] >= x[3]).length, diasTot: dias.length, duRest, metaMediaRest: (metaBI - metaAcBI) / Math.max(1, duRest) },
      proj3: [["Power BI", proj / 1e6], ["Calendário de metas", acum / metaAcBI * metaBI / 1e6], ["Ritmo por dia útil", (acum + mediaDU * duRest) / 1e6]],
      farol, reg: regs, ger, dias, orc, metaAno: (prev && prev.metaAno) || null,
      dds: prev && prev.dds || null, editorial: prev && prev.editorial || null, frase: prev && prev.frase || null, avisos: av
    };
  }
  root.FarolPDF = Object.assign(root.FarolPDF || {}, { parseBI, tipo });
  if (typeof module !== "undefined") module.exports = Object.assign(module.exports || {}, { parseBI, tipo });
})(typeof window !== "undefined" ? window : globalThis);
