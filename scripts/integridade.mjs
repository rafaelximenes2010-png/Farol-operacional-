// Verificação de integridade dos dados do Farol (roda no GitHub Actions a cada push em data/ e todo dia).
// 1) Todo arquivo cifrado (.enc) precisa ser um envelope válido {v,salt,iv,ct}.
// 2) Todo JSON de data/ precisa abrir.
// 3) Nenhuma edição/revista pode sumir ou ser corrompida: se o push apagou ou estragou um arquivo,
//    ele é restaurado da versão anterior (REF_ANTERIOR) — nada se perde.
// Uso: node scripts/integridade.mjs [REF_ANTERIOR]   (sem ref: só verifica)
import fs from "fs"; import path from "path"; import { execFileSync } from "child_process";
const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ref = process.argv[2] && /^[0-9a-f]{7,40}$/.test(process.argv[2]) ? process.argv[2] : null;
const git = (...a) => execFileSync("git", a, { cwd: RAIZ, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const envOk = t => { try { const j = JSON.parse(t); return j && j.v === 1 && [j.salt, j.iv, j.ct].every(x => typeof x === "string" && /^[A-Za-z0-9+/=]+$/.test(x) && x.length >= 16); } catch (e) { return false; } };
const jsonOk = t => { try { JSON.parse(t); return true; } catch (e) { return false; } };
const lista = d => fs.existsSync(path.join(RAIZ, d)) ? fs.readdirSync(path.join(RAIZ, d)).map(f => d + "/" + f) : [];
const atuais = ["data/ultimo.enc", ...["data/regmes.enc", "data/projreg.enc"].filter(f => fs.existsSync(path.join(RAIZ, f))), ...lista("data/edicoes"), ...lista("data/revistas")].filter(f => f.endsWith(".enc"));
const jsons = lista("data").filter(f => f.endsWith(".json"));
const erros = [], restaurados = [];
const okArq = (f, t) => f.endsWith(".enc") ? envOk(t) : jsonOk(t);
const restaurar = (f, motivo) => {
  if (!ref) { erros.push(`${f}: ${motivo}`); return; }
  let t; try { t = git("show", `${ref}:${f}`); } catch (e) { erros.push(`${f}: ${motivo} e não existe na versão anterior`); return; }
  if (!okArq(f, t)) { erros.push(`${f}: ${motivo} e a versão anterior também está inválida`); return; }
  fs.mkdirSync(path.dirname(path.join(RAIZ, f)), { recursive: true }); fs.writeFileSync(path.join(RAIZ, f), t); restaurados.push(`${f} (${motivo})`);
};
for (const f of atuais) { const t = fs.readFileSync(path.join(RAIZ, f), "utf8"); if (!envOk(t)) restaurar(f, "envelope cifrado inválido"); }
for (const f of jsons) { const t = fs.readFileSync(path.join(RAIZ, f), "utf8"); if (!jsonOk(t)) restaurar(f, "JSON inválido"); }
if (ref) { // arquivos que existiam antes e sumiram
  let antes = []; try { antes = git("ls-tree", "-r", "--name-only", ref, "--", "data/edicoes", "data/revistas", "data/ultimo.enc", "data/regmes.enc", "data/projreg.enc").split("\n").filter(Boolean); } catch (e) {}
  for (const f of antes) if (!fs.existsSync(path.join(RAIZ, f))) restaurar(f, "apagado");
}
const edicoes = lista("data/edicoes").filter(f => f.endsWith(".enc")).length;
console.log(`Integridade: ${atuais.length} arquivos cifrados · ${jsons.length} JSON · ${edicoes} edições`);
restaurados.forEach(r => console.log("RESTAURADO " + r));
erros.forEach(e => console.log("ERRO " + e));
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `restaurados=${restaurados.length}\n`);
process.exit(erros.length ? 1 : 0);
