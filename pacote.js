/* Farol Operacional · PACOTE DO DIA
   A partir da edição carregada (edição da equipe do dia), gera:
   1) a revista impressa em PDF (A4, 6 páginas, padrão Morning Operational News — revista.js);
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
    const DIAS = { dom: "domingo", seg: "segunda", ter: "terça", qua: "quarta", qui: "quinta", sex: "sexta", sáb: "sábado", sab: "sábado" };
    const DIASF = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
    const [dd, mm, aa] = d1.data.split("/").map(Number), ed = new Date(aa, mm - 1, dd + 1);
    const edS = `${DIASF[ed.getDay()]}, ${String(ed.getDate()).padStart(2, "0")}/${String(ed.getMonth() + 1).padStart(2, "0")}/${ed.getFullYear()}`;
    const tit = n => n.toLowerCase().replace(/(^|[\s\/-])(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/\bLosx\b/, "LOSX").replace(/Ceara/, "Ceará").replace(/Avancado/, "Avançado");
    const f = [...D.farol].sort((a, b) => b[1] - a[1]), g = f.filter(x => x[1] >= 100), y = f.filter(x => x[1] >= 90 && x[1] < 100), r = f.filter(x => x[1] < 90);
    const lin = (e, arr) => arr.map(([n, p]) => `${e} ${tit(n)} ${pct(p)}\n`).join("");
    const ag = D.reg.filter(x => x[3] < 100).map(x => `${tit(x[0])} (${pct(x[3])} no parcial)`).concat(r.filter(x => !D.reg.some(q => q[0] === x[0] && q[3] < 100)).map(x => tit(x[0])));
    const sgn = v => (v >= 0 ? "+" : "−") + brl(Math.abs(v));
    let t = `☀️ *MORNING OPERATIONAL NEWS*\n_Revista Diária de Operações | CT LOS_\nEdição de ${edS}\n\nBom dia, time! A edição de hoje já está disponível. 📎\n\n`;
    t += `📊 *D-1 (${DIAS[d1.dia] || d1.dia}, ${d1.data.slice(0, 5)})*\nFaturamento: ${brl(d1.fat)}\nAtingimento: *${pct(atD1)}* da meta do dia (${sgn(d1.fat - d1.meta)})\n\n`;
    t += `🚦 *Farol do dia:* ${g.length} de ${f.length} regionais no verde\n` + lin("🟢", g) + lin("🟡", y) + lin("🔴", r) + "\n";
    t += `📈 *Acumulado do mês*\n*${brl(M.acum)}*, ${pct(atAcO)} da meta orçada proporcional (${sgn(M.acum - M.metaAcOrc)})\n\n`;
    t += `🎯 *Ritmo para a meta*\nFaltam ${brl(falta)} em ${M.duRest} dias úteis: ${brl(necDU)} por dia útil.\nNossa média realizada é de ${brl(M.mediaDU)} por dia útil.\nProjeção de fechamento: R$ ${(M.proj / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi, contra meta orçada de R$ ${(M.metaOrc / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi.\n\n`;
    if (ag.length) t += `⚠️ *Onde agir hoje:* ${ag.length > 1 ? ag.slice(0, -1).join(", ") + " e " + ag[ag.length - 1] : ag[0]}.\n\n`;
    if (D.dds) { const ult = (D.dds.texto.match(/[^.!?]+[.!?]/g) || [D.dds.texto]).map(x => x.trim()); const ult0 = ult.find(x => /nenhuma/i.test(x)) || ult.find(x => /cuid|segur/i.test(x)) || ""; t += `🦺 *DDS do dia:* ${D.dds.titulo.replace(/[!.]$/, "")}.${ult0 ? " " + ult0 : ""}\n\n`; }
    const ab = D.editorial ? (D.editorial.texto.match(/[^.!?]+[.!?]/g) || [""]).slice(0, 2).map(x => x.trim()).join(" ") : "";
    t += `${ab ? ab + " " : ""}*Carro parado é prejuízo. Pra cima!* 🚀`;
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
    const k = [["FATURAMENTO D-1", mi(d1.fat), "meta " + mi(d1.meta)], ["ATINGIMENTO D-1", pct(atD1), atD1 >= 100 ? "acima da meta" : "abaixo da meta"], ["ACUMULADO DO MÊS", mi(M.acum), pct(atAcO) + " orçada · " + pct(atAcB) + " BI"], ["PROJEÇÃO DO MÊS", mi(M.proj), "projeção"]];
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
  function revistaHTML() { window.__LOGO = LOGO_DATA; return window.FarolRevista.html(); }
  async function revistaPDF() {
    await libs(); await logoData();
    // capa opaca por cima da tela enquanto a revista é montada (as páginas ficam atrás dela e nunca aparecem)
    const capa = document.createElement("div");
    capa.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#0b1a3f;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;font:600 15px system-ui,-apple-system,sans-serif";
    capa.innerHTML = '<div style="font-size:30px">📰</div><div>Gerando a revista do dia…</div><div id="rvProg" style="opacity:.7;font-size:13px">página 1 de 6</div>';
    const box = document.createElement("div"); box.style.cssText = "position:absolute;left:0;top:0;width:794px;z-index:-5;pointer-events:none";
    document.body.appendChild(capa);
    try {
      box.innerHTML = revistaHTML(); document.body.appendChild(box);
      await Promise.all([...box.querySelectorAll("img")].map(i => i.complete && i.naturalWidth ? 0 : new Promise(r => { i.onload = i.onerror = r; }))); await new Promise(r => setTimeout(r, 150));
      const pdf = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
      const pages = box.querySelectorAll(".rv");
      for (let i = 0; i < pages.length; i++) {
        const pr0 = document.getElementById("rvProg"); if (pr0) pr0.textContent = `página ${i + 1} de ${pages.length}`;
        const cv = await window.html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: "#ffffff", scrollX: 0, scrollY: -window.scrollY, windowWidth: 794, ignoreElements: el => el === capa });
        // o logo é desenhado direto no canvas (o html2canvas nem sempre captura imagens)
        const li = pages[i].querySelector(".lg img"); if (li) { const pr = pages[i].getBoundingClientRect(), r = li.getBoundingClientRect(); const lim = await img(LOGO_DATA);
          const k = cv.width / pr.width, cx = cv.getContext("2d"); cx.setTransform(1, 0, 0, 1, 0, 0); cx.drawImage(lim, (r.left - pr.left) * k, (r.top - pr.top) * k, r.width * k, r.height * k); }
        if (i) pdf.addPage();
        pdf.addImage(cv.toDataURL("image/jpeg", .9), "JPEG", 0, 0, 595.28, 841.89);
        cv.width = cv.height = 0;
      }
      return pdf.output("blob");
    } finally { box.remove(); capa.remove(); }
  }

  /* ---------- tela do pacote ---------- */
  const nomeBase = () => "Revista_Diaria_CT_LOS_" + isoOf(d1.data);
  async function abrir() {
    if (!D) { toastMsg("Carregue a edição da equipe do dia primeiro."); return; }
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
    document.getElementById("pkSend").onclick = async () => { try { await navigator.clipboard.writeText(t); } catch (e) {}
      const files = []; if (png) files.push(new File([png], "Farol_CT_LOS_" + isoOf(d1.data) + ".png", { type: "image/png" })); if (pdf) files.push(new File([pdf], nomeBase() + ".pdf", { type: "application/pdf" }));
      try { if (navigator.canShare && navigator.canShare({ files })) { await navigator.share({ files, text: t, title: "Morning Operational News · " + d1.data }); return; } } catch (e) { if (e.name === "AbortError") return; }
      files.forEach(f => baixar(f, f.name)); window.open("https://wa.me/?text=" + encodeURIComponent(t), "_blank");
    };
  }
  async function gerarRevista() {
    if (!D) { toastMsg("Carregue a edição da equipe do dia primeiro."); return; }
    toastMsg("Preparando a revista…");
    try { const orig = typeof revistaOriginal === "function" ? await revistaOriginal() : null;
      // sem a revista original do dia (edição feita só com os PDFs do Power BI): gera a revista pelo app
      const pdf = orig || await revistaPDF();
      prontoParaEnviar("Revista do dia", new File([pdf], nomeBase() + ".pdf", { type: "application/pdf" }), texto(), false);
    } catch (e) { toastMsg("Não consegui preparar a revista: " + e.message); } }
  window.FarolPacote = { abrir, texto, cartao, revistaPDF, gerarRevista };
})();
