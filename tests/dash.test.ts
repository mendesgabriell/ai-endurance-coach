import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { SEMANAS } from "../src/plan/ciclo-bau";

/**
 * O dash guarda a mesma tabela de semanas que `ciclo-bau.ts`, em JavaScript
 * dentro do HTML. Isso é duplicação — a mesma que mandou o treino errado para
 * o atleta em 05/09/2026 e que deixou o bot mudo por dezessete dias em
 * setembro, quando as duas cópias andaram para lados diferentes.
 *
 * Enquanto não existir um gerador (`scripts/build-dash.ts`, nos moldes do
 * `build-calendar.ts`), este teste é o que impede a divergência de passar
 * calada: mexeu em um lado e não no outro, a suíte quebra.
 */
const html = readFileSync(new URL("../public/dash.html", import.meta.url), "utf8");

function semanasDoDash(): unknown[] {
  const m = /var D=(\[.*?\]);\n/s.exec(html);
  assert.ok(m, "não achei o array D em public/dash.html");
  return JSON.parse(m![1]!) as unknown[];
}

test("o dash e o ciclo contam as mesmas 25 semanas", () => {
  assert.equal(semanasDoDash().length, SEMANAS.length);
});

test("semana a semana, o dash e o ciclo dizem a mesma coisa", () => {
  const dash = semanasDoDash() as Array<Record<string, unknown>>;
  dash.forEach((d, i) => {
    const s = SEMANAS[i]!;
    const onde = `semana ${i + 1} (${String(d.dt)})`;
    assert.equal(d.n, s.n, `${onde}: nome`);
    assert.equal(d.dt, s.dt, `${onde}: datas`);
    assert.equal(d.b, s.b, `${onde}: bloco`);
    assert.equal(d.km, s.km, `${onde}: volume`);
    const dias = d.dias as Array<Record<string, unknown>>;
    assert.equal(dias.length, s.dias.length, `${onde}: número de dias`);
    dias.forEach((x, j) => {
      const y = s.dias[j]!;
      assert.equal(x.d, y.d, `${onde}, dia ${j + 1}: nome`);
      assert.equal(x.t, y.t, `${onde}, dia ${j + 1}: terreno`);
      assert.equal(x.km, y.km, `${onde}, dia ${j + 1}: km`);
    });
  });
});
