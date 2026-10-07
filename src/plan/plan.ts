import { BLOCOS, INICIO, SEMANAS } from "./ciclo-bau";
import { expandirCiclo } from "./expand";
import { HISTORICO_PARATY } from "./historico-paraty";
import type { Block, PlannedSession } from "./types";

/**
 * FONTE ÚNICA DO PLANO.
 *
 * O ciclo vive como modelo em `ciclo-bau.ts` (25 semanas × dia da semana) e
 * `expand.ts` o transforma em sessões datadas. Para mudar o plano, mude o
 * modelo — nunca a lista expandida, que é derivada.
 *
 * Em 06/10/2026 este arquivo estava parado no ciclo de Paraty, com zero
 * sessões depois de 19/09. O bot mandou "Descanso. Nada programado hoje"
 * por dezessete dias seguidos, nomeando uma prova que já tinha acontecido.
 */

export const RACE_DATE = "2027-03-20";
export const RACE_NAME = "INDOMIT Pedra do Baú 50K";
export const ATHLETE_TZ = "America/Sao_Paulo";

/** Meta de tempo: sub-9h é a meta, sub-8h é a meta-sonho. */
export const RACE_META = { meta: 9 * 3600, sonho: 8 * 3600 } as const;

const DIAMS = 86_400_000;
function somaDias(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** A data de início de cada bloco sai da primeira semana que pertence a ele. */
export const BLOCKS: Block[] = BLOCOS.map((b) => {
  const i = SEMANAS.findIndex((s) => s.b === b.n);
  return {
    start: somaDias(INICIO, Math.max(0, i) * 7),
    title: `${b.n} · ${b.nm}`,
    detail: b.dt,
  };
});

const PROVA: PlannedSession = {
  id: "prova-bau",
  date: RACE_DATE,
  kind: "chave",
  text: "INDOMIT PEDRA DO BAÚ 50K — largada 05h",
  why: "Meta 9h. Meta-sonho 8h. São Bento do Sapucaí.",
};

export const PLAN: PlannedSession[] = [...HISTORICO_PARATY, ...expandirCiclo(), PROVA];

/** Data de hoje no fuso do atleta, como YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ATHLETE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function sessionsOn(date: string): PlannedSession[] {
  return PLAN.filter((s) => s.date === date);
}

/** Dias inteiros de `from` até a prova. Negativo depois dela. */
export function daysToRace(from: string): number {
  return Math.round((Date.parse(`${RACE_DATE}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DIAMS);
}

export function blockFor(date: string): Block | undefined {
  return [...BLOCKS].reverse().find((b) => b.start <= date);
}

/** A semana do ciclo em que a data cai, 1 a 25. Zero antes do início. */
export function semanaDoCiclo(date: string): number {
  const d = Math.floor((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${INICIO}T00:00:00Z`)) / DIAMS);
  return d < 0 ? 0 : Math.min(SEMANAS.length, Math.floor(d / 7) + 1);
}
