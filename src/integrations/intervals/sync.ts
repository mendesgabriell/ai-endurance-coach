import { PLAN } from "@/plan/plan";
import { IntervalsClient, type IntervalsEvent, type StoredEvent } from "./client";
import { toEvent } from "./map";

export interface SyncResult {
  criados: number;
  atualizados: number;
  apagados: number;
  intactos: number;
}

/** Só o que define o treino. Campos que o intervals.icu inventa não entram. */
function fingerprint(e: IntervalsEvent | StoredEvent): string {
  return JSON.stringify([
    e.start_date_local,
    e.category,
    e.type ?? null,
    e.name,
    (e.description ?? "").trim(),
  ]);
}

/**
 * Deixa o calendário do intervals.icu igual ao plano, no intervalo dado.
 *
 * Escreve só a diferença: dia em que nada mudou custa um GET e nenhuma escrita.
 * É isso que permite rodar de dentro do cron diário sem estourar o tempo da função.
 *
 * Eventos sem `external_id` começando com `coach-` são de outra origem e nunca
 * são tocados.
 */
export async function syncRange(
  api: IntervalsClient,
  from: string,
  to: string,
): Promise<SyncResult> {
  const desejados = new Map<string, IntervalsEvent>();
  for (const s of PLAN) {
    if (s.date < from || s.date > to) continue;
    const e = toEvent(s);
    if (e?.external_id) desejados.set(e.external_id, e);
  }

  const existentes = (await api.listEvents(from, to)).filter((e) =>
    e.external_id?.startsWith("coach-"),
  );

  const res: SyncResult = { criados: 0, atualizados: 0, apagados: 0, intactos: 0 };
  const vistos = new Set<string>();

  for (const atual of existentes) {
    const alvo = desejados.get(atual.external_id!);
    if (!alvo) {
      await api.deleteEvent(atual.id);
      res.apagados++;
      continue;
    }
    vistos.add(atual.external_id!);
    if (fingerprint(atual) === fingerprint(alvo)) {
      res.intactos++;
      continue;
    }
    // o intervals.icu não faz PUT parcial confiável em evento de treino: troca
    await api.deleteEvent(atual.id);
    await api.createEvent(alvo);
    res.atualizados++;
  }

  for (const [id, alvo] of desejados) {
    if (vistos.has(id)) continue;
    await api.createEvent(alvo);
    res.criados++;
  }

  return res;
}

/** Cliente a partir do ambiente, ou null quando a ponte não está configurada. */
export function clientFromEnv(): IntervalsClient | null {
  const key = process.env.INTERVALS_API_KEY;
  const athlete = process.env.INTERVALS_ATHLETE_ID;
  return key && athlete ? new IntervalsClient(athlete, key) : null;
}

export function shift(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
