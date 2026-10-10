import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ABDOMINAL, BLOCOS, CORRIDA, FORCA, FORCA_DO_DIA, INICIO, SEMANAS } from "@/plan/ciclo-bau";
import { todayISO } from "@/plan/plan";
import { lerNutricao, lerSuplementacao } from "./nutricao";
import { esforcoPorDia, serieFitness } from "./fitness";
import { sincronizarStrava } from "@/integrations/strava/sync";
import { db } from "@/db/client";
import { integrations, stravaActivities, stravaGear } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Monta o pacote de dados que a página do Prumo lê. Uma função só, duas saídas:
 * a rota /api/prumo na Vercel e o artefato (embutido). O plano vem vivo do
 * modelo; fitness, HRV, FC e sono vêm do intervals.icu, que sincroniza do COROS;
 * o resto é instantâneo versionado em `estatico.json`.
 */

const limpa = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const serie = (s: string) => { const m = /^(\d+)/.exec(s); return m ? Number(m[1]) : 3; };

export function exportarPlano() {
  return {
    inicio: INICIO,
    blocos: BLOCOS.map((b) => ({ n: b.n, nm: b.nm, dt: b.dt, q: limpa(b.q || "") })),
    semanas: SEMANAS.map((s) => ({ n: s.n, dt: s.dt, b: s.b, km: s.km, tag: s.tag || "",
      d: s.dias.map((d) => [d.d, d.t, d.km, d.s || "", d.f ? 1 : 0, d.g === undefined ? null : d.g]) })),
    corrida: Object.fromEntries(Object.entries(CORRIDA).map(([k, c]) => [k, {
      n: c.n, t: c.t, loc: c.loc, obj: limpa(c.obj || ""), passos: (c.passos || []).map(limpa), reg: limpa(c.reg || ""), presc: c.presc }])),
    forca: Object.fromEntries(Object.entries(FORCA).map(([k, f]) => [k, {
      nome: f.nome, sub: f.sub, tip: f.tip, ex: f.ex.map((e) => [e.n, e.s, e.a || "", e.nt || ""]),
      series: f.ex.reduce((a, e) => a + serie(e.s), 0) }])),
    forcaDia: FORCA_DO_DIA,
    abd: ABDOMINAL,
  };
}

type Wellness = { d: string; ctl: number | null; atl: number | null; hrv: number | null; rhr: number | null; sono: number | null };
type Act = { d: string; t: string; n: string; km: number; min: number; load: number | null; hr: number | null; dplus: number };

const TIPO: Record<string, string> = { Run: "rua", TrailRun: "trilha", VirtualRun: "esteira", WeightTraining: "forca", Workout: "outro",
  Pilates: "outro", Yoga: "outro", Ride: "bike", VirtualRide: "bike", Walk: "caminhada", Hike: "caminhada", Elliptical: "outro" };

/** intervals.icu: 120 dias de wellness e atividades. Sem chave, devolve vazio e a página avisa. */
export async function lerIntervals(hoje: string): Promise<{ wellness: Wellness[]; acts: Act[]; ok: boolean }> {
  const key = process.env.INTERVALS_API_KEY, id = process.env.INTERVALS_ATHLETE_ID;
  if (!key || !id) return { wellness: [], acts: [], ok: false };
  const auth = "Basic " + Buffer.from(`API_KEY:${key}`).toString("base64");
  const base = `https://intervals.icu/api/v1/athlete/${id}`;
  const oldest = new Date(Date.parse(hoje) - 120 * 864e5).toISOString().slice(0, 10);
  const r1 = (x: unknown) => (x == null ? null : Math.round(Number(x) * 10) / 10);
  const [w, a] = await Promise.all([
    fetch(`${base}/wellness?oldest=${oldest}&newest=${hoje}`, { headers: { Authorization: auth }, next: { revalidate: 600 } }),
    fetch(`${base}/activities?oldest=${oldest}&newest=${hoje}`, { headers: { Authorization: auth }, next: { revalidate: 600 } }),
  ]);
  if (!w.ok || !a.ok) return { wellness: [], acts: [], ok: false };
  const wj = (await w.json()) as Array<Record<string, unknown>>;
  const aj = (await a.json()) as Array<Record<string, unknown>>;
  const wellness = wj.map((x) => ({ d: String(x.id), ctl: r1(x.ctl), atl: r1(x.atl),
    hrv: x.hrv == null ? null : Math.round(Number(x.hrv)), rhr: x.restingHR == null ? null : Math.round(Number(x.restingHR)),
    sono: x.sleepSecs == null ? null : Math.round(Number(x.sleepSecs) / 60) }));
  const acts = aj.filter((x) => x.type).map((x) => {
    const km = x.distance ? Math.round((Number(x.distance) / 1000) * 100) / 100 : 0;
    const min = Math.round(Number(x.moving_time || 0) / 60);
    let t = TIPO[String(x.type)] || "outro";
    if (String(x.type) === "Run" && x.trainer) t = "esteira";
    if (km > 0 && km < 4 && min / km >= 10) t = "caminhada"; // caminhada não é treino
    return { d: String(x.start_date_local || "").slice(0, 10), t, n: String(x.name || ""), km, min,
      load: x.icu_training_load == null ? null : Math.round(Number(x.icu_training_load)),
      hr: x.average_heartrate ? Math.round(Number(x.average_heartrate)) : null,
      dplus: x.total_elevation_gain ? Math.round(Number(x.total_elevation_gain)) : 0 };
  }).sort((p, q) => (p.d < q.d ? -1 : 1));
  return { wellness, acts, ok: true };
}

