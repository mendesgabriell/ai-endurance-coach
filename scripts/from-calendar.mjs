// Converte o SESS do artefato Calendário Macela em src/plan/plan.ts.
// Uso único: a partir daqui plan.ts é a fonte e o calendário é gerado dele.
import fs from "node:fs";

const html = fs.readFileSync(process.argv[2], "utf8");
const js = html.match(/<script>\n?([\s\S]*?)<\/script>\s*$/)[1];
const start = js.indexOf('var R="t-run"');
const end = js.indexOf("var DOW=");
const body = js.slice(start, end);

const scope = {};
new Function("scope", body + "\nscope.SESS=SESS;scope.WEEKS=WEEKS;")(scope);

const KIND = { "t-run": "corrida", "t-str": "perna", "t-up": "superiores",
               "t-rec": "recovery", "t-nut": "nutricao", "t-key": "chave" };

const q = (s) => JSON.stringify(s);
const sessions = scope.SESS.map(([id, date, tag, text, , exercises, why]) => {
  const parts = [`id: ${q(id)}`, `date: ${q(date)}`, `kind: ${q(KIND[tag])}`, `text: ${q(text)}`];
  if (Array.isArray(exercises) && exercises.length)
    parts.push(`exercises: [${exercises.map(q).join(", ")}]`);
  if (why) parts.push(`why: ${q(why)}`);
  return "  { " + parts.join(", ") + " },";
});

// agrupa por dia, com linha em branco entre dias, para o arquivo ficar legível
const out = [];
let prev = null;
for (const line of sessions) {
  const d = line.match(/date: "([\d-]+)"/)[1];
  if (prev && d !== prev) out.push("");
  out.push(line);
  prev = d;
}

const blocks = scope.WEEKS.map(
  (w) => `  { start: ${q(w.s)}, title: ${q(w.t)}, detail: ${q(w.d)} },`
).join("\n");

fs.writeFileSync("src/plan/plan.ts", `import type { Block, PlannedSession } from "./types";

export const RACE_DATE = "2026-09-19";
export const RACE_NAME = "UTMB Paraty 58K";
export const ATHLETE_TZ = "America/Sao_Paulo";

export const BLOCKS: Block[] = [
${blocks}
];

/**
 * FONTE ÚNICA DO PLANO.
 * O calendário publicado é gerado daqui por scripts/build-calendar.mjs.
 * Editar aqui, rodar o script, publicar. Nunca editar o HTML na mão.
 */
export const PLAN: PlannedSession[] = [
${out.join("\n")}
];
`);
console.log("ATENCAO: reanexe as funcoes auxiliares (todayISO, sessionsOn, daysToRace, blockFor)");
console.log(`sessões convertidas: ${scope.SESS.length}`);
console.log(`blocos: ${scope.WEEKS.length}`);
