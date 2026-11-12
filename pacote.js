/* Farol Operacional · PACOTE DO DIA
   A partir da edição carregada (PDF do dia), gera:
   1) a revista impressa em PDF (A4, 2 páginas, com o logo do Grupo LOS);
   2) o cartão do dia em imagem (para o WhatsApp);
   3) o texto do WhatsApp.
   E envia tudo junto pelo compartilhamento do celular (WhatsApp). */
(function () {
  const loadScript = src => new Promise((ok, err) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => err(new Error("não carregou " + src)); document.head.appendChild(s); });
  let libsP = null;
  const libs = () => libsP || (libsP = Promise.all([loadScript("vendor/jspdf.umd.min.js"), loadScript("vendor/html2canvas.min.js")]));
  const img = src => new Promise((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = err; i.src = src; });
  const corH = p => p >= 100 ? "#1e8e4e" : p >= 90 ? "#d08a0e" : "#c62828";
  const bola = p => p >= 100 ? "🟢" : p >= 90 ? "🟡" : "🔴";

  /* ---------- texto do WhatsApp ---------- */
  function texto() {
    const f = D.farol, g = f.filter(x => x[1] >= 100).length;
    const ag = D.reg.filter(r => r[3] < 100);
    let t = `*MORNING OPERATIONAL NEWS · CT LOS* 🚦\n*Grupo LOS* · resultado de ${d1.dia}, ${d1.data}\n\n`;
    t += `💰 *Faturamento D-1:* ${brl(d1.fat)} (*${pct(atD1)}* da meta)\n`;
    t += `📈 *Acumulado do mês:* ${mi(M.acum)} · ${pct(atAcO)} da orçada · ${pct(atAcB)} BI\n`;
    t += `🔭 *Projeção:* ${mi(M.proj)} (estimativa)\n`;
    t += `🎯 *Ritmo:* faltam ${mi(falta)} em ${M.duRest} dias úteis · ${mi(necDU)}/dia útil\n\n`;
    t += `*Farol do dia* (${g} de ${f.length} no verde)\n` + f.map(([n, p]) => `${bola(p)} ${n} ${pct(p)}`).join("\n") + "\n";
    if (ag.length) t += `\n⚠️ *Onde agir hoje:* ` + ag.map(r => `${r[0]} (${pct(r[3])} no mês, devendo ${brl(-r[6])})`).join("; ") + "\n";
    if (D.dds) t += `\n🦺 *DDS · ${D.dds.titulo}*\n${D.dds.texto}\n`;
    if (D.editorial) t += `\n📝 ${D.editorial.texto}\n— ${D.editorial.autor}\n`;
    if (D.frase) t += `\n💬 _“${D.frase.texto}”_ — ${D.frase.autor}\n`;
    t += `\n*Carro parado é prejuízo. Vamos pra cima!*\n📲 App: ${new URL("./", location.href).href}`;
    return t;
  }

  /* ---------- cartão do dia (imagem 1080 x 1350) ---------- */
  async function cartao() {
    const W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
    const gr = x.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "#0b1a3f"); gr.addColorStop(.7, "#1b3a7a"); gr.addColorStop(1, "#2346a0");
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    const rr = (X, Y, w, h, r, fill) => { x.beginPath(); x.roundRect(X, Y, w, h, r); x.fillStyle = fill; x.fill(); };
    rr(60, 50, 380, 150, 26, "#fff");
    const logo = await img("icons/logo-los.png"); const lh = 120, lw = logo.width * lh / logo.height; x.drawImage(logo, 60 + (380 - lw) / 2, 65, lw, lh);
    x.fillStyle = "#ff8a8a"; x.font = "800 26px system-ui,-apple-system,Segoe UI,Roboto,sans-serif"; x.fillText("CT LOS · FAROL OPERACIONAL", 480, 100);
    x.fillStyle = "#fff"; x.font = "900 italic 58px system-ui,-apple-system,Segoe UI,Roboto,sans-serif"; x.fillText("MORNING", 480, 160); x.fillStyle = "#c7d6ff"; x.fillText("OPERATIONAL NEWS", 480, 215);
    x.fillStyle = "rgba(255,255,255,.85)"; x.font = "500 30px system-ui,sans-serif"; x.fillText(`Resultado de ${d1.dia}, ${d1.data}`, 60, 275);
    const k = [["FATURAMENTO D-1", mi(d1.fat), "meta " + mi(d1.meta)], ["ATINGIMENTO D-1", pct(atD1), atD1 >= 100 ? "acima da meta" : "abaixo da meta"], ["ACUMULADO DO MÊS", mi(M.acum), pct(atAcO) + " orçada · " + pct(atAcB) + " BI"], ["PROJEÇÃO DO MÊS", mi(M.proj), "estimativa"]];
    k.forEach((q, i) => { const X = 60 + (i % 2) * 490, Y = 310 + Math.floor(i / 2) * 210; rr(X, Y, 470, 190, 26, "rgba(255,255,255,.12)");
      x.fillStyle = "rgba(255,255,255,.75)"; x.font = "800 24px system-ui,sans-serif"; x.fillText(q[0], X + 28, Y + 50);
      x.fillStyle = i === 1 ? (atD1 >= 100 ? "#7ef0a8" : "#ff9b9b") : "#fff"; x.font = "900 64px system-ui,sans-serif"; x.fillText(q[1], X + 28, Y + 125);
      x.fillStyle = "rgba(255,255,255,.75)"; x.font = "500 24px system-ui,sans-serif"; x.fillText(q[2], X + 28, Y + 165); });
    rr(60, 750, 960, 440, 30, "#fff");
    x.fillStyle = "#0f2350"; x.font = "800 26px system-ui,sans-serif"; x.fillText("FAROL DO DIA POR REGIONAL", 100, 805);
    const f = D.farol, cols = Math.min(4, f.length), cw = 880 / cols;
    f.forEach(([n, p], i) => { const X = 100 + (i % cols) * cw, Y = 840 + Math.floor(i / cols) * 165;
      x.beginPath(); x.arc(X + cw / 2, Y + 30, 24, 0, 7); x.fillStyle = corH(p); x.fill();
      x.fillStyle = "#5b6478"; x.font = "700 21px system-ui,sans-serif"; x.textAlign = "center"; x.fillText(n, X + cw / 2, Y + 88);
      x.fillStyle = corH(p); x.font = "900 40px system-ui,sans-serif"; x.fillText(pct(p), X + cw / 2, Y + 135); x.textAlign = "left"; });
    x.fillStyle = "#fff"; x.font = "800 italic 34px system-ui,sans-serif"; x.textAlign = "center"; x.fillText("Carro parado é prejuízo. Vamos pra cima!", W / 2, 1265);
    x.fillStyle = "rgba(255,255,255,.6)"; x.font = "500 22px system-ui,sans-serif"; x.fillText("Grupo LOS · Soluções em Transporte e Logística", W / 2, 1310); x.textAlign = "left";
    return new Promise(ok => c.toBlob(b => ok(b), "image/png"));
  }

  /* ---------- revista impressa (PDF A4, 2 páginas) ---------- */
  let LOGO_DATA = "icons/logo-los.png";
  async function logoData() { try { const b = await (await fetch("icons/logo-los.png")).blob(); LOGO_DATA = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); }); } catch (e) {} }
  function revistaHTML() {
    const css = `<style>.rv{width:794px;height:1123px;background:#fff;color:#14213d;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;position:relative;overflow:hidden}
.rv .hd{background:linear-gradient(135deg,#0b1a3f,#1b3a7a 70%,#2346a0);color:#fff;padding:26px 34px 22px}.rv .lg{background:#fff;border-radius:12px;padding:8px 14px;display:inline-block}.rv .lg img{height:64px;display:block}
.rv .tt{font-weight:900;font-style:italic;font-size:40px;line-height:1;margin-top:14px}.rv .tt span{color:#c7d6ff}.rv .sb{font-size:13px;opacity:.85;margin-top:6px}.rv .ey{color:#ff8a8a;font-size:11px;font-weight:800;letter-spacing:.2em;margin-top:12px}
.rv .bd{padding:18px 34px}.rv .k4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.rv .k{border:1px solid #e3e7ef;border-radius:12px;padding:10px}.rv .k small{display:block;font-size:9px;font-weight:800;letter-spacing:.08em;color:#5b6478}.rv .k b{display:block;font-size:20px;margin:4px 0 2px}.rv .k i{font-style:normal;font-size:10px;color:#5b6478}
.rv h3{font-size:11px;letter-spacing:.14em;color:#0f2350;margin:16px 0 8px;border-bottom:2px solid #d32f2f;padding-bottom:4px;display:inline-block}
.rv .fr{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}.rv .fr div{border:1px solid #e3e7ef;border-radius:10px;text-align:center;padding:6px 2px}.rv .fr em{display:block;width:16px;height:16px;border-radius:50%;margin:0 auto 4px}.rv .fr small{display:block;font-size:8px;font-weight:700;min-height:20px}.rv .fr b{font-size:15px}
.rv p{font-size:11.5px;line-height:1.5;margin:0 0 6px}.rv .dds{background:#fff8dc;border-left:8px solid #f2c200;border-radius:8px;padding:10px 12px}.rv .ed{border-left:4px solid #1b3a7a;padding:4px 12px;font-family:Georgia,serif}
.rv table{width:100%;border-collapse:collapse;font-size:10px}.rv th{background:#0f2350;color:#fff;font-size:8.5px;padding:5px;text-align:right}.rv td{padding:4px 5px;border-bottom:1px solid #eef1f6;text-align:right}.rv th:first-child,.rv td:first-child{text-align:left}
.rv .ft{position:absolute;left:0;right:0;bottom:0;background:#0f2350;color:#fff;font-size:12px;font-weight:800;font-style:italic;padding:12px 34px;display:flex;justify-content:space-between}.rv .ft span{opacity:.6;font-weight:500;font-style:normal;font-size:10px}
.rv .rq{background:linear-gradient(135deg,#9b1c1c,#1b2a5a);color:#fff;border-radius:12px;padding:12px 16px;font-weight:800;font-style:italic;font-size:14px}</style>`;
    const hd = (t) => `<div class="hd"><div class="lg"><img src="${LOGO_DATA}" style="height:64px;width:auto"></div><div class="ey">CT LOS · FAROL OPERACIONAL · REVISTA DIÁRIA DE OPERAÇÕES</div><div class="tt">MORNING <span>OPERATIONAL NEWS</span></div><div class="sb">${t}</div></div>`;
    const ft = n => `<div class="ft">Carro parado é prejuízo. Vamos pra cima!<span>Morning Operational News · CT LOS · página ${n} de 2</span></div>`;
    const resumo = (document.querySelector(".lei") || {}).innerText || "";
    const p1 = `<div class="rv">${hd(`Edição de ${new Date().toLocaleDateString("pt-BR")} · Resultado de ${d1.dia}, ${d1.data} · Grupo LOS consolidado`)}<div class="bd">
<div class="k4"><div class="k"><small>FATURAMENTO D-1</small><b>${mi(d1.fat)}</b><i>meta ${mi(d1.meta)}</i></div><div class="k"><small>ATINGIMENTO D-1</small><b style="color:${corH(atD1)}">${pct(atD1)}</b><i>${sg(d1.fat - d1.meta)}</i></div><div class="k"><small>ACUMULADO DO MÊS</small><b>${mi(M.acum)}</b><i>${pct(atAcO)} orçada · ${pct(atAcB)} BI</i></div><div class="k"><small>PROJEÇÃO DO MÊS</small><b>${mi(M.proj)}</b><i>estimativa</i></div></div>
<h3>FAROL DO DIA POR REGIONAL</h3><div class="fr">${D.farol.map(([n, p]) => `<div><em style="background:${corH(p)}"></em><small>${n}</small><b style="color:${corH(p)}">${pct(p)}</b></div>`).join("")}</div>
${D.dds ? `<h3>SEGURANÇA EM PRIMEIRO LUGAR · DDS</h3><div class="dds"><p><b>${D.dds.titulo}</b></p><p>${D.dds.texto}</p><p><b>— ${D.dds.autor}</b></p></div>` : ""}
${D.editorial ? `<h3>MENSAGEM DO DIA</h3><div class="ed"><p>${D.editorial.texto}</p><p style="text-align:right"><i>— ${D.editorial.autor}</i></p></div>` : ""}
<h3>RESUMO DO DIA</h3>${resumo.split("\n").filter(Boolean).map(l => `<p>${l}</p>`).join("")}
${D.frase ? `<div class="rq" style="margin-top:10px">“${D.frase.texto}” — ${D.frase.autor}</div>` : ""}</div>${ft(1)}</div>`;
    let ac = 0, am = 0;
    const p2 = `<div class="rv">${hd(`Números da edição · ${d1.data}`)}<div class="bd">
<h3>FECHAMENTO DO MÊS POR REGIONAL</h3><table><tr><th>REGIONAL</th><th>FATURAMENTO</th><th>META DO MÊS</th><th>ATING. TOTAL</th><th>ATING. PARCIAL</th><th>NECESSÁRIO/DIA ÚTIL</th><th>QUADRANTE</th></tr>
${D.reg.map(r => `<tr><td><b>${r[0]}</b></td><td>${brl(r[1])}</td><td>${brl(r[2])}</td><td>${pct(r[1] / r[2] * 100)}</td><td style="color:${corH(r[3])};font-weight:800">${pct(r[3])}</td><td>${brl((r[2] - r[1]) / M.duRest)}</td><td>${r[7]}</td></tr>`).join("")}</table>
<h3>PERFORMANCE POR DIA</h3><table><tr><th>DATA</th><th>FATURAMENTO</th><th>META</th><th>ATING.</th><th>DESVIO</th><th>ACUMULADO</th><th>ATING. ACUM.</th></tr>
${D.dias.map(x => { ac += x[2]; am += x[3]; const p = x[2] / x[3] * 100; return `<tr><td>${x[0]} ${x[1]}</td><td>${brl(x[2])}</td><td>${brl(x[3])}</td><td style="color:${corH(p)};font-weight:800">${pct(p)}</td><td>${sg(x[2] - x[3])}</td><td>${brl(ac)}</td><td>${pct(ac / am * 100)}</td></tr>`; }).join("")}</table>
<h3>PASSADO × FUTURO</h3><div class="k4"><div class="k"><small>FALTA P/ META ORÇADA</small><b>${mi(falta)}</b><i>meta ${mi(M.metaOrc)}</i></div><div class="k"><small>DIAS ÚTEIS</small><b>${M.duRest}</b><i>restantes</i></div><div class="k"><small>NECESSÁRIO/DIA ÚTIL</small><b>${mi(necDU)}</b><i>média real ${mi(M.mediaDU)}</i></div><div class="k"><small>FECHAMENTO</small><b>${D.proj3.map(p => p[1]).sort((a, b) => a - b).map(v => v.toLocaleString("pt-BR", { minimumFractionDigits: 1 })).filter((v, i, a) => i === 0 || i === a.length - 1).join("–")} mi</b><i>3 projeções (estimativa)</i></div></div>
${D.avisos && D.avisos.length ? `<p style="margin-top:12px;font-size:10px;color:#7a5200">⚠ ${D.avisos.join(" ")}</p>` : ""}
<p style="margin-top:10px;font-size:9.5px;color:#5b6478">Fonte: ${D.meta.fonte}. Projeções são estimativas. Gerado pelo app Farol Operacional.</p></div>${ft(2)}</div>`;
    return css + p1 + p2;
  }
  async function revistaPDF() {
    await libs(); await logoData();
    const box = document.createElement("div"); box.style.cssText = "position:absolute;left:0;top:0;z-index:-5;pointer-events:none"; box.innerHTML = revistaHTML(); document.body.appendChild(box);
    await Promise.all([...box.querySelectorAll("img")].map(i => i.complete && i.naturalWidth ? 0 : new Promise(r => { i.onload = i.onerror = r; }))); await new Promise(r => setTimeout(r, 150));
    const pdf = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    const pages = box.querySelectorAll(".rv");
    for (let i = 0; i < pages.length; i++) {
      const cv = await window.html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: "#ffffff", scrollX: 0, scrollY: -window.scrollY, windowWidth: 794 });
      // o logo é desenhado direto no canvas (o html2canvas nem sempre captura imagens)
      const li = pages[i].querySelector(".lg img"); if (li) { const pr = pages[i].getBoundingClientRect(), r = li.getBoundingClientRect(); const lim = await img(LOGO_DATA);
        const k = cv.width / pr.width, cx = cv.getContext("2d"); cx.setTransform(1, 0, 0, 1, 0, 0); cx.drawImage(lim, (r.left - pr.left) * k, (r.top - pr.top) * k, r.width * k, r.height * k); }
      if (i) pdf.addPage();
      pdf.addImage(cv.toDataURL("image/jpeg", .9), "JPEG", 0, 0, 595.28, 841.89);
    }
    box.remove();
    return pdf.output("blob");
  }

  /* ---------- tela do pacote ---------- */
  const nomeBase = () => "Revista_Diaria_CT_LOS_" + isoOf(d1.data);
  async function abrir() {
    if (!D) { toastMsg("Carregue o PDF do dia primeiro."); return; }
    openSheet(`<div class="sh"><b>Pacote do dia · WhatsApp</b><button id="xS">×</button></div>
<div class="card" style="text-align:center"><div id="pkPrev" class="note">Gerando o cartão e a revista…</div></div>
<div class="sec">Texto da mensagem</div><div class="card"><div class="fx" id="pkTxt" style="max-height:220px;overflow:auto"></div></div>
<div style="display:grid;gap:8px;margin-top:12px">
<button class="btn" id="pkSend" style="background:#25d366" disabled>Enviar no WhatsApp (cartão + revista + texto)</button>
<button class="btn sec2" id="pkCopy">Copiar texto</button>
<button class="btn sec2" id="pkPdf" disabled>Baixar revista em PDF</button></div>
<p class="note">No celular, toque em Enviar e escolha o WhatsApp: vão o cartão com o logo do Grupo LOS, a revista em PDF anexa e o texto. No computador, os arquivos são baixados e o WhatsApp abre com o texto.</p>`);
    const t = texto(); document.getElementById("pkTxt").textContent = t;
    document.getElementById("pkCopy").onclick = async () => { try { await navigator.clipboard.writeText(t); toastMsg("Texto copiado."); } catch (e) { toastMsg("Não foi possível copiar."); } };
    let png, pdf;
    try { png = await cartao(); document.getElementById("pkPrev").innerHTML = `<img src="${URL.createObjectURL(png)}" style="width:100%;max-width:320px;border-radius:14px;box-shadow:0 6px 18px rgba(0,0,0,.2)">`; }
    catch (e) { document.getElementById("pkPrev").textContent = "Não consegui gerar o cartão: " + e.message; }
    try { pdf = (typeof revistaOriginal === "function" && await revistaOriginal()) || await revistaPDF(); document.getElementById("pkPdf").disabled = false; }
    catch (e) { toastMsg("Não consegui gerar a revista: " + e.message); }
    document.getElementById("pkSend").disabled = false; try { logEv("pacote"); } catch (e) {}
    const baixar = (blob, nome) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); a.remove(); };
    document.getElementById("pkPdf").onclick = () => pdf && baixar(pdf, nomeBase() + ".pdf");
    document.getElementById("pkSend").onclick = async () => {
      const files = []; if (png) files.push(new File([png], "Farol_CT_LOS_" + isoOf(d1.data) + ".png", { type: "image/png" })); if (pdf) files.push(new File([pdf], nomeBase() + ".pdf", { type: "application/pdf" }));
      try { if (navigator.canShare && navigator.canShare({ files })) { await navigator.share({ files, text: t, title: "Morning Operational News · " + d1.data }); return; } } catch (e) { if (e.name === "AbortError") return; }
      files.forEach(f => baixar(f, f.name)); window.open("https://wa.me/?text=" + encodeURIComponent(t), "_blank");
    };
  }
  async function gerarRevista() {
    if (!D) { toastMsg("Carregue o PDF do dia primeiro."); return; }
    toastMsg("Preparando a revista…");
    try { const orig = typeof revistaOriginal === "function" ? await revistaOriginal() : null; const pdf = orig || await revistaPDF();
      prontoParaEnviar(orig ? "Revista completa do dia" : "Revista (resumo gerado pelo app)", new File([pdf], nomeBase() + ".pdf", { type: "application/pdf" }), `*Morning Operational News · CT LOS* · resultado de ${d1.data}`, false);
    } catch (e) { toastMsg("Não consegui preparar a revista: " + e.message); } }
  window.FarolPacote = { abrir, texto, cartao, revistaPDF, gerarRevista };
})();
