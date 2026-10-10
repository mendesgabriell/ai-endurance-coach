import assert from "node:assert/strict";
import { test } from "node:test";
import { esforcoPorDia, serieFitness } from "../src/prumo/fitness";

test("um dia de esforço 100: fitness 2,4 e fadiga 13,3 no dia, decaindo depois", () => {
  const s = serieFitness({ "2026-01-01": 100 }, "2026-01-03");
  assert.deepEqual(s.map((x) => x[0]), ["2026-01-01", "2026-01-02", "2026-01-03"]);
  assert.equal(s[0]?.[1], 2.4);
  assert.equal(s[0]?.[2], 13.3);
  assert.equal(s[1]?.[1], 2.3);
  assert.equal(s[1]?.[2], 11.5);
});

test("carga constante de 100 por 42 dias chega a 63,2 de fitness (1 − 1/e)", () => {
  const re: Record<string, number> = {};
  for (let i = 0; i < 42; i++) re[`2026-02-${String(i + 1).padStart(2, "0")}`.replace(/-(\d\d)$/, (m, d) => (Number(d) > 28 ? `-${String(Number(d) - 28).padStart(2, "0")}` : m))] = 100;
  // 28 dias de fevereiro + 14 de março, montados sem depender do calendário
  const dias: Record<string, number> = {};
  for (let i = 0; i < 28; i++) dias[`2026-02-${String(i + 1).padStart(2, "0")}`] = 100;
  for (let i = 0; i < 14; i++) dias[`2026-03-${String(i + 1).padStart(2, "0")}`] = 100;
  const s = serieFitness(dias, "2026-03-14");
  assert.equal(s.length, 42);
  assert.equal(s[41]?.[1], 63.2);
  assert.equal(s[6]?.[2], 63.2);
});

test("esforço por dia soma as atividades do mesmo dia", () => {
  assert.deepEqual(esforcoPorDia([{ day: "2026-10-03", re: 112 }, { day: "2026-10-03", re: 4 }, { day: "2026-10-04", re: null }]), { "2026-10-03": 116, "2026-10-04": 0 });
});
