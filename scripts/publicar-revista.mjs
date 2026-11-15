// Publica a revista do dia no Farol, igual ao botão "Carregar PDF" + "Publicar" do app.
// Uso: FAROL_SENHA=... node scripts/publicar-revista.mjs caminho/revista.pdf [--seco]
// --seco: só lê e mostra o resumo (não precisa de senha, não grava nada).
// A senha NUNCA é gravada em arquivo; vem só pela variável de ambiente.
import { createRequire } from "module";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pdf = process.argv[2], seco = process.argv.includes("--seco"), senha = process.env.FAROL_SENHA || "";
if (!pdf || !fs.existsSync(pdf)) { console.error("PDF não encontrado"); process.exit(1); }
if (!seco && !senha) { console.error("Falta FAROL_SENHA"); process.exit(1); }

const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".webmanifest": "application/json" };
const srv = http.createServer((q, r) => {
  const p = path.join(RAIZ, decodeURIComponent(q.url.split("?")[0]).replace(/^\/$/, "/index.html"));
  if (!p.startsWith(RAIZ) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "Content-Type": MIME[path.extname(p)] || "application/octet-stream" }); fs.createReadStream(p).pipe(r);
}).listen(0);
const url = `http://127.0.0.1:${srv.address().port}/index.html`;

const nav = await chromium.launch(); const pg = await nav.newPage();
await pg.goto(url); await pg.waitForFunction(() => window.FarolPDF && typeof textoPDF === "function");
const b64 = fs.readFileSync(pdf).toString("base64");
const ultimo = fs.existsSync(path.join(RAIZ, "data/ultimo.enc")) ? fs.readFileSync(path.join(RAIZ, "data/ultimo.enc"), "utf8") : null;

const res = await pg.evaluate(async ({ b64, senha, seco, ultimo }) => {
  const u = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const file = new File([u], "revista.pdf", { type: "application/pdf" });
  const pages = await textoPDF(file), txt = pages.join("\n");
  if (!/MORNING|OPERATIONAL NEWS|Performance por dia/i.test(txt)) throw new Error("Este PDF não é a revista Morning Operational News.");
  const Dx = FarolPDF.parse(pages); Dx.meta = Object.assign(Dx.meta || {}, { modo: "pdf" });
  // corrige DDS e frase pelo banco (o layout novo da revista quebra o título "🦺 DDS: ..." e junta palavras)
  const sq = s => String(s || "").toLowerCase().replace(/^[^a-zà-ú]*(dds:)?\s*/i, "").replace(/[^a-zà-ú0-9]/g, "");
  try { const B = await (await fetch("data/bancos.json", { cache: "no-store" })).json();
    if (Dx.dds) { const b = B.dds.find(x => sq(x[0]) === sq(Dx.dds.titulo) || sq(x[1]) === sq(Dx.dds.texto)); if (b) Object.assign(Dx.dds, { titulo: b[0], texto: b[1] }); else Dx.dds.titulo = Dx.dds.titulo.replace(/^[^A-Za-zÀ-ú]*(dds:)?\s*/i, "").replace(/^./, c => c.toUpperCase()); }
    if (Dx.frase) { const f = B.frases.find(x => sq(x[0]) === sq(Dx.frase.texto)); if (f) Object.assign(Dx.frase, { texto: f[0], autor: f[1] }); }
  } catch (e) {}
  const resumo = { dds: Dx.dds, frase: Dx.frase, editorial: Dx.editorial, d1: Dx.d1, farol: Dx.farol, acum: Dx.mes && Dx.mes.acum, regs: (Dx.reg || []).length };
  if (seco) return { resumo };
  // confere a senha contra a edição já publicada antes de sobrescrever qualquer coisa
  if (ultimo) { try { await decifrar(ultimo, senha); } catch (e) { throw new Error("Senha não abre a edição publicada (ultimo.enc). Nada foi gravado."); } }
  const ed = await cifrar(Dx, senha), rev = await cifrarBytes(u, senha);
  const volta = await decifrar(ed, senha); if (volta.d1.data !== Dx.d1.data) throw new Error("Falha na conferência da criptografia.");
  return { resumo, iso: isoOf(Dx.d1.data), ed, rev };
}, { b64, senha, seco, ultimo });
await nav.close(); srv.close();

console.log(JSON.stringify(res.resumo, null, 1));
if (!seco) {
  fs.writeFileSync(path.join(RAIZ, `data/edicoes/${res.iso}.enc`), res.ed);
  fs.writeFileSync(path.join(RAIZ, `data/revistas/${res.iso}.enc`), res.rev);
  fs.writeFileSync(path.join(RAIZ, "data/ultimo.enc"), res.ed);
  console.log("GRAVADO", res.iso);
}
