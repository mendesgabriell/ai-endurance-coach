// Uso único: tira o modelo do ciclo de dentro do public/dash.html e escreve
// src/plan/ciclo-bau.ts. Depois disso o TypeScript é a fonte.
import fs from "node:fs";

const html = fs.readFileSync("public/dash.html", "utf8");

/** Acha `var NOME=` e devolve a expressão inteira, balanceando chaves e aspas. */
function decl(nome) {
  const re = new RegExp(`var\\s+${nome}\\s*=`, "g");
  const m = re.exec(html);
  if (!m) throw new Error(`não achei var ${nome}`);
  let i = m.index + m[0].length;
  while (/\s/.test(html[i])) i++;
  const start = i;
  let prof = 0, aspa = null, esc = false;
  for (; i < html.length; i++) {
    const c = html[i];
    if (esc) { esc = false; continue; }
    if (aspa) {
      if (c === "\\") esc = true;
      else if (c === aspa) aspa = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { aspa = c; continue; }
    if (c === "{" || c === "[") prof++;
    else if (c === "}" || c === "]") { prof--; if (prof === 0) { i++; break; } }
  }
  return html.slice(start, i);
}

const NOMES = ["D", "W", "CORRIDA", "FORCA_DIA", "ABD", "BLOCOS", "DIAS7"];
const src = NOMES.map((n) => `var ${n}=${decl(n)};`).join("\n");

// CORRIDA.teste é acrescentado depois da declaração — pega também
const mTeste = html.match(/CORRIDA\.teste\s*=\s*/);
let extra = "";
if (mTeste) {
  const i = mTeste.index + mTeste[0].length;
  let prof = 0, aspa = null, esc = false, j = i;
  for (; j < html.length; j++) {
    const c = html[j];
    if (esc) { esc = false; continue; }
    if (aspa) { if (c === "\\") esc = true; else if (c === aspa) aspa = null; continue; }
    if (c === '"' || c === "'" || c === "`") { aspa = c; continue; }
    if (c === "{" || c === "[") prof++;
    else if (c === "}" || c === "]") { prof--; if (prof === 0) { j++; break; } }
  }
  extra = `CORRIDA.teste=${html.slice(i, j)};`;
}

const sc = {};
new Function("sc", src + "\n" + extra + "\nsc.D=D;sc.CORRIDA=CORRIDA;sc.W=W;sc.FORCA_DIA=FORCA_DIA;sc.ABD=ABD;sc.BLOCOS=BLOCOS;sc.DIAS7=DIAS7;")(sc);

const j2 = (v) => JSON.stringify(v, null, 2);
const out = `import type { Bloco, SemanaModelo, SessaoCorrida, SessaoForca } from "./ciclo-types";

/**
 * MODELO DO CICLO · Pedra do Baú
 *
 * Extraído de public/dash.html em 06/10/2026 por scripts/extrair-ciclo.mjs.
 * A partir daqui ESTE arquivo é a fonte: plan.ts expande ele em sessões
 * datadas. O ciclo abre na segunda 28/09/2026 e fecha na INDOMIT Pedra do Baú.
 */

export const INICIO = "2026-09-28";

export const BLOCOS: Bloco[] = ${j2(sc.BLOCOS)};

/** O abdominal muda por dia da semana — índice de Date.getDay(), domingo = 0. */
export const ABDOMINAL: string[] = ${j2(sc.ABD)};

/** Qual sessão de força cai em cada dia da semana. */
export const FORCA_DO_DIA: Record<string, string> = ${j2(sc.FORCA_DIA)};

export const DIAS: readonly string[] = ${JSON.stringify(sc.DIAS7)};

/** Biblioteca de força, por código. */
export const FORCA: Record<string, SessaoForca> = ${j2(sc.W)};

/** Template de corrida por dia da semana, mais o teste de limiar. */
export const CORRIDA: Record<string, SessaoCorrida> = ${j2(sc.CORRIDA)};

/** As 25 semanas: volume, bloco e o que cai em cada dia. */
export const SEMANAS: SemanaModelo[] = ${j2(sc.D)};
`;
fs.writeFileSync("src/plan/ciclo-bau.ts", out);
console.log("semanas:", sc.D.length, "| blocos:", sc.BLOCOS.length);
console.log("corrida (template):", Object.keys(sc.CORRIDA).join(" "));
console.log("força (biblioteca):", Object.keys(sc.W).join(" "));
console.log("força por dia:", JSON.stringify(sc.FORCA_DIA));
console.log("abdominais:", sc.ABD.length);
