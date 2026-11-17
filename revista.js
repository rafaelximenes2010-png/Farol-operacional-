/* Farol Operacional · REVISTA DO DIA (Morning Operational News) — padrão simplificado, aprovado em 17/11/2026
   A4, 2 páginas: (1) Resumo do dia · (2) O mês até o D-1.
   Usa só os números da edição carregada (D, M, d1, atD1, atAcO, atAcB, falta, necDU). Nenhum valor estimado sem identificação.
   CSS todo escopado em .rv (a revista é montada dentro da página do app). */
(function () {
  const W = 794, H = 1123;
  const nf = v => v == null || !isFinite(v) ? "—" : Math.round(v).toLocaleString("pt-BR");
  const R$ = v => v == null || !isFinite(v) ? "—" : "R$ " + nf(v);
  const mi = (v, c = 1) => v == null || !isFinite(v) ? "—" : "R$ " + (v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: c, maximumFractionDigits: c }) + " mi";
  const sgn = v => (v >= 0 ? "+" : "−") + "R$ " + nf(Math.abs(v));
  const sgm = v => (v >= 0 ? "+" : "−") + mi(Math.abs(v), 2);
  const p0 = v => v == null || !isFinite(v) ? "—" : Math.round(v) + "%";
  const p1 = v => v == null || !isFinite(v) ? "—" : v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
  const p2 = v => v == null || !isFinite(v) ? "—" : v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
  const COR = { vd: "#1E8E3E", am: "#D99A00", vm: "#C00000", az: "#1F4E78", az2: "#2E5F8A", az3: "#6F95BD", az4: "#B5CCE5", az5: "#D4E4F7" };
  const cor = p => p >= 100 ? COR.vd : p >= 90 ? COR.am : COR.vm;
  const lista = a => a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " e " + a[a.length - 1];
  const SEMm = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  const MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const CSS = `<style>
.rv{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#fff;color:#1d2433;font-family:Inter,"Segoe UI",system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;text-align:left;line-height:1.3}
.rv *{box-sizing:border-box;margin:0;padding:0}
.rv .rs-top{background:${COR.az};color:#fff;padding:34px 53px 26px;display:flex;align-items:center;justify-content:space-between}
.rv .rs-top.slim{padding:23px 53px}
.rv .lg{background:#fff;border-radius:11px;padding:8px 13px;line-height:0}.rv .lg img{height:40px;width:auto;display:block}
.rv .rs-top.slim .lg img{height:30px}
.rv .rs-ti{text-align:right}
.rv .rs-k{font-size:7.5pt;letter-spacing:.18em;font-weight:700;color:${COR.az5}}
.rv .rs-t{font-size:17pt;font-weight:800;margin-top:4px}.rv .rs-top.slim .rs-t{font-size:13pt}
.rv .rs-d{font-size:8.5pt;color:${COR.az5};margin-top:4px}
.rv .rs-vm{height:5px;background:${COR.vm}}
.rv .rs-bd{padding:26px 53px 0}
.rv .rs-h1{font-size:15pt;line-height:1.25;font-weight:800;color:${COR.az}}
.rv .rs-sub{font-size:8.5pt;color:#5b6475;margin-top:6px}
.rv .rs-h2{font-size:8pt;letter-spacing:.14em;font-weight:800;color:${COR.az};text-transform:uppercase;margin:24px 0 10px;display:flex;align-items:center;gap:8px}
.rv .rs-h2 i{width:4.5px;height:13px;background:${COR.vm};border-radius:1.5px;flex:none}
.rv .rs-h2 small{font-size:7pt;letter-spacing:0;text-transform:none;font-weight:500;color:#5b6475;margin-left:auto}
.rv .rs-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-top:21px}
.rv .rs-kpi{border:1px solid #e3e8ef;border-top:4.5px solid ${COR.az};border-radius:9px;padding:12px 13px}
.rv .rs-kpi .l{font-size:6.8pt;letter-spacing:.1em;font-weight:700;color:#5b6475;text-transform:uppercase}
.rv .rs-kpi .v{font-size:15pt;font-weight:800;color:${COR.az};margin-top:5px;white-space:nowrap}
.rv .rs-kpi .s{font-size:7.2pt;color:#5b6475;margin-top:3px}
.rv .rs-farol{display:grid;gap:7px}
.rv .rs-fr{border:1px solid #e3e8ef;border-radius:9px;padding:10px 3px 8px;text-align:center}
.rv .rs-fr i{display:block;width:19px;height:19px;border-radius:50%;margin:0 auto 6px}
.rv .rs-fr b{display:block;font-size:6.6pt;color:#2b3445;min-height:20px;line-height:1.2}
.rv .rs-fr span{display:block;font-size:12pt;font-weight:800;margin-top:2px}
.rv .rs-leg{display:flex;gap:15px;font-size:7pt;color:#5b6475;margin-top:8px}.rv .rs-leg i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:4px;vertical-align:-1px}
.rv .rs-cols{display:grid;grid-template-columns:1.25fr 1fr;gap:19px}
.rv .rs-ed{background:#f4f7fb;border-radius:9px;padding:15px 17px;font-size:9pt;line-height:1.5;color:#253046}
.rv .rs-ed .au{font-size:7.5pt;color:#5b6475;font-style:italic;text-align:right;margin-top:8px}
.rv .rs-facts{display:grid;gap:9px;align-content:start}
.rv .rs-fa{border-left:4px solid ${COR.az2};padding:2px 0 2px 11px;font-size:8pt;line-height:1.45;color:#2b3445}
.rv .rs-fa b{display:block;font-size:6.8pt;letter-spacing:.1em;color:${COR.az2};margin-bottom:2px}
.rv .rs-fa.vm{border-left-color:${COR.vm}}.rv .rs-fa.vm b{color:${COR.vm}}
.rv .rs-dds{margin-top:23px;border:1px solid #f0dca8;background:#fffaf0;border-radius:9px;padding:13px 16px;font-size:8.3pt;line-height:1.5;color:#3d3420}
.rv .rs-dds b{display:block;font-size:6.8pt;letter-spacing:.12em;color:#8a6200;margin-bottom:3px}
.rv .rs-fz{margin-top:15px;background:${COR.az};color:#fff;border-radius:9px;padding:15px 19px;font-size:10pt;font-style:italic;font-weight:600;line-height:1.4}
.rv .rs-fz b{display:block;font-style:normal;font-size:6.8pt;letter-spacing:.14em;color:${COR.az5};margin-bottom:4px;font-weight:700}
.rv .rs-ft{position:absolute;left:53px;right:53px;bottom:30px;border-top:1px solid #e3e8ef;padding-top:9px;display:flex;justify-content:space-between;gap:23px;font-size:6.4pt;color:#8a93a4;line-height:1.45}
.rv .rs-ft .cp{font-weight:800;font-style:italic;color:${COR.az};white-space:nowrap;font-size:7.5pt}.rv .rs-ft .cp em{color:${COR.vm}}
.rv table{width:100%;border-collapse:collapse;font-size:8pt}
.rv th{background:${COR.az};color:#fff;font-size:6.8pt;letter-spacing:.08em;text-transform:uppercase;font-weight:700;padding:7px 8px;text-align:right}
.rv th:first-child{text-align:left;border-radius:6px 0 0 0}.rv th:last-child{border-radius:0 6px 0 0}
.rv td{padding:7px 8px;border-bottom:1px solid #e3e8ef;text-align:right;font-variant-numeric:tabular-nums}
.rv td:first-child{text-align:left;font-weight:700;color:#253046}
.rv tbody tr:nth-child(even) td{background:#f8fafd}
.rv tfoot td{font-weight:800;border-top:2px solid ${COR.az};border-bottom:0}
.rv .rs-pb{display:flex;align-items:center;gap:8px;justify-content:flex-end}
.rv .rs-pb .tr{width:83px;height:7px;background:#e8edf4;border-radius:4px;position:relative;overflow:hidden}
.rv .rs-pb .tr span{position:absolute;left:0;top:0;bottom:0;border-radius:4px}
.rv .rs-pb b{width:34px;text-align:right}
.rv .rs-chart{border:1px solid #e3e8ef;border-radius:9px;padding:11px 11px 7px}
.rv .rs-proj{display:grid;gap:8px}
.rv .rs-pr{display:grid;grid-template-columns:128px 1fr 83px;align-items:center;gap:11px;font-size:8pt}
.rv .rs-pr .tr{height:17px;background:#eef2f7;border-radius:4.5px;position:relative}
.rv .rs-pr .tr span{position:absolute;left:0;top:0;bottom:0;border-radius:4.5px}
.rv .rs-pr .vv{font-weight:800;text-align:right;color:${COR.az}}
.rv .rs-note{font-size:6.8pt;color:#5b6475;margin-top:6px}
</style>`;

  const topo = (kicker, titulo, sub, slim) => `<div class="rs-top${slim ? " slim" : ""}"><div class="lg"><img src="${window.__LOGO || "icons/marca-los.png"}" alt="Grupo LOS"></div>
<div class="rs-ti"><div class="rs-k">${kicker}</div><div class="rs-t">${titulo}</div><div class="rs-d">${sub}</div></div></div><div class="rs-vm"></div>`;
  const rodape = (fontes, pg) => `<div class="rs-ft"><div>${fontes} · página ${pg} de 2</div><div class="cp">Carro parado é <em>prejuízo</em>.</div></div>`;
  const h2 = (t, s) => `<div class="rs-h2"><i></i>${t}${s ? `<small>${s}</small>` : ""}</div>`;
  const kpi = (l, v, s, c) => `<div class="rs-kpi"${c ? ` style="border-top-color:${c}"` : ""}><div class="l">${l}</div><div class="v"${c ? ` style="color:${c}"` : ""}>${v}</div><div class="s">${s}</div></div>`;

  function barrasDia() {
    const w = 650, h = 190, L = 34, R = 8, T = 16, B = 30, n = D.dias.length;
    const top = Math.max(...D.dias.map(x => Math.max(x[2], x[3]))) * 1.12, stepV = top > 12e6 ? 5e6 : top > 6e6 ? 2.5e6 : 1e6;
    const ih = h - T - B, st = (w - L - R) / n, bw = st * .62, y = v => T + ih * (1 - v / top); let s = "";
    for (let g = 0; g <= top; g += stepV) s += `<line x1="${L}" x2="${w - R}" y1="${y(g)}" y2="${y(g)}" stroke="#e8edf4"/><text x="${L - 5}" y="${y(g) + 3}" font-size="8" fill="#8a93a4" text-anchor="end">${(g / 1e6).toLocaleString("pt-BR")} mi</text>`;
    D.dias.forEach((x, i) => { const X = L + i * st + (st - bw) / 2, p = x[2] / x[3] * 100, c = cor(p), cx = X + bw / 2, lb = String(x[0]).slice(0, 2);
      s += `<rect x="${X}" y="${y(x[2])}" width="${bw}" height="${y(0) - y(x[2])}" rx="2" fill="${c}"/><line x1="${X - 2}" x2="${X + bw + 2}" y1="${y(x[3])}" y2="${y(x[3])}" stroke="${COR.az}" stroke-width="2"/>`;
      s += `<text x="${cx}" y="${Math.min(y(x[2]), y(x[3])) - 4}" font-size="7.5" font-weight="700" fill="${c}" text-anchor="middle">${p0(p)}</text>`;
      s += `<text x="${cx}" y="${h - B + 12}" font-size="8" fill="#253046" text-anchor="middle" font-weight="600">${esc(lb)}</text><text x="${cx}" y="${h - B + 22}" font-size="7" fill="#8a93a4" text-anchor="middle">${esc(x[1] || "")}</text>`; });
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="display:block">${s}</svg>`;
  }

  function html() {
    const [dd, mm, aa] = d1.data.split("/").map(Number), ed = new Date(aa, mm - 1, dd + 1), dD = new Date(aa, mm - 1, dd);
    const edS = `${String(ed.getDate()).padStart(2, "0")}/${String(ed.getMonth() + 1).padStart(2, "0")}/${ed.getFullYear()}`;
    const F = D.farol.filter(f => typeof f[1] === "number"), nG = F.filter(x => x[1] >= 100).length, verm = F.filter(x => x[1] < 90);
    const regs = [...D.reg], abaixo = regs.filter(r => r[3] < 100), devendo = abaixo.reduce((s, r) => s + Math.max(0, -r[6]), 0);
    const pj = (D.proj3 || []).map(x => x[1] * 1e6), pmin = Math.min(...pj), pmax = Math.max(...pj), todas = pj.length && pj.every(v => v >= M.metaOrc);
    const diasOk = D.dias.filter(x => x[2] >= x[3]).length, dd2 = D.dias.map(x => [x[0], x[2] / x[3] * 100]);
    const bd = dd2.reduce((m, x) => x[1] > m[1] ? x : m, dd2[0]), wd = dd2.reduce((m, x) => x[1] < m[1] ? x : m, dd2[0]);
    const vsMedia = (necDU / M.mediaDU - 1) * 100, faltaBI = M.metaBI - M.acum;
    const fonte = esc((D.meta && D.meta.fonte) || "Power BI · indicadores_flash");
    const mesAb = MES[dD.getMonth()];

    const txtRitmo = falta > 0 ? `Faltam ${R$(falta)} para a meta orçada em ${M.duRest} dias úteis: ${R$(necDU)} por dia útil, ${p1(Math.abs(vsMedia))} ${vsMedia <= 0 ? "abaixo" : "acima"} da média realizada (${R$(M.mediaDU)}).`
      : `A meta orçada do mês (${mi(M.metaOrc)}) já foi atingida: ${R$(-falta)} acima.`;
    const txtProj = pj.length ? `As ${pj.length} metodologias apontam entre ${mi(pmin)} e ${mi(pmax)} — ${todas ? "todas acima" : pj.some(v => v >= M.metaOrc) ? "nem todas acima" : "todas abaixo"} da meta orçada de ${mi(M.metaOrc)}.` : `Projeção do Power BI: ${mi(M.proj)}.`;
    const txtAbaixo = abaixo.length ? `${lista(abaixo.map(r => esc(r[0])))} ${abaixo.length > 1 ? "deixaram" : "deixou"} de faturar ${R$(devendo)} frente à meta proporcional até o D-1.` : "Todas as regionais estão acima de 100% da meta proporcional do mês.";

    const nF = Math.min(9, D.farol.length) || 1;
    const farol = D.farol.map(([n, p]) => { const ok = typeof p === "number", c = ok ? cor(p) : "#cfd6e2";
      return `<div class="rs-fr"><i style="background:${c}"></i><b>${esc(n)}</b><span style="color:${ok ? c : "#9aa3b5"}">${ok ? p0(p) : "—"}</span></div>`; }).join("");

    const pag1 = `<div class="rv">${topo("CT LOS · FAROL OPERACIONAL", "Morning Operational News", `Edição de ${SEMm[ed.getDay()]}, ${edS} · Resultado de ${d1.data}`)}
<div class="rs-bd">
 <div class="rs-h1">Grupo LOS fecha o D-1 em ${p0(atD1)} da meta e acumula ${p0(atAcO)} da meta orçada proporcional</div>
 <div class="rs-sub">Meta orçada ${mi(M.metaOrc)} · meta Power BI ${mi(M.metaBI)} · ${nG} de ${F.length} regionais no verde${verm.length ? " · atenção para " + lista(verm.map(x => esc(x[0]))) : ""}</div>
 <div class="rs-kpis">
  ${kpi("Faturamento D-1", mi(d1.fat, 2), `${p0(atD1)} da meta (${mi(d1.meta, 2)}) · ${sgn(d1.fat - d1.meta)}`, cor(atD1))}
  ${kpi("Acumulado do mês", mi(M.acum, 2), `${p0(atAcO)} da orçada · ${p0(atAcB)} BI`)}
  ${kpi("Projeção do mês", mi(M.proj, 2), `${p0(M.proj / M.metaOrc * 100)} da orçada · ${p0(M.proj / M.metaBI * 100)} BI`)}
  ${falta > 0 ? kpi("Necessário / dia útil", mi(necDU, 2), `${M.duRest} dias úteis · média atual ${mi(M.mediaDU, 2)}`) : kpi("Meta orçada do mês", "Atingida", `${sgn(-falta)} acima`, COR.vd)}
 </div>
 ${h2("Farol do dia por regional", "D-1 · " + d1.data)}
 <div class="rs-farol" style="grid-template-columns:repeat(${nF},1fr)">${farol}</div>
 <div class="rs-leg"><span><i style="background:${COR.vd}"></i>Verde ≥ 100%</span><span><i style="background:${COR.am}"></i>Amarelo 90–99%</span><span><i style="background:${COR.vm}"></i>Vermelho &lt; 90%</span></div>
 ${h2("Leitura do dia")}
 <div class="rs-cols"${D.editorial ? "" : ` style="grid-template-columns:1fr"`}>
  ${D.editorial ? `<div class="rs-ed">${esc(D.editorial.texto)}<div class="au">— ${esc(D.editorial.autor)}</div></div>` : ""}
  <div class="rs-facts">
   <div class="rs-fa"><b>RITMO PARA A META</b>${txtRitmo}</div>
   <div class="rs-fa"><b>FECHAMENTO PROJETADO</b>${txtProj}</div>
   <div class="rs-fa${abaixo.length ? " vm" : ""}"><b>${abaixo.length ? "ABAIXO DA META PROPORCIONAL" : "META PROPORCIONAL"}</b>${txtAbaixo}</div>
  </div>
 </div>
 ${D.dds ? `<div class="rs-dds"><b>SEGURANÇA EM PRIMEIRO LUGAR · DDS DO DIA</b>${D.dds.titulo ? `<strong>${esc(String(D.dds.titulo).replace(/^\s*DDS:\s*/i, ""))}.</strong> ` : ""}${esc(D.dds.texto)}${D.dds.autor ? ` <i>— ${esc(D.dds.autor)}</i>` : ""}</div>` : ""}
 ${D.frase ? `<div class="rs-fz"><b>PARA O DIA</b>“${esc(String(D.frase.texto).replace(/^[“"]|[”"]$/g, ""))}”${D.frase.autor ? ` — ${esc(D.frase.autor)}` : ""}</div>` : ""}
</div>${rodape(`Fontes: ${fonte}. Projeção conforme o Power BI, não é resultado realizado`, 1)}</div>`;

    const regF = [...regs].sort((a, b) => b[1] - a[1]), totF = regF.reduce((s, r) => s + r[1], 0), totM = regF.reduce((s, r) => s + r[2], 0);
    const pmx = Math.max(150, ...regF.map(r => Math.min(r[3], 150)));
    const linhas = regF.map(r => `<tr><td>${esc(r[0])}</td><td>${nf(r[1])}</td><td>${nf(r[2])}</td><td>${p0(r[1] / r[2] * 100)}</td><td><div class="rs-pb"><div class="tr"><span style="width:${Math.min(r[3], pmx) / pmx * 100}%;background:${cor(r[3])}"></span></div><b style="color:${cor(r[3])}">${p0(r[3])}</b></div></td></tr>`).join("");
    const P = [...(D.proj3 || []).map((x, i) => [x[0], x[1] * 1e6, [COR.az, COR.az2, COR.az3][i % 3]]), ["Meta orçada", M.metaOrc, COR.vm], ["Meta Power BI", M.metaBI, COR.az4]];
    const pMax = Math.max(...P.map(x => x[1])) * 1.06;
    const dif = Math.abs(totF - M.acum) > 1000 ? ` As linhas do fechamento somam ${R$(Math.abs(totF - M.acum))} a ${totF > M.acum ? "mais" : "menos"} que o faturamento total do Power BI (${R$(M.acum)}).` : "";

    const pag2 = `<div class="rv">${topo(`ACUMULADO DO MÊS · ${mesAb.toUpperCase()}/${aa}`, "O mês até o D-1", `01 a ${d1.data} · Grupo LOS consolidado`, true)}
<div class="rs-bd">
 <div class="rs-kpis" style="margin-top:0">
  ${kpi("Meta acum. orçada", mi(M.metaAcOrc, 2), M.metaAcBI ? "Power BI: " + mi(M.metaAcBI, 2) : "até o D-1")}
  ${kpi("Desvio acumulado", sgm(M.acum - M.metaAcOrc), "contra a meta orçada até o D-1", M.acum >= M.metaAcOrc ? COR.vd : COR.vm)}
  ${kpi("Dias na meta", `${diasOk} de ${D.dias.length}`, bd ? `melhor ${esc(bd[0])} (${p0(bd[1])}) · pior ${esc(wd[0])} (${p0(wd[1])})` : "")}
  ${kpi("Margens terc. | agr.", `${p2(M.mgT)} | ${p2(M.mgA)}`, "ponderadas, conforme Power BI")}
 </div>
 ${h2("Faturamento diário x meta", "barra = realizado (cor do farol) · traço = meta do dia")}
 <div class="rs-chart">${barrasDia()}</div>
 ${h2("Fechamento do mês por regional", "ordenado por faturamento · parcial = vs meta proporcional")}
 <table><thead><tr><th>Regional</th><th>Faturamento</th><th>Meta do mês</th><th>Ating. total</th><th>Ating. parcial</th></tr></thead>
 <tbody>${linhas}</tbody>
 <tfoot><tr><td>Total das ${regF.length} linhas</td><td>${nf(totF)}</td><td>${nf(totM)}</td><td>${p0(totF / totM * 100)}</td><td>${regF.filter(r => r[3] >= 100).length} de ${regF.length} ≥ 100%</td></tr></tfoot></table>
 ${h2("Fechamento projetado x metas", "estimativas — não são realizado")}
 <div class="rs-proj">${P.map(([n, v, c]) => `<div class="rs-pr"><span>${esc(n)}</span><div class="tr"><span style="width:${v / pMax * 100}%;background:${c}"></span></div><span class="vv">${mi(v)}</span></div>`).join("")}</div>
 <div class="rs-note">${falta > 0 ? `Faltam ${mi(falta)} para a meta orçada${faltaBI > 0 ? ` (${mi(faltaBI)} para a meta do Power BI)` : ""}.` : "Meta orçada do mês já atingida."}</div>
</div>${rodape(`Fontes: ${fonte}; fechamento por regional.${dif}`, 2)}</div>`;

    return CSS + pag1 + pag2;
  }

  /* documento completo para impressão (PDF vetorial pelo navegador) */
  function documento() {
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Morning Operational News CT LOS ${typeof isoOf === "function" ? isoOf(d1.data) : d1.data}</title>
<style>@page{size:A4;margin:0}html,body{margin:0;padding:0;background:#fff}.rv{width:210mm!important;height:296.5mm!important;page-break-after:always;break-after:page}.rv:last-child{page-break-after:auto;break-after:auto}</style></head><body>${html()}</body></html>`;
  }
  window.FarolRevista = { html, documento, W, H };
})();
