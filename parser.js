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
