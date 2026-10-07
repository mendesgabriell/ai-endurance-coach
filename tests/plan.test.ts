import assert from "node:assert/strict";
import { test } from "node:test";
import { SEMANAS } from "../src/plan/ciclo-bau";
import { expandirCiclo } from "../src/plan/expand";
import { PLAN, RACE_DATE, blockFor, daysToRace, semanaDoCiclo, sessionsOn } from "../src/plan/plan";

test("a prova é a única sessão do dia dela", () => {
  const dia = sessionsOn(RACE_DATE);
  assert.equal(dia.length, 1, "20/03 saía com prova + trilha + academia de braço");
  assert.equal(dia[0]!.kind, "chave");
  assert.match(dia[0]!.text, /INDOMIT/);
});

test("nenhum dia do ciclo tem mais de uma corrida e uma força", () => {
  const porDia = new Map<string, number>();
  for (const s of expandirCiclo()) porDia.set(s.date, (porDia.get(s.date) ?? 0) + 1);
  const demais = [...porDia].filter(([, n]) => n > 2);
  assert.deepEqual(demais, []);
});

test("o ciclo cobre 25 semanas sem buraco", () => {
  assert.equal(SEMANAS.length, 25);
  const sem = new Set(expandirCiclo().map((s) => semanaDoCiclo(s.date)));
  for (let w = 1; w <= 25; w++) assert.ok(sem.has(w), `semana ${w} vazia`);
});

test("os ids são estáveis entre duas expansões", () => {
  const a = expandirCiclo().map((s) => s.id);
  const b = expandirCiclo().map((s) => s.id);
  assert.deepEqual(a, b);
  assert.equal(new Set(a).size, a.length, "id repetido");
});

test("nenhuma sessão do plano fica sem bloco nem sem texto", () => {
  for (const s of PLAN) {
    assert.ok(s.text.trim().length > 0, `${s.id} sem texto`);
    assert.match(s.date, /^\d{4}-\d{2}-\d{2}$/, `${s.id} com data inválida`);
  }
});

test("o texto da sessão não vaza tag de HTML para o Telegram", () => {
  for (const s of expandirCiclo()) {
    const tudo = [s.text, s.why ?? "", ...(s.exercises ?? [])].join(" ");
    assert.doesNotMatch(tudo, /<\/?[a-z]/i, `${s.id} carrega tag`);
  }
});

test("daysToRace e blockFor concordam com o calendário", () => {
  assert.equal(daysToRace(RACE_DATE), 0);
  assert.equal(daysToRace("2027-03-19"), 1);
  assert.equal(blockFor("2026-09-28")?.title.startsWith("Bloco 0"), true);
  assert.equal(blockFor(RACE_DATE)?.title.startsWith("Bloco 4"), true);
});