interface StravaBase {
  lido?: string; re: Record<string, number>; fitness: [string, number, number][];
  tenis: { id: string; km: number; [k: string]: unknown }[]; usoTenis: Record<string, string>; corridasStrava: Record<string, string>; [k: string]: unknown;
}

/**
 * Strava vivo: sincroniza se a última leitura tem mais de 10 minutos, soma o
 * esforço por dia por cima do histórico versionado e recalcula o fitness.
 * Qualquer falha devolve o retrato como está; a página nunca cai por causa do Strava.
 */
export async function lerStrava(base: StravaBase, hoje: string): Promise<StravaBase & { vivo: boolean }> {
  if (!db) return { ...base, vivo: false };
  try {
    await sincronizarStrava({ dias: 14 });
  } catch (e) {
    console.error("strava sync", e);
  }
  try {
    const [conta] = await db.select().from(integrations).where(eq(integrations.provider, "strava"));
    if (!conta?.syncedAt) return { ...base, vivo: false };
    const acts = await db.select().from(stravaActivities);
    const gear = await db.select().from(stravaGear);
    const re = { ...base.re };
    if (acts.length) {
      const porDia = esforcoPorDia(acts);
      const primeiro = Object.keys(porDia).sort()[0]!;
      for (let d = primeiro; d <= hoje; d = shiftDia(d, 1)) re[d] = porDia[d] ?? 0;
    }
    const usoTenis = { ...base.usoTenis };
    const corridasStrava = { ...base.corridasStrava };
    for (const a of acts.slice().sort((p, q) => (p.day < q.day ? -1 : 1))) {
      if (a.gearId) usoTenis[a.day] = a.gearId;
      if (/run/i.test(a.sport)) corridasStrava[a.day] = a.id;
    }
    const kmPorId = new Map(gear.map((g) => [g.id, g.km]));
    const tenis = base.tenis.map((t) => (kmPorId.has(t.id) && kmPorId.get(t.id) != null ? { ...t, km: kmPorId.get(t.id) as number } : t));
    return { ...base, re, fitness: serieFitness(re, hoje), usoTenis, corridasStrava, tenis, lido: conta.syncedAt.toISOString().slice(0, 10), vivo: true };
  } catch (e) {
    console.error("strava leitura", e);
    return { ...base, vivo: false };
  }
}

function shiftDia(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}

export async function montarDados(privado: boolean) {
  const hoje = todayISO();
  const estatico = JSON.parse(readFileSync(join(process.cwd(), "src/prumo/estatico.json"), "utf8"));
  const [intervals, strava] = await Promise.all([lerIntervals(hoje), lerStrava(estatico.strava, hoje)]);
  const { privadoDados, ...publico } = estatico;
  publico.strava = strava;
  const priv = privado ? { ...privadoDados, nutricao: await lerNutricao(14), suplementacao: await lerSuplementacao(30) } : null;
  return { hoje, geradoEm: new Date().toISOString(), ...publico, plano: exportarPlano(), intervals, privado: priv };
}
