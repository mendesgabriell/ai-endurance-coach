import assert from "node:assert/strict";
import test from "node:test";
import { buildWorkout, toEvent } from "../src/integrations/intervals/map";
import type { PlannedSession } from "../src/plan/types";

/** toEvent devolve null para o que não sobe; nestes casos tem que subir. */
function mustEvent(s: PlannedSession) {
  const e = toEvent(s);
  assert.ok(e, `${s.id} deveria virar evento`);
  return e;
}

test("bloco de repetição absorve a linha de recuperação seguinte", () => {
  const { description, movingTime } = buildWorkout([
    "12' aquecimento caminhando a 5%",
    "4 × 7' caminhando forte a 15% (bastões se tiver)",
    "recuperação 3' a 3% entre as séries",
    "5' solto",
  ]);
  assert.match(description, /^- 12m aquecimento caminhando a 5%$/m);
  assert.match(description, /^4x$/m);
  assert.match(description, /^- 7m caminhando forte a 15% \(bastões se tiver\)$/m);
  assert.match(description, /^- 3m recuperação a 3% entre as séries$/m);
  assert.match(description, /^- 5m solto$/m);
  // 12 + 4×(7+3) + 5 = 57 min
  assert.equal(movingTime, 57 * 60);
});

test("aceita segundos e repetição sem recuperação", () => {
  const { description, movingTime } = buildWorkout([
    "15' aquecimento",
    "8 × 20\" forte em 10–15%",
    "15' solto",
  ]);
  assert.match(description, /^8x$/m);
  assert.match(description, /^- 20s forte em 10–15%$/m);
  assert.equal(movingTime, 15 * 60 + 8 * 20 + 15 * 60);
});

test("corrida vira Run com passos e id estável", () => {
  const e = mustEvent({
    id: "n5", date: "2026-09-07", kind: "corrida",
    text: "ACADEMIA · esteira power hiking",
    exercises: ["12' aquecimento", "4 × 7' a 15%", "recuperação 3' a 3%", "5' solto"],
  });
  assert.equal(e.category, "WORKOUT");
  assert.equal(e.type, "Run");
  assert.equal(e.external_id, "coach-n5");
  assert.equal(e.start_date_local, "2026-09-07T00:00:00");
});

test("perna e superiores viram WeightTraining com a lista de exercícios", () => {
  const e = mustEvent({
    id: "n6", date: "2026-09-07", kind: "perna", text: "Perna · Excêntrico + glúteo",
    exercises: ["Agachamento — 4 × 6 · negativa de 4s", "Cadeira adutora — 3 × 15"],
  });
  assert.equal(e.type, "WeightTraining");
  assert.match(e.description!, /^- Agachamento — 4 × 6 · negativa de 4s$/m);
  assert.match(e.description!, /^- Cadeira adutora — 3 × 15$/m);
});

test("nutrição e recovery não sobem de jeito nenhum", () => {
  for (const kind of ["nutricao", "recovery"] as const) {
    assert.equal(toEvent({ id: "x", date: "2026-09-07", kind, text: "Calor · 4 de 6" }), null);
  }
});

test("chave é treino quando tem trilha, e lembrete quando é REGRA", () => {
  const prova = mustEvent({ id: "s1", date: "2026-09-12", kind: "chave", text: "WTR TERRAS VULCÂNICAS · 16 km / ~900 m" });
  assert.equal(prova.category, "WORKOUT");
  assert.equal(prova.type, "Run");

  const regra = mustEvent({ id: "t2", date: "2026-09-13", kind: "chave", text: "REGRA: prova te esvaziou ontem? Hoje vira 50' e ponto" });
  assert.equal(regra.category, "NOTE");
});

test("corrida sem duração é instrução, não treino no relógio", () => {
  for (const text of [
    "Subida: teto de 142 bpm. Vai perder posição — é o exercício.",
    "Descida: solta. 3º estímulo excêntrico do ciclo.",
    "Off completo — você vem de prova + longão",
  ]) {
    const e = mustEvent({ id: "x", date: "2026-09-12", kind: "corrida", text });
    assert.equal(e.category, "NOTE", text);
    assert.equal(e.type, undefined);
  }
  // e a corrida de verdade continua sendo treino
  const real = mustEvent({ id: "o1", date: "2026-09-08", kind: "corrida", text: "Regenerativo 40' bem fácil" });
  assert.equal(real.type, "Run");
});
