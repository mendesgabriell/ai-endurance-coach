import assert from "node:assert/strict";
import test from "node:test";
import { classify, dayLabel, isQuestion, resolveDay } from "../src/coach/intent";

const HOJE = "2026-09-06"; // domingo

test("reconhece pergunta", () => {
  assert.ok(isQuestion("O que tá pendente de ontem?"));
  assert.ok(isQuestion("Me lembra qual era o treino de esteira de ontem"));
  assert.ok(isQuestion("qual o treino de amanhã"));
  assert.equal(isQuestion("Fiz a rodagem fácil hoje"), false);
  assert.equal(isQuestion("corri 8k em 48min"), false);
});

test("resolve o dia citado", () => {
  assert.equal(resolveDay("o que rolou ontem", HOJE), "2026-09-05");
  assert.equal(resolveDay("e anteontem?", HOJE), "2026-09-04");
  assert.equal(resolveDay("o treino de amanhã", HOJE), "2026-09-07");
  assert.equal(resolveDay("depois de amanhã tem o quê", HOJE), "2026-09-08");
  assert.equal(resolveDay("sem referência nenhuma", HOJE), HOJE);
});

test("dia da semana volta para a ocorrência mais recente", () => {
  assert.equal(resolveDay("o que teve na sexta?", HOJE), "2026-09-04");
  assert.equal(resolveDay("e no sábado?", HOJE), "2026-09-05");
  assert.equal(resolveDay("na próxima terça?", HOJE), "2026-09-08");
});

test("as duas perguntas reais do atleta", () => {
  const a = classify("Me lembra qual era o treino de esteira de ontem", HOJE);
  assert.equal(a.type, "ask");
  assert.equal(a.type === "ask" && a.day, "2026-09-05");
  assert.ok(a.kinds.includes("corrida"));

  const b = classify("O que tá pendente de ontem?", HOJE);
  assert.equal(b.type === "ask" && b.scope, "pendente");
  assert.equal(b.type === "ask" && b.day, "2026-09-05");
});

test("log continua sendo log", () => {
  const c = classify("Fiz a rodagem fácil hoje e agora vou pro treino de superiores", HOJE);
  assert.equal(c.type, "log");
});

test("pergunta de semana", () => {
  const d = classify("como fica o resto da semana?", HOJE);
  assert.equal(d.type === "ask" && d.scope, "semana");
});

test("rótulo do dia", () => {
  assert.equal(dayLabel("2026-09-05", HOJE), "ontem, sábado 05/09");
  assert.equal(dayLabel("2026-09-06", HOJE), "hoje, domingo 06/09");
  assert.equal(dayLabel("2026-09-12", HOJE), "sábado 12/09");
});
