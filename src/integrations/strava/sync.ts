/**
 * Sincroniza o Strava para o banco: atividades dos últimos dias e km dos tênis.
 *
 * Quem chama: /api/prumo (quando a última sincronia tem mais de 10 minutos),
 * /api/sync (agendador do GitHub) e /api/strava/sync. Idempotente: roda duas
 * vezes, grava o mesmo.
 */
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { integrations, stravaActivities, stravaGear } from "@/db/schema";
import { lerGear, listarAtividades, tokenValido } from "./client";

export interface ResultadoStrava { ok: boolean; motivo?: string; pulado?: boolean; atividades?: number; tenis?: number }

const DEZ_MIN = 10 * 60_000;

export async function sincronizarStrava(opts: { dias?: number; forcar?: boolean } = {}): Promise<ResultadoStrava> {
  if (!db) return { ok: false, motivo: "sem banco" };
  const [row] = await db.select().from(integrations).where(eq(integrations.provider, "strava"));
  if (!row?.refreshToken) return { ok: false, motivo: "Strava não ligado" };
  if (!opts.forcar && row.syncedAt && Date.now() - row.syncedAt.getTime() < DEZ_MIN) return { ok: true, pulado: true };

  const token = await tokenValido();
  if (!token) return { ok: false, motivo: "sem token" };
  const dias = opts.dias ?? 14;
  const after = Math.floor(Date.now() / 1000) - dias * 86_400;
  const acts = await listarAtividades(token, after);

  for (const a of acts) {
    const v = {
      id: String(a.id),
      day: String(a.start_date_local).slice(0, 10),
      sport: a.sport_type,
      name: a.name ?? null,
      re: a.suffer_score == null ? null : Math.round(Number(a.suffer_score)),
      km: a.distance ? Math.round(a.distance / 10) / 100 : 0,
      dplus: Math.round(a.total_elevation_gain || 0),
      minutes: Math.round((a.moving_time || 0) / 60),
      gearId: a.gear_id ?? null,
      trainer: !!a.trainer,
      updatedAt: new Date(),
    };
    await db.insert(stravaActivities).values(v).onConflictDoUpdate({ target: stravaActivities.id, set: v });
  }

  // tênis usados no período: km atual de cada um
  const ids = [...new Set(acts.map((a) => a.gear_id).filter((g): g is string => !!g))];
  let tenis = 0;
  if (ids.length) {
    const atuais = await db.select().from(stravaGear).where(inArray(stravaGear.id, ids));
    const recente = new Set(atuais.filter((g) => Date.now() - g.updatedAt.getTime() < 6 * 3_600_000).map((g) => g.id));
    for (const id of ids) {
      if (recente.has(id)) continue;
      try {
        const g = await lerGear(token, id);
        const v = { id: g.id, name: g.name, km: Math.round(g.distance / 100) / 10, updatedAt: new Date() };
        await db.insert(stravaGear).values(v).onConflictDoUpdate({ target: stravaGear.id, set: v });
        tenis++;
      } catch (e) {
        console.error("strava gear", id, e);
      }
    }
  }

  await db.update(integrations).set({ syncedAt: new Date() }).where(eq(integrations.provider, "strava"));
  return { ok: true, atividades: acts.length, tenis };
}
