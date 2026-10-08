import { desc, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { fuelLog, nutritionDays } from "@/db/schema";

/** Um dia de alimentação como a página consome. Água em mL, peso em kg. */
export interface DiaNutricao {
  d: string;
  kcal: number | null;
  carb: number | null;
  prot: number | null;
  gord: number | null;
  agua: number | null;
  peso: number | null;
}

type Campo = Exclude<keyof DiaNutricao, "d">;

/** Nome da métrica no Health Auto Export → campo nosso. */
const METRICAS: Record<string, Campo> = {
  dietary_energy: "kcal",
  carbohydrates: "carb",
  protein: "prot",
  total_fat: "gord",
  dietary_water: "agua",
  weight_body_mass: "peso",
};

/** Peso e água são "o último valor do dia"; o resto soma. */
const ACUMULA: Record<Campo, "soma" | "ultimo"> = {
  kcal: "soma", carb: "soma", prot: "soma", gord: "soma", agua: "soma", peso: "ultimo",
};

interface HaeMetric { name?: string; units?: string; data?: { date?: string; qty?: number }[] }

function converter(campo: Campo, qty: number, units: string): number {
  const u = units.toLowerCase();
  if (campo === "kcal" && (u === "kj" || u === "kilojoule")) return qty / 4.184;
  if (campo === "agua") {
    if (u === "l" || u === "liter" || u === "litre") return qty * 1000;
    if (u.startsWith("fl_oz") || u === "floz") return qty * 29.5735;
    if (u === "cup") return qty * 236.588;
    return qty; // mL
  }
  if (campo === "peso" && (u === "lb" || u === "lbs")) return qty * 0.45359237;
  return qty;
}

function vazio(d: string): DiaNutricao {
  return { d, kcal: null, carb: null, prot: null, gord: null, agua: null, peso: null };
}

/**
 * Lê o corpo do POST em dois formatos:
 * - Health Auto Export: { data: { metrics: [{ name, units, data: [{ date, qty }] }] } }
 * - plano: { date, kcal, carbs, protein, fat, water_ml, weight_kg } ou uma lista desses.
 * Devolve um dia por data, em ordem crescente. Datas inválidas e métricas
 * desconhecidas são ignoradas.
 */
export function interpretarNutricao(body: unknown): DiaNutricao[] {
  const dias = new Map<string, DiaNutricao>();
  const pega = (d: string) => {
    let x = dias.get(d);
    if (!x) { x = vazio(d); dias.set(d, x); }
    return x;
  };
  const diaDe = (s: unknown): string | null => {
    const d = String(s ?? "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
  };
  const obj = (body ?? {}) as Record<string, unknown>;
  const metrics = (obj.data as { metrics?: HaeMetric[] } | undefined)?.metrics;

  if (Array.isArray(metrics)) {
    for (const m of metrics) {
      const campo = METRICAS[String(m.name ?? "").toLowerCase()];
      if (!campo || !Array.isArray(m.data)) continue;
      for (const p of m.data) {
        const d = diaDe(p.date);
        const q = Number(p.qty);
        if (!d || !Number.isFinite(q)) continue;
        const v = converter(campo, q, String(m.units ?? ""));
        const dia = pega(d);
        dia[campo] = ACUMULA[campo] === "soma" ? (dia[campo] ?? 0) + v : v;
      }
    }
  } else {
    const lista = Array.isArray(body) ? body : [body];
    for (const item of lista) {
      const o = (item ?? {}) as Record<string, unknown>;
      const d = diaDe(o.date ?? o.day ?? o.d);
      if (!d) continue;
      const dia = pega(d);
      const num = (k: string) => (o[k] == null || o[k] === "" ? null : Number(o[k]));
      const map: [Campo, string[]][] = [
        ["kcal", ["kcal", "calories"]], ["carb", ["carbs", "carbs_g", "carb"]], ["prot", ["protein", "protein_g", "prot"]],
        ["gord", ["fat", "fat_g", "gord"]], ["agua", ["water_ml", "agua"]], ["peso", ["weight_kg", "peso"]],
      ];
      for (const [campo, chaves] of map) {
        for (const k of chaves) { const v = num(k); if (v != null && Number.isFinite(v)) { dia[campo] = v; break; } }
      }
    }
  }
  const out = [...dias.values()].filter((x) => Object.keys(ACUMULA).some((k) => x[k as Campo] != null));
  for (const x of out) for (const k of ["kcal", "carb", "prot", "gord", "agua"] as Campo[]) if (x[k] != null) x[k] = Math.round(x[k] as number);
  for (const x of out) if (x.peso != null) x.peso = Math.round(x.peso * 10) / 10;
  return out.sort((a, b) => (a.d < b.d ? -1 : 1));
}

/** Upsert por dia. Campo nulo no envio não apaga o que já estava gravado. */
export async function gravarNutricao(dias: DiaNutricao[]): Promise<number> {
  if (!db || !dias.length) return 0;
  const t = nutritionDays;
  await db
    .insert(t)
    .values(dias.map((x) => ({ day: x.d, kcal: x.kcal, carbsG: x.carb, proteinG: x.prot, fatG: x.gord, waterMl: x.agua, weightKg: x.peso })))
    .onConflictDoUpdate({
      target: t.day,
      set: {
        kcal: sql`coalesce(excluded.kcal, ${t.kcal})`,
        carbsG: sql`coalesce(excluded.carbs_g, ${t.carbsG})`,
        proteinG: sql`coalesce(excluded.protein_g, ${t.proteinG})`,
        fatG: sql`coalesce(excluded.fat_g, ${t.fatG})`,
        waterMl: sql`coalesce(excluded.water_ml, ${t.waterMl})`,
        weightKg: sql`coalesce(excluded.weight_kg, ${t.weightKg})`,
        updatedAt: new Date(),
      },
    });
  return dias.length;
}

/** Os últimos N dias gravados, do mais antigo para o mais novo. */
export async function lerNutricao(dias = 14): Promise<DiaNutricao[]> {
  if (!db) return [];
  const rows = await db.select().from(nutritionDays).orderBy(desc(nutritionDays.day)).limit(dias);
  return rows
    .map((r) => ({ d: r.day, kcal: r.kcal, carb: r.carbsG, prot: r.proteinG, gord: r.fatG, agua: r.waterMl, peso: r.weightKg }))
    .sort((a, b) => (a.d < b.d ? -1 : 1));
}

/* ---------- suplementação por treino ---------- */

export interface Suplementacao { d: string; sessao: string | null; itens: { p: string; q: number }[]; nota: string | null }

/** { day|d, sessao?, itens:[{p:"dobro-carbs-maracuja", q:2}], nota? } → registro válido ou null. */
export function interpretarSuplementacao(body: unknown): Suplementacao | null {
  const o = (body ?? {}) as Record<string, unknown>;
  const d = String(o.day ?? o.d ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !Array.isArray(o.itens)) return null;
  const itens = (o.itens as unknown[])
    .map((i) => {
      const x = (i ?? {}) as Record<string, unknown>;
      const p = String(x.p ?? x.produto ?? "").trim();
      const q = Number(x.q ?? x.qtd ?? 1);
      return p && Number.isFinite(q) && q > 0 ? { p, q } : null;
    })
    .filter((x): x is { p: string; q: number } => !!x);
  if (!itens.length) return null;
  return { d, sessao: o.sessao ? String(o.sessao).slice(0, 80) : null, itens, nota: o.nota ? String(o.nota).slice(0, 300) : null };
}

export async function gravarSuplementacao(e: Suplementacao): Promise<boolean> {
  if (!db) return false;
  await db.insert(fuelLog).values({ day: e.d, session: e.sessao, items: e.itens, note: e.nota });
  return true;
}

/** Os últimos N registros, do mais antigo para o mais novo. */
export async function lerSuplementacao(n = 30): Promise<Suplementacao[]> {
  if (!db) return [];
  const rows = await db.select().from(fuelLog).orderBy(desc(fuelLog.createdAt)).limit(n);
  return rows.map((r) => ({ d: r.day, sessao: r.session, itens: r.items, nota: r.note })).reverse();
}
