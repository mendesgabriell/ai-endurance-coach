/**
 * Fitness, fadiga e forma no modelo do Strava: médias exponenciais do esforço
 * relativo diário, com constantes de 42 e 7 dias. Determinístico e testado.
 */
const K42 = 1 - Math.exp(-1 / 42);
const K7 = 1 - Math.exp(-1 / 7);

function addDias(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** [dia, fitness, fadiga] por dia, do primeiro dia com esforço até `ate`. */
export function serieFitness(re: Record<string, number>, ate: string): [string, number, number][] {
  const dias = Object.keys(re).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  if (!dias.length) return [];
  const out: [string, number, number][] = [];
  let f = 0;
  let a = 0;
  for (let d = dias[0]!; d <= ate; d = addDias(d, 1)) {
    const v = re[d] ?? 0;
    f += (v - f) * K42;
    a += (v - a) * K7;
    out.push([d, Math.round(f * 10) / 10, Math.round(a * 10) / 10]);
  }
  return out;
}

/** Soma o esforço relativo por dia a partir das atividades. */
export function esforcoPorDia(acts: { day: string; re: number | null }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of acts) out[a.day] = (out[a.day] ?? 0) + (a.re ?? 0);
  return out;
}
