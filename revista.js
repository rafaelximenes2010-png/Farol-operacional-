/* Farol Operacional · REVISTA DO DIA (Morning Operational News)
   Gera a revista no padrão aprovado (A4, 6 páginas): capa, O dia em perspectiva, Panorama D-1,
   Acumulado geral, Passado x Futuro e Orçamento mês a mês (+ alcance da super meta).
   Usa só os números da edição carregada (D, M, d1…). Regra: nunca tirar conteúdo do padrão. */
(function () {
  const W = 794, H = 1123;
  const nf = v => v == null ? "—" : Math.round(v).toLocaleString("pt-BR");
  const f1 = v => (v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const mi1 = v => "R$ " + f1(v) + " mi";
  const sgn = v => (v >= 0 ? "+" : "−") + "R$ " + nf(Math.abs(v));
  const sgm = v => (v >= 0 ? "+" : "−") + f1(Math.abs(v)) + " mi";
  const p0 = v => v == null || !isFinite(v) ? "—" : Math.round(v) + "%";
  const p2 = v => v == null || !isFinite(v) ? "—" : v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
  const p1 = v => v == null || !isFinite(v) ? "—" : v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
  const cor = p => p >= 100 ? "#1e8e4e" : p >= 90 ? "#d08a0e" : "#c62828";
  const st = p => p >= 100 ? "ACIMA DA META" : p >= 90 ? "PRÓXIMO DA META" : "EM ATENÇÃO";
  const acao = p => p >= 100 ? "Meta batida.<br>Manter o ritmo." : p >= 90 ? "Perto da meta.<br>Acelerar a execução." : "Recuperar volume<br>e acelerar a<br>execução.";
  const lista = a => a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " e " + a[a.length - 1];
  const MESES = { Jan: "Janeiro", Fev: "Fevereiro", Mar: "Março", Abr: "Abril", Mai: "Maio", Jun: "Junho", Jul: "Julho", Ago: "Agosto", Set: "Setembro", Out: "Outubro", Nov: "Novembro", Dez: "Dezembro" };
  const SEMF = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const SEMm = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const CSS = `<style>
.rv{width:${W}px;height:${H}px;background:#fff;color:#14213d;font-family:"Segoe UI",system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif;position:relative;overflow:hidden;box-sizing:border-box}
.rv *{box-sizing:border-box}
.rv .hd{position:relative;color:#fff;padding:22px 34px 18px;height:132px}
.rv .lg{position:absolute;left:34px;top:26px;background:#fff;border-radius:10px;padding:8px 14px}.rv .lg img{height:52px;width:auto;display:block}
.rv .sec{position:absolute;right:34px;top:22px;text-align:right}
.rv .sec .n{font-size:22px;font-weight:900;font-style:italic;color:#ffd7d7}.rv .sec .k{font-size:9.5px;letter-spacing:.24em;font-weight:700;opacity:.92;border-left:1px solid rgba(255,255,255,.6);padding-left:10px;margin-left:8px}
.rv .sec .t{font-size:27px;font-weight:900;font-style:italic;letter-spacing:.01em;margin-top:2px;line-height:1.05}
.rv .sec .s{font-size:12.5px;margin-top:5px;opacity:.95}
.rv .bd{padding:14px 34px 0}
.rv .lead{font-size:12.6px;line-height:1.5;margin:4px 0 12px}.rv .lead .cap{float:left;font-size:44px;line-height:.9;font-weight:900;margin:3px 8px 0 0}
.rv h4{flex-wrap:wrap;font-size:12px;letter-spacing:.06em;font-weight:900;color:#0f2350;margin:14px 0 7px;display:flex;align-items:center;gap:7px;text-transform:uppercase}
.rv h4:before{content:"";width:9px;height:9px;border-radius:2px;background:var(--ac,#c62828)}
.rv h4 small{margin-left:auto;font-size:9px;font-weight:500;letter-spacing:0;color:#7a8296;text-transform:none}
.rv h4 i{flex-basis:100%;margin-top:1px;font-style:normal;font-weight:500;font-size:9px;color:#7a8296;letter-spacing:0;text-transform:none;display:block}
.rv .card{border:1px solid #e3e7ef;border-radius:10px;background:#fff;box-shadow:0 1px 4px rgba(15,35,80,.06)}
.rv .kg{display:grid;gap:0}.rv .kg>div{padding:10px 12px;border-right:1px solid #e3e7ef}.rv .kg>div:last-child{border-right:0}
.rv .kl{font-size:8.6px;letter-spacing:.12em;font-weight:700;color:#5b6478;text-transform:uppercase}
.rv .kv{font-size:20px;font-weight:900;margin:3px 0 2px;color:#0f2350;white-space:nowrap}.rv .ks{font-size:9px;color:#5b6478}
.rv .mini{display:grid;background:#f4f6fa;border-radius:8px;margin-top:8px}.rv .mini>div{padding:7px 10px}.rv .mini .kl{font-size:7.6px}.rv .mini b{font-size:12.5px;color:#0f2350;display:block;margin-top:2px}
.rv table{width:100%;border-collapse:collapse;font-size:9.4px}.rv th{color:#fff;font-size:7.8px;letter-spacing:.06em;padding:5px 6px;text-align:right;font-weight:800;text-transform:uppercase}
.rv td{padding:3.6px 6px;border-bottom:1px solid #eef1f6;text-align:right;white-space:nowrap}.rv th:first-child,.rv td:first-child{text-align:left}
.rv tr.tot td{font-weight:800;background:#f4f6fa;border-top:1px solid #cfd6e4}
.rv .note{font-size:8.2px;color:#6b7386;line-height:1.4;margin-top:5px}
.rv .ft{position:absolute;left:34px;right:34px;bottom:14px;border-top:1px solid #e3e7ef;padding-top:7px;display:flex;justify-content:space-between;align-items:flex-end;gap:20px}
.rv .ft .src{font-size:7.6px;color:#8a92a6;line-height:1.4;max-width:540px}.rv .ft .cp{font-size:11px;font-weight:900;font-style:italic;color:#c62828;white-space:nowrap}
.rv .pg{position:absolute;right:34px;bottom:2px;font-size:7px;color:#a3aabb}
.rv .dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:4px;vertical-align:1px}
.rv .bar{position:relative;height:7px;background:#eef1f6;border-radius:4px;flex:1}.rv .bar span{position:absolute;left:0;top:0;bottom:0;border-radius:4px}.rv .bar em{position:absolute;top:-3px;bottom:-3px;width:2px;background:#0f2350;opacity:.55}
.rv .serif{font-family:Georgia,"Times New Roman",serif}
</style>`;

  const hdr = (n, kicker, titulo, sub, bg) => `<div class="hd" style="background:${bg}"><div class="lg"><img src="${window.__LOGO || "icons/logo-los.png"}"></div>
<div class="sec"><div><span class="n">${n}</span><span class="k">${kicker}</span></div><div class="t">${titulo}</div><div class="s">${sub}</div></div></div>`;
  const foot = (src, frase, pg) => `<div class="ft"><div class="src">${src}</div><div class="cp">${frase}</div></div><div class="pg">Morning Operational News · CT LOS · página ${pg} de 6</div>`;
  const lead = (txt, cap) => `<div class="lead"><span class="cap" style="color:${cap}">${txt[0]}</span>${txt.slice(1)}</div>`;

  /* ---------- gráficos (SVG simples, sem dependências) ---------- */
  function linhaAcum(w, h) {
    let ar = 0, am = 0; const pts = D.dias.map(x => { ar += x[2]; am += x[3]; return [x[0], ar, am]; });
    const pad = { l: 34, r: 74, t: 12, b: 22 }, mx = Math.max(...pts.map(p => Math.max(p[1], p[2]))) * 1.08;
    const X = i => pad.l + (w - pad.l - pad.r) * (pts.length < 2 ? 0 : i / (pts.length - 1)), Y = v => pad.t + (h - pad.t - pad.b) * (1 - v / mx);
    let g = ""; const step = mx > 60e6 ? 20e6 : mx > 20e6 ? 10e6 : 5e6;
    for (let v = 0; v <= mx; v += step) g += `<line x1="${pad.l}" x2="${w - pad.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="#eef1f6"/><text x="${pad.l - 4}" y="${Y(v) + 3}" font-size="7.5" text-anchor="end" fill="#7a8296">${Math.round(v / 1e6)} mi</text>`;
    g += `<path d="${pts.map((p, i) => (i ? "L" : "M") + X(i) + " " + Y(p[1])).join(" ")} L${X(pts.length - 1)} ${Y(0)} L${X(0)} ${Y(0)}Z" fill="rgba(27,58,122,.08)"/>`;
    g += `<path d="${pts.map((p, i) => (i ? "L" : "M") + X(i) + " " + Y(p[2])).join(" ")}" fill="none" stroke="#c62828" stroke-width="1.4" stroke-dasharray="4 3"/>`;
    g += `<path d="${pts.map((p, i) => (i ? "L" : "M") + X(i) + " " + Y(p[1])).join(" ")}" fill="none" stroke="#0f2350" stroke-width="2"/>`;
    pts.forEach((p, i) => { g += `<circle cx="${X(i)}" cy="${Y(p[1])}" r="2" fill="#0f2350"/>`; if (i % 2 === 0 || i === pts.length - 1) g += `<text x="${X(i)}" y="${h - 8}" font-size="7" text-anchor="middle" fill="#7a8296">${p[0]}</text>`; });
    const L = pts[pts.length - 1];
    g += `<text x="${X(pts.length - 1) + 5}" y="${Y(L[1]) + 2}" font-size="8" font-weight="800" fill="#0f2350">Real ${mi1(L[1])}</text><text x="${X(pts.length - 1) + 5}" y="${Y(L[2]) + 11}" font-size="8" font-weight="800" fill="#c62828">Meta ${mi1(L[2])}</text>`;
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${g}</svg>`;
  }
  function barrasDia(w, h) {
    const pad = { l: 30, r: 6, t: 10, b: 22 }, mx = Math.max(...D.dias.map(x => Math.max(x[2], x[3]))) * 1.1, n = D.dias.length, bw = (w - pad.l - pad.r) / n;
    const Y = v => pad.t + (h - pad.t - pad.b) * (1 - v / mx); let g = ""; const step = mx > 12e6 ? 5e6 : 2e6;
    for (let v = 0; v <= mx; v += step) g += `<line x1="${pad.l}" x2="${w - pad.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="#eef1f6"/><text x="${pad.l - 4}" y="${Y(v) + 3}" font-size="7.5" text-anchor="end" fill="#7a8296">${Math.round(v / 1e6)} mi</text>`;
    D.dias.forEach((x, i) => { const p = x[2] / x[3] * 100, X0 = pad.l + i * bw + bw * .18, ww = bw * .64;
      g += `<rect x="${X0}" y="${Y(x[2])}" width="${ww}" height="${Y(0) - Y(x[2])}" fill="${cor(p)}" rx="1.5"/><line x1="${X0 - 2}" x2="${X0 + ww + 2}" y1="${Y(x[3])}" y2="${Y(x[3])}" stroke="#14213d" stroke-width="1.6"/>`;
      if (i % 2 === 0 || i === n - 1) g += `<text x="${X0 + ww / 2}" y="${h - 8}" font-size="7" text-anchor="middle" fill="#7a8296">${x[0]}</text>`; });
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${g}</svg>`;
  }
  function trajetoria(w, h) {
    const [dd, mm, aa] = d1.data.split("/").map(Number), nd = new Date(aa, mm, 0).getDate();
    const pad = { l: 34, r: 120, t: 12, b: 22 }, top = Math.max(M.proj, M.metaOrc) * 1.12;
    const X = d => pad.l + (w - pad.l - pad.r) * ((d - 1) / (nd - 1)), Y = v => pad.t + (h - pad.t - pad.b) * (1 - v / top);
    let g = ""; for (let v = 0; v <= top; v += 50e6) g += `<line x1="${pad.l}" x2="${w - pad.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="#eef1f6"/><text x="${pad.l - 4}" y="${Y(v) + 3}" font-size="7.5" text-anchor="end" fill="#7a8296">${Math.round(v / 1e6)} mi</text>`;
    [1, 5, 10, 15, 20, 25, 30].filter(d => d <= nd).forEach(d => g += `<text x="${X(d)}" y="${h - 8}" font-size="7" text-anchor="middle" fill="#7a8296">${String(d).padStart(2, "0")}</text>`);
    let a = 0; const pts = D.dias.map(x => { a += x[2]; return [+x[0].slice(0, 2), a]; });
    g += `<path d="M${X(1)} ${Y(0)} L${X(nd)} ${Y(M.metaOrc)}" stroke="#0f2350" stroke-dasharray="4 3" stroke-width="1.2" fill="none"/>`;
    const L = pts[pts.length - 1];
    g += `<path d="M${X(L[0])} ${Y(L[1])} L${X(nd)} ${Y(M.proj)}" stroke="#7c3aed" stroke-dasharray="4 3" stroke-width="1.6" fill="none"/>`;
    g += `<path d="${pts.map((p, i) => (i ? "L" : "M") + X(p[0]) + " " + Y(p[1])).join(" ")} L${X(L[0])} ${Y(0)} L${X(pts[0][0])} ${Y(0)}Z" fill="rgba(37,99,235,.12)"/><path d="${pts.map((p, i) => (i ? "L" : "M") + X(p[0]) + " " + Y(p[1])).join(" ")}" stroke="#2563eb" stroke-width="2" fill="none"/>`;
    g += `<line x1="${X(L[0])}" x2="${X(L[0])}" y1="${pad.t}" y2="${Y(0)}" stroke="#9aa3b5" stroke-dasharray="2 2"/><text x="${X(L[0]) + 3}" y="${pad.t + 8}" font-size="7.5" fill="#5b6478">hoje (D-1)</text>`;
    g += `<circle cx="${X(nd)}" cy="${Y(M.proj)}" r="3" fill="#7c3aed"/><text x="${X(nd) + 6}" y="${Y(M.proj) + 3}" font-size="8" font-weight="800" fill="#7c3aed">Projeção ${mi1(M.proj)}</text>`;
    g += `<text x="${X(nd) + 6}" y="${Y(M.metaOrc) + 12}" font-size="8" font-weight="800" fill="#0f2350">Meta orç. ${mi1(M.metaOrc)}</text>`;
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${g}</svg>`;
  }
  function hbars(items, w, lw) { // items: [rótulo, valor, cor, texto]
    const mx = Math.max(...items.map(x => Math.abs(x[1]))) || 1, neg = items.some(x => x[1] < 0);
    return items.map(([l, v, c, t]) => { const pc = Math.abs(v) / mx * (neg ? 50 : 100);
      return `<div style="display:flex;align-items:center;gap:6px;margin:2.5px 0;font-size:8.6px"><span style="width:${lw}px;text-align:right;font-weight:800;color:#14213d;white-space:nowrap">${l}</span>
<span style="position:relative;flex:1;height:10px">${neg ? `<i style="position:absolute;left:50%;top:-2px;bottom:-2px;width:1px;background:#9aa3b5"></i>` : ""}<i style="position:absolute;top:0;bottom:0;border-radius:2px;background:${c};${neg ? (v >= 0 ? `left:50%;width:${pc}%` : `right:50%;width:${pc}%`) : `left:0;width:${pc}%`}"></i></span>
<b style="width:70px;color:${c};font-size:8.6px;white-space:nowrap">${t}</b></div>`; }).join("");
  }
  function orcBarras(w, h) {
    const F = D.orc, pad = { l: 36, r: 8, t: 10, b: 22 }, mx = Math.max(...F.map(x => Math.max(x[1] || 0, x[3] || 0, x[2] || 0))) * 1.1, bw = (w - pad.l - pad.r) / F.length;
    const Y = v => pad.t + (h - pad.t - pad.b) * (1 - v / mx); let g = "";
    for (let v = 0; v <= mx; v += 50e6) g += `<line x1="${pad.l}" x2="${w - pad.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="#eef1f6"/><text x="${pad.l - 4}" y="${Y(v) + 3}" font-size="7.5" text-anchor="end" fill="#7a8296">${Math.round(v / 1e6)} mi</text>`;
    F.forEach((x, i) => { const X0 = pad.l + i * bw, b = bw * .32;
      if (x[1]) g += `<rect x="${X0 + bw * .14}" y="${Y(x[1])}" width="${b}" height="${Y(0) - Y(x[1])}" fill="#cfd6e2" rx="1.5"/>`;
      if (x[3] != null) g += `<rect x="${X0 + bw * .14 + b + 2}" y="${Y(x[3])}" width="${b}" height="${Y(0) - Y(x[3])}" fill="${x[5] ? "#93c5fd" : (x[3] >= x[1] ? "#16a34a" : "#c62828")}" rx="1.5"/>`;
      if (x[2]) { const cx = X0 + bw * .14 + b + 2 + b / 2, cy = Y(x[2]); g += `<path d="M${cx} ${cy - 4} L${cx + 4} ${cy} L${cx} ${cy + 4} L${cx - 4} ${cy}Z" fill="#7c3aed"/>`; }
      g += `<text x="${X0 + bw / 2}" y="${h - 7}" font-size="8" text-anchor="middle" font-weight="${x[5] ? 900 : 500}" fill="${x[5] ? "#0f2350" : "#7a8296"}">${x[0]}</text>`; });
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${g}</svg>`;
  }

  function html() {
    const [dd, mm, aa] = d1.data.split("/").map(Number), ed = new Date(aa, mm - 1, dd + 1), dD = new Date(aa, mm - 1, dd);
    const edS = `${String(ed.getDate()).padStart(2, "0")}/${String(ed.getMonth() + 1).padStart(2, "0")}/${ed.getFullYear()}`;
    const F = D.farol.filter(f => typeof f[1] === "number"), nG = F.filter(x => x[1] >= 100).length, nY = F.filter(x => x[1] >= 90 && x[1] < 100).length, nR = F.length - nG - nY;
    const verm = F.filter(x => x[1] < 90), best = F.reduce((m, x) => x[1] > m[1] ? x : m, F[0] || ["—", 0]);
    const regs = [...D.reg], abaixo = regs.filter(r => r[3] < 100), devendo = abaixo.reduce((s, r) => s + Math.max(0, -r[6]), 0);
    const pj = D.proj3.map(x => x[1] * 1e6), pmin = Math.min(...pj), pmax = Math.max(...pj), todas = pj.every(v => v >= M.metaOrc);
    const diasOk = D.dias.filter(x => x[2] >= x[3]).length, dd2 = D.dias.map(x => [x[0], x[2] / x[3] * 100]), bd = dd2.reduce((m, x) => x[1] > m[1] ? x : m), wd = dd2.reduce((m, x) => x[1] < m[1] ? x : m);
    const top2 = [...regs].sort((a, b) => b[1] - a[1]).slice(0, 2), somaReg = regs.reduce((s, x) => s + x[1], 0), c2 = top2.reduce((s, x) => s + x[1], 0) / somaReg * 100;
    const vsMedia = (necDU / M.mediaDU - 1) * 100, faltaBI = M.metaBI - M.acum, atMesBI = M.acum / M.metaBI * 100, atMesOrc = M.acum / M.metaOrc * 100;
    const prv = D.dias[D.dias.length - 2], fonte = esc((D.meta && D.meta.fonte) || "Power BI");
    const mesNome = (MESES[(D.orc[dD.getMonth()] || [""])[0]] || "") , mesAb = (D.orc[dD.getMonth()] || ["Mês"])[0];
    const txtRitmo = `Faltam ${brl(falta)} para a meta orçada do mês (${mi1(M.metaOrc)}) em ${M.duRest} dias úteis: são ${brl(necDU)} por dia útil, ${p1(Math.abs(vsMedia))} ${vsMedia <= 0 ? "abaixo" : "acima"} da média realizada por dia útil até aqui (${brl(M.mediaDU)}). Contra a meta do Power BI (${mi1(M.metaBI)}), faltam ${mi1(faltaBI)}.`;
    const txtProj = `Pelas 3 metodologias, o mês fecha entre ${mi1(pmin)} e ${mi1(pmax)} contra a meta orçada de ${mi1(M.metaOrc)} — ${todas ? "todas acima da meta" : pj.some(v => v >= M.metaOrc) ? "nem todas acima da meta" : "todas abaixo da meta"} (meta do Power BI: ${mi1(M.metaBI)}, ${p1(atMesBI)} atingido).`;
    const txtAbaixo = abaixo.length ? `${abaixo.map(r => r[0]).join(", ")} ${abaixo.length > 1 ? "ficaram" : "ficou"} abaixo de 100% no parcial. ${abaixo.length > 1 ? "Juntas, deixaram" : "Deixou"} de faturar ${brl(devendo)} frente à meta proporcional até o D-1.` : "Todas as regionais estão acima de 100% no parcial do mês.";
    const txtConc = `${top2.map(x => x[0]).join(" e ")} respondem por ${p1(c2)} do faturamento do mês da seleção — qualquer oscilação nelas move o resultado do grupo.`;
    const sup = window.FAIXAS || [["Meta", 0], ["+5%", 5], ["+7%", 7], ["+10%", 10]];

    /* ===== PÁGINA 1 · CAPA ===== */
    const fr = D.farol.map(([n, p]) => { const ok = typeof p === "number";
      return `<div class="card" style="text-align:center;padding:8px 4px 7px"><div style="width:20px;height:20px;border-radius:50%;margin:0 auto 5px;background:${ok ? cor(p) : "#cfd6e2"};opacity:.75;box-shadow:inset 0 -3px 5px rgba(0,0,0,.15)"></div>
<div style="font-size:7.6px;font-weight:800;min-height:20px;line-height:1.15;color:#14213d">${esc(n)}</div><div style="font-size:14px;font-weight:900;color:${ok ? cor(p) : "#9aa3b5"}">${ok ? p0(p) : "—"}</div></div>`; }).join("");
    const k4 = [["FATURAMENTO D-1", mi1(d1.fat), "meta " + mi1(d1.meta), "#fff"], ["ATINGIMENTO D-1", p0(atD1), atD1 >= 100 ? "Acima da meta" : "Abaixo da meta", atD1 >= 100 ? "#7ef0a8" : "#ff9b9b"], ["ACUMULADO DO MÊS", mi1(M.acum), `${p0(atAcO)} da orçada · ${p0(atAcB)} BI`, "#fff"], ["PROJEÇÃO DO MÊS", mi1(M.proj), `${p0(M.proj / M.metaOrc * 100)} da orçada · ${p0(M.proj / M.metaBI * 100)} BI`, "#fff"]];
    const pag1 = `<div class="rv">
<div style="background:linear-gradient(160deg,#0b1a3f 0%,#13306b 55%,#2449a8 100%);color:#fff;padding:22px 34px 20px;height:404px;position:relative">
 <div class="lg" style="position:static;display:inline-block"><img src="${window.__LOGO || "icons/logo-los.png"}"></div>
 <div style="position:absolute;right:34px;top:26px;text-align:right;font-size:11px;opacity:.9">Edição de ${SEMF[ed.getDay()]}, ${edS}<br><b>Resultado de ${d1.data}</b></div>
 <div style="color:#ff8a8a;font-size:9.5px;font-weight:800;letter-spacing:.32em;margin-top:12px">CT LOS · FAROL OPERACIONAL · REVISTA DIÁRIA DE OPERAÇÕES</div>
 <div style="font-weight:900;font-style:italic;font-size:38px;line-height:.98;margin-top:6px">MORNING<br><span style="color:#c7d6ff">OPERATIONAL NEWS</span></div>
 <div style="border-left:5px solid #ef4444;padding-left:10px;margin-top:12px;font-size:16px;font-weight:800;line-height:1.25">Grupo LOS fecha o D-1 em ${p0(atD1)} da meta e acumula ${p0(atAcO)} da meta orçada proporcional</div>
 <div style="font-size:11px;opacity:.9;margin-top:7px;line-height:1.4">Meta orçada ${mi1(M.metaOrc)} · meta Power BI ${mi1(M.metaBI)} · Projeção de fechamento em ${mi1(M.proj)} · ${nG} de ${F.length} regionais no verde${verm.length ? " · atenção para " + lista(verm.map(x => x[0])) : ""}</div>
 <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px">${k4.map(k => `<div style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.22);border-radius:10px;padding:9px 11px"><div style="font-size:7.6px;letter-spacing:.16em;font-weight:800;opacity:.85">${k[0]}</div><div style="font-size:19px;font-weight:900;margin-top:3px;color:${k[3]}">${k[1]}</div><div style="font-size:8px;opacity:.85">${k[2]}</div></div>`).join("")}</div>
</div>
<div class="bd" style="--ac:#c62828">
 <h4 style="margin-top:6px">Farol do dia por regional</h4>
 <div style="display:grid;grid-template-columns:repeat(${Math.min(9, D.farol.length)},1fr);gap:7px">${fr}</div>
 ${D.editorial ? `<div class="card" style="display:grid;grid-template-columns:120px 1fr;margin-top:12px;border-left:4px solid #c62828"><div style="padding:12px;border-right:1px solid #e3e7ef"><div style="font-size:8px;letter-spacing:.2em;color:#c62828;font-weight:800">EDITORIAL</div><div class="serif" style="font-size:17px;font-weight:700;font-style:italic;color:#0f2350;line-height:1.1;margin-top:3px">Mensagem<br>do dia</div><div style="font-size:8px;color:#7a8296;margin-top:8px">${SEMF[ed.getDay()]}<br>${edS}</div></div>
 <div class="serif" style="padding:11px 14px;font-size:11.5px;line-height:1.5;text-align:justify"><span style="float:left;font-size:34px;line-height:.9;color:#c62828;margin:2px 6px 0 0">${esc(D.editorial.texto[0])}</span>${esc(D.editorial.texto.slice(1))}<div style="text-align:right;font-style:italic;color:#c62828;margin-top:5px">— ${esc(D.editorial.autor)}</div></div></div>` : ""}
 <div style="display:grid;grid-template-columns:1.55fr 1fr;gap:22px;margin-top:2px">
  <div><h4>Destaques da edição</h4>
   <div class="card" style="padding:10px 13px;font-size:9.6px;line-height:1.45">
    <div style="color:#7c3aed;font-weight:900;font-size:8.6px;letter-spacing:.1em">RITMO PARA A META</div><div>${txtRitmo}</div>
    <div style="color:#2563eb;font-weight:900;font-size:8.6px;letter-spacing:.1em;margin-top:7px">FECHAMENTO PROJETADO</div><div>${txtProj}</div>
    <div style="color:#c62828;font-weight:900;font-size:8.6px;letter-spacing:.1em;margin-top:7px">ABAIXO DA META PROPORCIONAL</div><div>${txtAbaixo}</div></div></div>
  <div><h4>Nesta edição</h4>
   ${[["02", "Editorial"], ["03", "Panorama D-1"], ["04", "Acumulado Geral"], ["05", "Passado x Futuro"], ["06", "Orçamento mês a mês"]].map(x => `<div style="display:flex;gap:12px;align-items:center;border-bottom:1px solid #eef1f6;padding:4px 0"><b style="color:#c62828;font-size:16px;font-style:italic;width:24px">${x[0]}</b><b style="font-size:10px">${x[1]}</b></div>`).join("")}
   <div style="background:linear-gradient(135deg,#1e8e4e,#16a34a);color:#fff;border-radius:10px;padding:9px 12px;margin-top:9px"><div style="font-size:7.6px;letter-spacing:.18em;font-weight:800;opacity:.9">DESTAQUE DO DIA</div><div style="font-size:16px;font-weight:900">${esc(best[0])} · ${p0(best[1])}</div><div style="font-size:8.6px;opacity:.9">Regional com o maior atingimento D-1</div></div></div>
 </div>
 ${D.frase ? `<div style="background:linear-gradient(120deg,#9b1c1c,#1b2a5a);color:#fff;border-radius:12px;padding:12px 18px;margin-top:12px"><div style="font-size:8.6px;letter-spacing:.24em;color:#ffb4b4;font-weight:800">PARA O DIA:</div><div style="font-size:13.5px;font-weight:800;font-style:italic;line-height:1.35;margin-top:3px">“${esc(D.frase.texto)}<br>— ${esc(D.frase.autor)}.”</div></div>` : ""}
</div>
<div style="position:absolute;left:0;right:0;bottom:0;height:46px;background:#0b1a3f;color:#fff;padding:9px 34px"><div style="font-size:12px;font-weight:900;font-style:italic">CARRO PARADO É <span style="color:#ef4444">PREJUÍZO</span>. <span style="font-weight:500;font-style:normal">Nada parado. Nada esperando.</span> <i style="font-weight:600">Vamos pra cima!</i></div><div style="text-align:center;font-size:7px;opacity:.5;margin-top:3px">Morning Operational News · CT LOS · página 1 de 6</div></div>
</div>`;

    /* ===== PÁGINA 2 · O DIA EM PERSPECTIVA ===== */
    const persp = [
      `A ${SEMm[dD.getDay()]}, ${d1.data}, terminou com <b>${brl(d1.fat)}</b> faturados pelo Grupo LOS, <b>${p0(atD1)}</b> da meta do dia (${sgn(d1.fat - d1.meta)}).${prv ? ` Na comparação com ${prv[0]}, o faturamento variou ${d1.vsD2 >= 0 ? "+" : ""}${p1(d1.vsD2).replace("%", "")}%.` : ""}`,
      `No farol das regionais, <b>${nG} de ${F.length}</b> fecharam o dia no verde (${F.filter(x => x[1] >= 100).map(x => x[0]).join(", ")}).${verm.length ? ` Pedem atenção imediata: <b>${verm.map(x => `${x[0]} (${p0(x[1])})`).join(", ")}</b>, abaixo da faixa de 90%.` : ""}`,
      `No acumulado do mês, são <b>${brl(M.acum)}</b> contra uma meta orçada acumulada de ${brl(M.metaAcOrc)} — <b>${p0(atAcO)}</b> da meta orçada proporcional, ${M.acum >= M.metaAcOrc ? "uma folga de" : "um desvio de"} ${sgn(M.acum - M.metaAcOrc)}. Na régua do Power BI (meta de ${mi1(M.metaBI)}), o atingimento é de <b>${p1(atAcB)}</b> da meta proporcional. Foram <b>${diasOk} de ${D.dias.length}</b> dias com meta batida; o melhor foi ${bd[0]} (${p0(bd[1])}) e o mais fraco, ${wd[0]} (${p0(wd[1])}).`,
      `Olhando para frente, as três metodologias de projeção apontam um fechamento entre <b>${mi1(pmin)} e ${mi1(pmax)}</b>, contra a meta orçada de ${mi1(M.metaOrc)} (Power BI: ${mi1(M.metaBI)}). Faltam ${brl(falta)} para a meta orçada em ${M.duRest} dias úteis: <b>${brl(necDU)} por dia útil</b>, contra a média realizada de ${brl(M.mediaDU)} por dia útil.`,
      `${top2.map(x => x[0]).join(" e ")} concentram ${p1(c2)} do faturamento do mês.${abaixo.length ? ` Abaixo da meta proporcional (Power BI, por regional) ${abaixo.length > 1 ? "estão" : "está"} <b>${abaixo.map(r => `${r[0]} (${p0(r[3])})`).join(", ")}</b> — ${abaixo.length > 1 ? "juntas, deixaram" : "deixou"} de faturar ${brl(devendo)} até o D-1.` : " Todas as regionais estão acima da meta proporcional."}`];
    const cinco = [["FATURAMENTO D-1", brl(d1.fat), p0(atD1) + " da meta"], ["ACUMULADO DO MÊS", brl(M.acum), `${p1(atAcO)} da orçada · ${p1(atAcB)} do BI`], ["META ORÇADA DO MÊS", brl(M.metaOrc), "Power BI: " + brl(M.metaBI)], ["DESVIO ACUMULADO", sgn(M.acum - M.metaAcOrc), "contra a meta orçada até o D-1"], ["NECESSÁRIO POR DIA ÚTIL", brl(necDU), `para a meta orçada · ${M.duRest} dias úteis`]];
    const fd = n => (D.farol.find(f => f[0] === n) || [])[1];
    const glos = [["D-1", "O dia anterior à emissão — o último dia completo. É a \"foto fechada\" de ontem."], ["Atingimento", "Realizado ÷ meta × 100. 100% é meta batida; serve para comparar dias e regionais com metas diferentes."], ["Meta proporcional", "A meta que deveria estar cumprida até o D-1, somando o calendário de metas (dias úteis pesam mais que fins de semana)."], ["Atingimento parcial", "Acumulado ÷ meta proporcional. Diz se o mês está no ritmo — é a régua justa no meio do mês."], ["Projeção", "Estimativa de onde o mês vai terminar se o padrão atual continuar. Não é resultado realizado."], ["Ritmo necessário", "Quanto é preciso faturar, em média, em cada dia útil restante para fechar a meta do mês (seg–sex, sem feriados nacionais)."], ["Margens", "Quanto sobra da receita após o custo do transporte — de terceiros e de agregados, ponderadas pela receita."], ["Super meta", "Faixas acima da meta orçada: +5%, +7% e +10%. Mostram até onde o resultado pode ir além do compromisso."], ["Farol", "Verde ≥ 100% · amarelo de 90% a 100% · vermelho abaixo de 90%. A soma das cores é sempre o total de regionais."]];
    const rk = [...regs].sort((a, b) => b[3] - a[3]), rmx = Math.max(...rk.map(r => r[3]), 100);
    const pag2 = `<div class="rv">${hdr("01", "EDITORIAL · LEITURA DO DIA", "O DIA EM PERSPECTIVA", `Resultado de <b>${d1.data}</b> · Grupo LOS consolidado`, "linear-gradient(120deg,#7f1d1d,#b91c1c 55%,#dc2626)")}
<div class="bd" style="--ac:#c62828">
 ${D.dds ? `<div style="display:grid;grid-template-columns:86px 1fr;background:#fff8dc;border-radius:10px;overflow:hidden;border:1px solid #f2d36b"><div style="background:repeating-linear-gradient(135deg,#f2c200 0 14px,#1f2937 14px 28px);display:flex;align-items:center;justify-content:center"><span style="background:#fff;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:24px">🦺</span></div>
 <div style="padding:9px 14px"><div style="font-size:7.8px;letter-spacing:.2em;color:#a16207;font-weight:800">SEGURANÇA EM PRIMEIRO LUGAR · DDS DO DIA</div><div style="font-size:14px;font-weight:900;margin-top:2px">${esc(D.dds.titulo)}</div><div style="font-size:10px;line-height:1.45;margin-top:3px">${esc(D.dds.texto)}</div><div style="text-align:right;font-size:8.6px;font-style:italic;color:#a16207">— ${esc(D.dds.autor)}</div></div></div>` : ""}
 <div style="display:grid;grid-template-columns:1fr 190px;gap:18px;margin-top:10px">
  <div style="column-count:2;column-gap:16px;font-size:9.8px;line-height:1.48">${persp.map((t, i) => `<p style="margin:0 0 6px">${i ? t : `<span style="float:left;font-size:38px;line-height:.85;font-weight:900;color:#c62828;margin:2px 5px 0 0">${t[0]}</span>${t.slice(1)}`}</p>`).join("")}</div>
  <div><div style="font-size:30px;font-weight:900;font-style:italic;color:#c62828;line-height:1">${p0(atAcO)}</div><div style="font-size:9px;color:#5b6478">da meta orçada acumulada a ${d1.data.slice(0, 5)}</div>
   <div style="background:#0f2350;color:#fff;border-radius:10px;padding:10px 12px;margin-top:10px"><div style="font-size:8px;letter-spacing:.2em;font-weight:800">O DIA EM 5 NÚMEROS</div>
   ${cinco.map(c => `<div style="border-top:1px solid rgba(255,255,255,.15);padding:5px 0"><div style="font-size:7px;letter-spacing:.14em;opacity:.75">${c[0]}</div><div style="font-size:15px;font-weight:900">${c[1]}</div><div style="font-size:7.5px;opacity:.75">${c[2]}</div></div>`).join("")}</div></div>
 </div>
 <h4>Onde agir hoje <small>Regionais/operações abaixo da meta proporcional</small></h4>
 <table><tr style="background:#991b1b"><th>Regional</th><th>Parcial</th><th>Devendo até o D-1</th><th>Falta p/ meta do mês</th><th>Necessário/dia útil</th><th>Farol D-1</th></tr>
 ${abaixo.length ? abaixo.map(r => { const f = fd(r[0]); return `<tr><td><b>${esc(r[0])}</b></td><td style="color:${cor(r[3])};font-weight:800">${p0(r[3])}</td><td>${brl(Math.max(0, -r[6]))}</td><td>${brl(Math.max(0, r[2] - r[1]))}</td><td>${brl(Math.max(0, r[2] - r[1]) / Math.max(1, M.duRest))}</td><td style="color:${f != null ? cor(f) : "#9aa3b5"};font-weight:800">● ${f != null ? p0(f) : "sem dado"}</td></tr>`; }).join("") : `<tr><td colspan="6" style="text-align:center">Todas as regionais acima da meta proporcional. 👏</td></tr>`}</table>
 <h4>Ranking do mês <small>Atingimento parcial por regional/operação · linha = 100%</small></h4>
 ${rk.map(r => `<div style="display:flex;align-items:center;gap:6px;margin:1.5px 0;font-size:8.6px"><b style="width:104px;text-align:right">${esc(r[0])}</b><span class="bar" style="height:8px"><span style="width:${r[3] / rmx * 100}%;background:${cor(r[3])}"></span><em style="left:${100 / rmx * 100}%"></em></span><b style="width:34px;color:${cor(r[3])}">${p0(r[3])}</b></div>`).join("")}
 <h4>Glossário do farol <small>Para ler a revista sem dúvidas</small></h4>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px">${glos.map(g => `<div style="border-left:3px solid #c62828;padding:1px 8px"><b style="font-size:9px;color:#991b1b">${g[0]}</b><div style="font-size:8.2px;line-height:1.35;color:#3b4256">${g[1]}</div></div>`).join("")}</div>
</div>${foot("Texto gerado exclusivamente a partir dos números desta edição (" + fonte + "). Nenhum valor é estimado sem identificação.", "Informação que gera ação.", 2)}</div>`;

    /* ===== PÁGINA 3 · PANORAMA D-1 ===== */
    const regF = [...regs].sort((a, b) => b[1] - a[1]), totF = regF.reduce((s, r) => s + r[1], 0), totM = regF.reduce((s, r) => s + r[2], 0), pmx = Math.max(...regF.map(r => r[3]), 100);
    const cards = D.farol.map(([n, p]) => { const ok = typeof p === "number", c = ok ? cor(p) : "#9aa3b5";
      return `<div class="card" style="border-top:4px solid ${c};padding:8px 5px;text-align:center;${ok && p < 90 ? "background:#fff5f5" : ""}"><div style="font-size:9.5px;font-weight:900;min-height:24px;line-height:1.2">${esc(n)}</div><div style="font-size:20px;font-weight:900;color:${c}">${ok ? p0(p) : "—"}</div>
<div style="display:inline-block;font-size:6.4px;font-weight:900;letter-spacing:.06em;padding:2px 5px;border-radius:3px;${ok && p < 90 ? `background:${c};color:#fff` : `border:1px solid ${c};color:${c}`}">${ok ? st(p) : "SEM DADO"}</div>
<div style="height:4px;background:#eef1f6;border-radius:2px;margin:5px 4px 0;position:relative"><i style="position:absolute;left:0;top:0;bottom:0;border-radius:2px;width:${ok ? Math.min(100, p / Math.max(150, ...F.map(x => x[1])) * 100) : 0}%;background:${c}"></i></div><div style="font-size:7.4px;color:#5b6478;margin-top:4px;line-height:1.3">${ok ? acao(p) : "Sem dado<br>no D-1."}</div></div>`; }).join("");
    const pag3 = `<div class="rv">${hdr("02", "PERFORMANCE D-1", "PANORAMA OPERACIONAL", `Resultado de <b>${SEMm[dD.getDay()]}, ${d1.data}</b> · Grupo LOS consolidado`, "linear-gradient(120deg,#0b1a3f,#1b3a7a 60%,#2449a8)")}
<div class="bd" style="--ac:#1b3a7a">
 ${lead(`${nG} de ${F.length} regionais atingiram a meta no dia. O grupo faturou <b>${brl(d1.fat)}</b>, <b>${p0(atD1)}</b> da meta diária, e acumula <b>${p0(atAcO)}</b> da meta proporcional do mês. Melhor desempenho: <b>${esc(best[0])} (${p0(best[1])})</b>.${verm.length ? ` Atenção para <b>${verm.map(x => `${x[0]} (${p0(x[1])})`).join(", ")}</b>, abaixo da faixa de 90%.` : ""}`, "#1b3a7a")}
 <h4>Resultado do dia <small>Fonte: Power BI · indicadores_flash</small></h4>
 <div class="card"><div class="kg" style="grid-template-columns:repeat(4,1fr)"><div><div class="kl">Faturamento</div><div class="kv">${brl(d1.fat)}</div><div class="ks">Realizado em ${d1.data}</div></div><div><div class="kl">Meta</div><div class="kv">${brl(d1.meta)}</div><div class="ks">Meta diária</div></div><div><div class="kl">Atingimento</div><div class="kv" style="color:${cor(atD1)}">${p0(atD1)}</div><div class="ks">Realizado ÷ meta do dia</div></div><div><div class="kl">Desvio</div><div class="kv" style="color:${cor(atD1)}">${sgn(d1.fat - d1.meta)}</div><div class="ks">Faturamento vs D-2: ${d1.vsD2 >= 0 ? "+" : ""}${p1(d1.vsD2)}</div></div></div></div>
 <div class="mini" style="grid-template-columns:repeat(6,1fr)"><div><div class="kl">Acumulado no mês</div><b>${brl(M.acum)}</b></div><div><div class="kl">Meta acum. orçada</div><b>${brl(M.metaAcOrc)}</b></div><div><div class="kl">Ating. orçada | BI</div><b style="color:${cor(atAcO)}">${p0(atAcO)} | ${p0(atAcB)}</b></div><div><div class="kl">Desvio acumulado</div><b style="color:${cor(atAcO)}">${sgn(M.acum - M.metaAcOrc)}</b></div><div><div class="kl">Projeção do mês</div><b>${brl(M.proj)}</b></div><div><div class="kl">Margens terc. | agr.</div><b>${p2(M.mgT)} | ${p2(M.mgA)}</b></div></div>
 <h4>Farol do dia por regional · D-1 <small>Verde ≥ 100% · Amarelo 90–99% · Vermelho &lt; 90%</small></h4>
 <div class="card" style="display:grid;grid-template-columns:110px repeat(3,1fr);align-items:center;padding:6px 10px;margin-bottom:8px"><div style="display:flex;align-items:center;gap:6px"><span style="background:#151a26;border-radius:5px;padding:3px;display:flex;flex-direction:column;gap:2px"><i style="width:7px;height:7px;border-radius:50%;background:#ff3b30"></i><i style="width:7px;height:7px;border-radius:50%;background:#ffb800"></i><i style="width:7px;height:7px;border-radius:50%;background:#2fd16b"></i></span><b style="font-size:9.5px">FAROL<br>DO DIA</b></div>
 ${[[nG, "ACIMA<br>DA META", "#1e8e4e"], [nY, "PRÓXIMO<br>DA META", "#d08a0e"], [nR, "EM ATENÇÃO", "#c62828"]].map(x => `<div style="display:flex;align-items:center;gap:8px;border-left:1px solid #e3e7ef;padding-left:12px"><b style="font-size:26px;color:${x[2]}">${x[0]}</b><span style="font-size:8px;font-weight:700;color:#5b6478">${x[1]}</span></div>`).join("")}</div>
 <div style="display:grid;grid-template-columns:repeat(${Math.min(9, D.farol.length)},1fr);gap:6px">${cards}</div>
 <h4>Fechamento do mês por regional <small>${mesAb}/${String(aa).slice(2)} até o D-1 · ordenado por faturamento</small></h4>
 <table><tr style="background:#0f2350"><th>Regional</th><th>Faturamento</th><th>Meta do mês</th><th>Ating. total</th><th style="text-align:left">Ating. parcial</th><th>Mg. terceiros</th><th>Mg. agregados</th></tr>
 ${regF.map(r => `<tr><td><b>${esc(r[0])}</b></td><td>${nf(r[1])}</td><td>${nf(r[2])}</td><td>${p0(r[1] / r[2] * 100)}</td><td style="text-align:left"><span style="display:inline-flex;align-items:center;gap:5px;width:100%"><b style="color:${cor(r[3])};width:28px">${p0(r[3])}</b><span class="bar" style="height:6px"><span style="width:${r[3] / pmx * 100}%;background:${cor(r[3])}"></span><em style="left:${100 / pmx * 100}%"></em></span></span></td><td>${r[4] != null ? p2(r[4]) : "—"}</td><td>${r[5] != null ? p2(r[5]) : "—"}</td></tr>`).join("")}
 <tr class="tot"><td>Total das ${regF.length} linhas</td><td>${nf(totF)}</td><td>${nf(totM)}</td><td>${p0(totF / totM * 100)}</td><td style="text-align:left">${regF.filter(r => r[3] >= 100).length} de ${regF.length} ≥ 100%</td><td></td><td></td></tr></table>
 <div class="note"><b>Ating. total</b> = faturamento ÷ meta do mês inteiro. <b>Ating. parcial</b> = faturamento ÷ meta proporcional até o D-1 (valor do Power BI).${Math.abs(totF - M.acum) > 1000 ? ` As linhas do fechamento somam ${brl(Math.abs(totF - M.acum))} a ${totF > M.acum ? "mais" : "menos"} que o faturamento total do Power BI (${brl(M.acum)}) — provável linha fora do recorte.` : ""}</div>
</div>${foot(`Fontes: ${fonte}; edição de ${d1.data}.<br>Projeção conforme o Power BI, não é resultado realizado. Margens conforme definição do Power BI.`, "Carro parado é prejuízo.", 3)}</div>`;

    /* ===== PÁGINA 4 · ACUMULADO GERAL ===== */
    let ac = 0, am = 0; const totMeta = D.dias.reduce((s, x) => s + x[3], 0);
    const linhas = D.dias.map(x => { ac += x[2]; am += x[3]; const p = x[2] / x[3] * 100, pa = ac / am * 100;
      return `<tr><td><b>${x[0]}</b></td><td style="text-align:left">${x[1]}</td><td>${nf(x[2])}</td><td>${nf(x[3])}</td><td style="color:${cor(p)};font-weight:800">● ${p0(p)}</td><td style="color:${cor(p)}">${sgn(x[2] - x[3])}</td><td><b>${nf(ac)}</b></td><td style="color:${cor(pa)};font-weight:800">${p0(pa)}</td><td>${x[4] != null ? p2(x[4]) : "—"}</td><td>${x[5] != null ? p2(x[5]) : "—"}</td></tr>`; }).join("");
    const pag4 = `<div class="rv">${hdr("03", "ACUMULADO DO MÊS · ATÉ O D-1", "ACUMULADO GERAL", `${mesAb} de ${aa} · de 01 a <b>${d1.data}</b> · Grupo LOS consolidado`, "linear-gradient(120deg,#064e3b,#0f766e 60%,#0d9488)")}
<div class="bd" style="--ac:#0f766e">
 ${lead(`té <b>${d1.data}</b>, o Grupo LOS faturou <b>${brl(M.acum)}</b> no mês, <b>${p0(atAcO)}</b> da meta orçada acumulada (${sgn(M.acum - M.metaAcOrc)}) e ${p0(atAcB)} da meta do Power BI. Projeção de fechamento: <b>${brl(M.proj)}</b> (${p0(M.proj / M.metaBI * 100)} da meta do mês, conforme Power BI). <b>${diasOk} de ${D.dias.length}</b> dias com meta batida.`.replace(/^/, "A"), "#0f766e")}
 <h4>Resultado acumulado <small>Fonte: Power BI · indicadores_flash</small></h4>
 <div class="card"><div class="kg" style="grid-template-columns:repeat(4,1fr)"><div><div class="kl">Faturamento acumulado</div><div class="kv">${brl(M.acum)}</div><div class="ks">01 a ${d1.data.slice(0, 5)}</div></div><div><div class="kl">Meta acum. orçada</div><div class="kv">${brl(M.metaAcOrc)}</div><div class="ks">Power BI: ${brl(M.metaAcBI)}</div></div><div><div class="kl">Atingimento parcial</div><div class="kv" style="color:${cor(atAcO)}">${p0(atAcO)}</div><div class="ks">vs orçada · BI ${p0(atAcB)}</div></div><div><div class="kl">Projeção do mês</div><div class="kv">${brl(M.proj)}</div><div class="ks">${p0(M.proj / M.metaBI * 100)} · Power BI (estimativa)</div></div></div></div>
 <div class="mini" style="grid-template-columns:repeat(6,1fr)"><div><div class="kl">Desvio acumulado</div><b style="color:${cor(atAcO)}">${sgn(M.acum - M.metaAcOrc)}</b></div><div><div class="kl">Ating. orçada do mês</div><b>${p0(atMesOrc)}</b></div><div><div class="kl">Média por dia útil</div><b>${brl(M.mediaDU)}</b></div><div><div class="kl">Dias na meta</div><b>${diasOk} de ${D.dias.length}</b></div><div><div class="kl">Margem terceiros</div><b>${p2(M.mgT)}</b></div><div><div class="kl">Margem agregados</div><b>${p2(M.mgA)}</b></div></div>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
  <div><h4>Acumulado real x meta<i>Cheia = real · tracejada = meta</i></h4>${linhaAcum(355, 150)}</div>
  <div><h4>Faturamento diário x meta<i>Cor = farol · traço = meta</i></h4>${barrasDia(355, 150)}</div></div>
 <h4>Performance por dia <small>Melhor dia: <b>${bd[0]}</b> (${p0(bd[1])}) · pior: <b>${wd[0]}</b> (${p0(wd[1])})</small></h4>
 <table><tr style="background:#065f46"><th>Data</th><th style="text-align:left">Dia</th><th>Faturamento</th><th>Meta</th><th>Ating.</th><th>Desvio</th><th>Acumulado</th><th>Ating. acum.</th><th>Mg. terc.</th><th>Mg. agr.</th></tr>${linhas}
 <tr class="tot"><td>Total do mês</td><td></td><td>${nf(M.acum)}</td><td>${nf(totMeta)}</td><td>${p0(M.acum / totMeta * 100)}</td><td>${sgn(M.acum - totMeta)}</td><td>${nf(M.acum)}</td><td>${p0(M.acum / totMeta * 100)}</td><td>${p2(M.mgT)}</td><td>${p2(M.mgA)}</td></tr></table>
</div>${foot(`Fonte: ${fonte}. Atingimento acumulado = faturamento acumulado ÷ meta acumulada até o dia.<br>Projeção conforme o Power BI, não é resultado realizado. Margens conforme definição do Power BI (ponderadas).`, "Carro parado é prejuízo.", 4)}</div>`;

    /* ===== PÁGINA 5 · PASSADO X FUTURO ===== */
    const col = (bg, tit, big, sub, it) => `<div class="card" style="padding:9px 12px;border-top:4px solid ${bg}"><div style="font-size:8px;letter-spacing:.14em;font-weight:900;color:${bg}">${tit}</div><div style="font-size:19px;font-weight:900;color:#0f2350;margin-top:2px">${big}</div><div style="font-size:8.4px;color:#5b6478">${sub}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;margin-top:6px">${it.map(x => `<div><div style="font-size:7.4px;color:#7a8296">${x[0]}</div><b style="font-size:10.5px">${x[1]}</b></div>`).join("")}</div></div>`;
    const projBars = [...D.proj3.map(x => [x[0], x[1] * 1e6, "#7c3aed"]), ["Meta orçada", M.metaOrc, "#0f2350"], ["Meta Power BI", M.metaBI, "#94a3b8"]], pbm = Math.max(...projBars.map(x => x[1]));
    const desv = [...regs].sort((a, b) => b[6] - a[6]).map(r => [esc(r[0]), r[6], r[6] >= 0 ? "#1e8e4e" : "#c62828", sgm(r[6])]);
    const rit = [["Realizado<br>por dia útil", M.mediaDU, "#2563eb"], ["Meta média<br>restante", M.metaMediaRest, "#0f2350"], ["Necessário<br>p/ meta", necDU, "#7c3aed"]], rmx2 = Math.max(...rit.map(x => x[1] || 0));
    const pag5 = `<div class="rv">${hdr("04", "PASSADO X FUTURO · " + (mesAb + "/" + String(aa).slice(2)).toUpperCase(), "PASSADO X FUTURO", `Referência <b>${d1.data}</b> · ${M.duRest} dias úteis restantes · Grupo LOS consolidado`, "linear-gradient(120deg,#3b0764,#6d28d9 60%,#7c3aed)")}
<div class="bd" style="--ac:#7c3aed">
 ${lead(txtRitmo, "#7c3aed")}
 <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px">
  ${col("#2563eb", "◀ PASSADO · REALIZADO NO MÊS", brl(M.acum), `Atingimento parcial ${p0(atAcO)} · BI ${p0(atAcB)}`, [["Meta acum. orçada", mi1(M.metaAcOrc)], ["Desvio acumulado", sgn(M.acum - M.metaAcOrc)], ["Média/dia útil", mi1(M.mediaDU)], ["Ating. meta orçada", p0(atMesOrc)]])}
  ${col("#1e8e4e", "● PRESENTE · D-1", brl(d1.fat), `Atingimento do dia ${p0(atD1)}`, [["Meta do dia", mi1(d1.meta)], ["Desvio do dia", sgn(d1.fat - d1.meta)], ["vs D-2", (d1.vsD2 >= 0 ? "+" : "") + p1(d1.vsD2)], ["Farol", `${nG} · ${nY} · ${nR}`]])}
  ${col("#7c3aed", "▶ FUTURO · FECHAMENTO PROJETADO", brl(M.proj), `Power BI · ${p0(M.proj / M.metaOrc * 100)} da meta orçada · BI ${p0(M.proj / M.metaBI * 100)}`, [["Meta orçada", mi1(M.metaOrc)], ["Meta Power BI", mi1(M.metaBI)], ["Falta p/ meta", mi1(Math.max(0, falta))], ["Necessário/dia útil", mi1(necDU)]])}</div>
 <div style="display:grid;grid-template-columns:1.25fr 1fr;gap:16px">
  <div><h4>Trajetória do mês<i>Azul = realizado · tracejado = meta e projeção</i></h4>${trajetoria(390, 145)}</div>
  <div><h4>Três projeções x meta<i>Estimativas — não são realizado</i></h4><div style="margin-top:8px">${projBars.map(x => `<div style="display:flex;align-items:center;gap:6px;margin:5px 0;font-size:8.6px"><b style="width:92px;text-align:right">${x[0]}</b><span style="flex:1;height:13px;position:relative"><i style="position:absolute;left:0;top:0;bottom:0;width:${x[1] / pbm * 100}%;background:${x[2]};border-radius:2px;opacity:${x[2] === "#7c3aed" ? 1 : .9}"></i></span><b style="width:62px;color:${x[2]}">${mi1(x[1])}</b></div>`).join("")}</div></div></div>
 <div style="display:grid;grid-template-columns:1fr 1.25fr;gap:16px">
  <div><h4>Ritmo por dia útil<i>Realizado x necessário para a meta</i></h4><div style="display:flex;gap:14px;align-items:flex-end;height:110px;padding:0 10px">${rit.map(x => `<div style="flex:1;text-align:center"><div style="font-size:9.5px;font-weight:900;color:${x[2]};margin-bottom:3px">${mi1(x[1] || 0)}</div><div style="height:${(x[1] || 0) / rmx2 * 70}px;background:${x[2]};border-radius:3px 3px 0 0"></div><div style="font-size:7.8px;color:#5b6478;margin-top:3px;line-height:1.2">${x[0]}</div></div>`).join("")}</div></div>
  <div><h4>Desvio vs meta proporcional<i>Por regional/operação, em R$</i></h4>${hbars(desv, 360, 98)}</div></div>
 <h4>Fechamento projetado por regional <small>Projeção = meta do mês × atingimento parcial</small></h4>
 <table><tr style="background:#5b21b6"><th>Regional</th><th>Meta do mês</th><th>Realizado</th><th>Parcial</th><th>Projeção</th><th>Falta p/ meta</th><th>Necessário/dia útil</th><th style="text-align:left">Quadrante</th></tr>
 ${[...regs].sort((a, b) => b[2] - a[2]).map(r => { const fl = Math.max(0, r[2] - r[1]), pr = r[2] * r[3] / 100; return `<tr><td><b>${esc(r[0])}</b></td><td>${nf(r[2])}</td><td>${nf(r[1])}</td><td style="color:${cor(r[3])};font-weight:800">${p0(r[3])}</td><td><b>${nf(pr)}</b></td><td>${nf(fl)}</td><td>${nf(fl / Math.max(1, M.duRest))}</td><td style="text-align:left">${esc(r[7] || "—")}</td></tr>`; }).join("")}</table>
 <h4>Leituras automáticas <small>Geradas só a partir dos dados</small></h4>
 <ul style="margin:0;padding-left:15px;font-size:9px;line-height:1.45">
  <li><b>Fechamento projetado:</b> ${txtProj}</li><li><b>Abaixo da meta proporcional:</b> ${txtAbaixo}</li><li><b>Concentração:</b> ${txtConc}</li>
  <li><b>Super meta do mês:</b> ${sup.slice(1).map(f => { const v = M.metaOrc * (1 + f[1] / 100); return `${f[0]} (${mi1(v)}) ${M.proj >= v ? "✓ ao alcance pela projeção" : "faltam " + mi1(v - M.proj) + " na projeção"}`; }).join(" · ")}.</li></ul>
</div>${foot("Fontes: " + fonte + ". Projeções são estimativas; meta futura distribuída linearmente apenas para visualização.", "Carro parado é prejuízo.", 5)}</div>`;

    /* ===== PÁGINA 6 · ORÇAMENTO MÊS A MÊS + SUPER META ===== */
    const OR = D.orc, fech = OR.filter(x => x[3] != null && !x[5]), sO = fech.reduce((s, x) => s + x[1], 0), sR = fech.reduce((s, x) => s + x[3], 0);
    const metaAno = D.metaAno || OR.reduce((s, x) => s + (x[1] || 0), 0);
    const A = typeof anoProj === "function" ? anoProj(M.proj) : null;
    const fx = (base, real, proj, du) => sup.map(f => { const v = base * (1 + f[1] / 100), fl = Math.max(0, v - real);
      return `<tr><td><b>${f[0] === "Meta" ? "Meta 100%" : "Super meta " + f[0]}</b></td><td>${nf(v)}</td><td style="color:${real >= v ? "#1e8e4e" : "#5b6478"};font-weight:800">${p1(real / v * 100)}</td><td style="color:${proj >= v ? "#1e8e4e" : proj >= v * .97 ? "#d08a0e" : "#c62828"};font-weight:800">${proj >= v ? "✓ atinge" : p1(proj / v * 100)}</td><td>${fl ? nf(fl) : "✓"}</td>${du != null ? `<td>${fl ? nf(fl / Math.max(1, du)) : "—"}</td>` : ""}</tr>`; }).join("");
    const pag6 = `<div class="rv">${hdr("05", "ORÇAMENTO " + aa + " · META ORÇADA X POWER BI", "ORÇAMENTO MÊS A MÊS", `Referência <b>${d1.data}</b> · orçamento do ano`, "linear-gradient(120deg,#7c2d12,#c2410c 60%,#ea580c)")}
<div class="bd" style="--ac:#c2410c">
 ${lead(`té ${d1.data}, ${mesNome}/${String(aa).slice(2)} soma <b>${brl(M.acum)}</b>: <b>${p1(atMesOrc)}</b> da meta orçada do mês (${mi1(M.metaOrc)}) e ${p1(atMesBI)} da meta do Power BI (${mi1(M.metaBI)}). Nos ${fech.length} meses fechados do ano, o realizado soma ${mi1(sR)}, <b>${p1(sR / sO * 100)}</b> da meta orçada do período (${sgn(sR - sO)}).`.replace(/^/, "A"), "#c2410c")}
 <h4>Meta orçada x realizado <small>Cinza = meta orçada · barra colorida = realizado · ◆ meta do Power BI</small></h4>
 ${orcBarras(726, 150)}
 <h4>Mês a mês <small>Atingimento contra as duas metas</small></h4>
 <table><tr style="background:#9a3412"><th>Mês</th><th>Meta orçada</th><th>Meta Power BI</th><th>Realizado</th><th>Ating. orçada</th><th>Ating. BI</th><th>Desvio vs orçada</th><th>AGRO</th><th>Real. s/ AGRO</th></tr>
 ${OR.map(x => { const fin = x[3] != null && !x[5]; return `<tr${x[5] ? ' style="background:#eff6ff;font-weight:800"' : ""}><td><b>${MESES[x[0]] || x[0]}/${String(aa).slice(2)}</b></td><td>${nf(x[1])}</td><td>${x[2] ? nf(x[2]) : "—"}</td><td>${x[3] != null ? nf(x[3]) + (x[5] ? "*" : "") : "—"}</td><td style="color:${fin ? cor(x[3] / x[1] * 100) : "#5b6478"};font-weight:800">${fin ? p1(x[3] / x[1] * 100) : "—"}</td><td>${fin && x[2] ? p1(x[3] / x[2] * 100) : "—"}</td><td style="color:${fin ? (x[3] >= x[1] ? "#1e8e4e" : "#c62828") : "#5b6478"}">${fin ? sgn(x[3] - x[1]) : "—"}</td><td>${fin && x[4] != null ? nf(x[4]) : "—"}</td><td>${fin && x[4] != null ? nf(x[3] - x[4]) : "—"}</td></tr>`; }).join("")}
 <tr class="tot"><td>Meses fechados</td><td>${nf(sO)}</td><td></td><td>${nf(sR)}</td><td>${p1(sR / sO * 100)}</td><td></td><td>${sgn(sR - sO)}</td><td></td><td></td></tr>
 <tr class="tot"><td>Meta orçada do ano</td><td>${nf(metaAno)}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></table>
 <div class="note">* parcial do mês. Realizado até setembro: planilha de orçamento; a partir de outubro: Power BI. Meta do Power BI: soma das metas diárias do mês fechado ou fechamento por regional.</div>
 <h4>Alcance da super meta <small>Faixas sobre a meta orçada: +5% · +7% · +10%</small></h4>
 <div>
  <div><div style="font-size:8.6px;font-weight:900;color:#9a3412;margin-bottom:3px">${(mesNome || "MÊS").toUpperCase()} · realizado ${mi1(M.acum)} · projeção ${mi1(M.proj)}</div>
   <table><tr style="background:#c2410c"><th>Faixa</th><th>Valor</th><th>Realizado</th><th>Projeção</th><th>Falta</th><th>Nec./dia útil</th></tr>${fx(M.metaOrc, M.acum, M.proj, M.duRest)}</table></div>
  <div style="margin-top:8px"><div style="font-size:8.6px;font-weight:900;color:#9a3412;margin-bottom:3px">ANO ${aa} · ${A ? "projetado " + mi1(A.tot) + " (fechados + projeção do mês + orçado)" : "meta " + mi1(metaAno)}</div>
   <table><tr style="background:#c2410c"><th>Faixa</th><th>Valor</th><th>Realizado</th><th>Projeção</th><th>Falta</th><th>Nec./mês restante</th></tr>${fx(metaAno, A ? A.real + M.acum : sR + M.acum, A ? A.tot : sR + M.proj, OR.length - fech.length)}</table></div></div>
 <div class="note">Super meta: degraus de +5%, +7% e +10% sobre a meta orçada. Realizado do ano = meses fechados + ${mesNome || "mês"} até o D-1. Projeção do ano = meses fechados + projeção do Power BI para o mês + meta orçada dos meses seguintes. Estimativas, não resultado realizado.</div>
</div>${foot("Fontes: orçamento do ano e PDFs do Power BI importados.", "Meta orçada é compromisso.", 6)}</div>`;

    return CSS + pag1 + pag2 + pag3 + pag4 + pag5 + pag6;
  }
  window.FarolRevista = { html, W, H };
})();
