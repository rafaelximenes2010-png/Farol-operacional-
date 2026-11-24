// Publica a projeção do mês por regional (PDF "Projeção de cada regional" do Power BI) na aba Meta do Farol,
// igual ao "Carregar PDF" do app do administrador. Grava data/projreg.enc (cifrado com a senha da equipe),
// mantendo os meses anteriores. Os valores são exatamente os do BI.
// Uso: FAROL_SENHA=... node scripts/publicar-projecao.mjs caminho/projecao.pdf [--seco]
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
const arq = path.join(RAIZ, "data/projreg.enc");

const nav = await chromium.launch(); const pg = await nav.newPage();
await pg.goto(url); await pg.waitForFunction(() => window.FarolPDF && FarolPDF.parseProj && typeof textoPDF === "function");
const b64 = fs.readFileSync(pdf).toString("base64");
const atual = fs.existsSync(arq) ? fs.readFileSync(arq, "utf8") : null;
const ultimo = fs.existsSync(path.join(RAIZ, "data/ultimo.enc")) ? fs.readFileSync(path.join(RAIZ, "data/ultimo.enc"), "utf8") : null;

const res = await pg.evaluate(async ({ b64, senha, seco, atual, ultimo }) => {
  const u = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const txt = (await textoPDF(new File([u], "projecao.pdf", { type: "application/pdf" }))).join("\n");
  if (FarolPDF.tipo(txt) !== "proj") throw new Error("Este PDF não é a Projeção de cada regional (Fechamento por regional com Projeção e Volume).");
  const P = FarolPDF.parseProj(txt);
  if (!P.mes) throw new Error("O PDF não mostra o período do mês.");
  if (Math.abs(P.conferencia.difProj) > 1) throw new Error("Soma das regionais difere do total do BI em " + P.conferencia.difProj + ". Nada foi gravado.");
  const e = (P.exportado || "").match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2})/); P.exportadoIso = e ? `${e[3]}-${e[2]}-${e[1]}T${e[4]}` : "";
  if (seco) return { P };
  if (ultimo) { try { await decifrar(ultimo, senha); } catch (x) { throw new Error("Senha não abre a edição publicada (ultimo.enc). Nada foi gravado."); } }
  let base = { meses: {} }; if (atual) { try { base = await decifrar(atual, senha); } catch (x) { throw new Error("Senha não abre o projreg.enc atual. Nada foi gravado."); } }
  base.meses = base.meses || {}; base.meses[P.mes] = P;
  const enc = await cifrar(base, senha); const volta = await decifrar(enc, senha);
  if (volta.meses[P.mes].total.proj !== P.total.proj) throw new Error("Falha na conferência da criptografia.");
  return { P, enc };
}, { b64, senha, seco, atual, ultimo });
await nav.close(); srv.close();

const P = res.P;
console.log(`${P.rotulo} · exportado ${P.exportado} · ${P.regs.length} regionais · projeção total ${P.total.proj.toLocaleString("pt-BR")} · meta ${P.total.meta.toLocaleString("pt-BR")}`);
P.regs.forEach(r => console.log(`  ${r.nome.padEnd(16)} meta ${String(r.meta).padStart(11)}  parcial ${String(r.atParc).padStart(4)}%  projeção ${String(r.proj).padStart(11)}`));
if (!seco) { fs.writeFileSync(arq, res.enc); console.log("GRAVADO data/projreg.enc", P.mes); }
