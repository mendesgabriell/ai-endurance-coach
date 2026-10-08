import assert from "node:assert/strict";
import { test } from "node:test";
import { interpretarNutricao } from "../src/prumo/nutricao";

test("Health Auto Export: soma as amostras do dia e converte unidades", () => {
  const dias = interpretarNutricao({
    data: {
      metrics: [
        { name: "dietary_energy", units: "kcal", data: [{ date: "2026-10-07 08:00:00 -0300", qty: 600 }, { date: "2026-10-07 13:00:00 -0300", qty: 900.4 }] },
        { name: "carbohydrates", units: "g", data: [{ date: "2026-10-07 08:00:00 -0300", qty: 120 }] },
        { name: "dietary_water", units: "L", data: [{ date: "2026-10-07 10:00:00 -0300", qty: 1.5 }, { date: "2026-10-07 16:00:00 -0300", qty: 0.8 }] },
        { name: "weight_body_mass", units: "lb", data: [{ date: "2026-10-06 07:00:00 -0300", qty: 167.6 }] },
        { name: "step_count", units: "count", data: [{ date: "2026-10-07 00:00:00 -0300", qty: 9000 }] },
      ],
    },
  });
  assert.deepEqual(dias.map((d) => d.d), ["2026-10-06", "2026-10-07"]);
  assert.equal(dias[1]?.kcal, 1500);
  assert.equal(dias[1]?.carb, 120);
  assert.equal(dias[1]?.agua, 2300);
  assert.equal(dias[1]?.peso, null);
  assert.equal(dias[0]?.peso, 76);
});

test("formato plano: um dia ou uma lista", () => {
  const um = interpretarNutricao({ date: "2026-10-07", kcal: 2210, carbs: 280, protein: 150, fat: 60, water_ml: 2500 });
  assert.equal(um.length, 1);
  assert.equal(um[0]?.prot, 150);
  const lista = interpretarNutricao([{ date: "2026-10-05", kcal: 2000 }, { date: "2026-10-06", weight_kg: 75.95 }]);
  assert.equal(lista.length, 2);
  assert.equal(lista[1]?.peso, 76);
});

test("ignora lixo", () => {
  assert.deepEqual(interpretarNutricao(null), []);
  assert.deepEqual(interpretarNutricao({ date: "ontem", kcal: 1 }), []);
  assert.deepEqual(interpretarNutricao({ data: { metrics: [{ name: "heart_rate", data: [{ date: "2026-10-07", qty: 50 }] }] } }), []);
});
