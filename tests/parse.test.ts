import assert from "node:assert/strict";
import test from "node:test";
import { describeLog, parseLog } from "../src/coach/parse";

test("distância em k e km", () => {
  assert.equal(parseLog("corri 8k hoje").km, 8);
  assert.equal(parseLog("Treino de 19,4 km").km, 19.4);
  assert.equal(parseLog("fiz 8.5km").km, 8.5);
  assert.equal(parseLog("subi 1.128 m de desnível").gain, 1128);
  assert.equal(parseLog("comi 2.550 kcal").km, undefined);
});

test("duração em varios formatos", () => {
  assert.equal(parseLog("48min").minutes, 48);
  assert.equal(parseLog("rodei 40'").minutes, 40);
  assert.equal(parseLog("longão de 2h30").minutes, 150);
  assert.equal(parseLog("1h de esteira").minutes, 60);
});

test("desnivel", () => {
  assert.equal(parseLog("19k 1100 de ganho").gain, 1100);
  assert.equal(parseLog("689 m D+").gain, 689);
  assert.equal(parseLog("1.128 m de desnível").gain, 1128);
});

test("reconhece o tipo de sessao", () => {
  assert.deepEqual(parseLog("fiz perna hoje, agachamento pesado").kinds, ["perna"]);
  assert.ok(parseLog("corri na esteira").kinds.includes("corrida"));
  assert.ok(parseLog("sauna 20 min").kinds.includes("nutricao"));
});

test("nao confunde series de musculacao com distancia", () => {
  assert.equal(parseLog("agachamento 4 × 8 pesado").km, undefined);
});

test("frase real do atleta", () => {
  const p = parseLog("Treino de 19k 1100 de ganho - 2:55h");
  assert.equal(p.km, 19);
  assert.equal(p.gain, 1100);
  assert.equal(p.minutes, 175);
  assert.equal(describeLog(p), "19 km · 2h55 · 1100 m D+");
});

test("nao confunde pace com duracao", () => {
  const p = parseLog("corri 8 km a 5:59/km");
  assert.equal(p.km, 8);
  assert.equal(p.minutes, undefined);
});

test("mensagem sem numero", () => {
  const p = parseLog("perna pesada hoje, tudo bem");
  assert.equal(describeLog(p), "");
  assert.deepEqual(p.kinds, ["perna"]);
});
