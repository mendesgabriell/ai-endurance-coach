import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ABDOMINAL, BLOCOS, CORRIDA, FORCA, FORCA_DO_DIA, INICIO, SEMANAS } from "@/plan/ciclo-bau";
import { todayISO } from "@/plan/plan";
import { lerNutricao, lerSuplementacao } from "./nutricao";

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

export async function montarDados(privado: boolean) {
  const hoje = todayISO();
  const estatico = JSON.parse(readFileSync(join(process.cwd(), "src/prumo/estatico.json"), "utf8"));
  const intervals = await lerIntervals(hoje);
  const { privadoDados, ...publico } = estatico;
  const priv = privado ? { ...privadoDados, nutricao: await lerNutricao(14), suplementacao: await lerSuplementacao(30) } : null;
  return { hoje, geradoEm: new Date().toISOString(), ...publico, plano: exportarPlano(), intervals, privado: priv };
}
