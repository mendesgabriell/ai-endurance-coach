/**
 * Gera os blocos SESS e WEEKS do artefato Calendário Macela a partir de
 * src/plan/plan.ts, que é a fonte única do plano.
 *
 * Substituição cirúrgica: só essas duas regiões são reescritas. Notas, CSS,
 * script de render e o <script id="state"> com as marcações do atleta ficam
 * intactos.
 *
 *   npx tsx scripts/build-calendar.ts <caminho-do-html>
 */
import fs from "node:fs";
import { BLOCKS, PLAN } from "../src/plan/plan";
import type { SessionKind } from "../src/plan/types";

const TAG: Record<SessionKind, string> = {
  corrida: "R", perna: "P", superiores: "U",
  recovery: "V", nutricao: "N", chave: "K",
};
const DOT: Record<SessionKind, string> = {
  corrida: "d-run", perna: "d-str", superiores: "d-up",
  recovery: "d-rec", nutricao: "d-nut", chave: "d-key",
};

const q = (s: string) => JSON.stringify(s);

// listas de exercício repetidas viram variável, para o HTML não inchar
const seen = new Map<string, { name: string; count: number; items: string[] }>();
for (const s of PLAN) {
  if (!s.exercises?.length) continue;
  const key = JSON.stringify(s.exercises);
  const hit = seen.get(key);
  if (hit) hit.count++;
  else seen.set(key, { name: "", count: 1, items: s.exercises });
}
let n = 0;
for (const v of seen.values()) if (v.count > 1) v.name = `EX${++n}`;

const varLines = [...seen.values()]
  .filter((v) => v.name)
  .map((v) => `var ${v.name}=[${v.items.map(q).join(",\n ")}];`);

const sessLines: string[] = [];
let prevDate: string | null = null;
for (const s of PLAN) {
  if (prevDate && s.date !== prevDate) sessLines.push("");
  const parts = [q(s.id), q(s.date), TAG[s.kind], q(s.text), q(DOT[s.kind])];
  const hasEx = Boolean(s.exercises?.length);
  if (hasEx) {
    const v = seen.get(JSON.stringify(s.exercises))!;
    parts.push(v.name || `[${v.items.map(q).join(",")}]`);
  } else if (s.why) {
    parts.push('""');
  }
  if (s.why) parts.push(q(s.why));
  sessLines.push(`[${parts.join(",")}],`);
  prevDate = s.date;
}

const sess =
  "// GERADO por scripts/build-calendar.ts a partir de src/plan/plan.ts.\n" +
  "// Nao editar na mao: a proxima geracao sobrescreve.\n" +
  varLines.join("\n") +
  "\n\nvar SESS=[\n" + sessLines.join("\n") + "\n];";

const weeks =
  "var WEEKS=[\n" +
  BLOCKS.map((b) => ` {s:${q(b.start)},t:${q(b.title)},d:${q(b.detail)}}`).join(",\n") +
  "\n];";

const file = process.argv[2]!;
let html = fs.readFileSync(file, "utf8");

const before = html;
html = html.replace(/\/\/ ---- blocos de exercício[\s\S]*?\nvar SESS=\[[\s\S]*?\n\];/, sess);
html = html.replace(/\/\/ GERADO por scripts[\s\S]*?\nvar SESS=\[[\s\S]*?\n\];/, sess);
html = html.replace(/var WEEKS=\[[\s\S]*?\n\];/, weeks);
if (html === before) throw new Error("nao encontrei as regioes SESS/WEEKS para substituir");

fs.writeFileSync(file, html);
console.log(`SESS: ${PLAN.length} sessoes  |  blocos de exercicio reaproveitados: ${n}  |  WEEKS: ${BLOCKS.length}`);
