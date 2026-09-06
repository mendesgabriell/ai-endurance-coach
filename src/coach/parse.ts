import type { SessionKind } from "@/plan/types";

/** O que deu para entender de uma mensagem solta do atleta. Zero LLM. */
export interface ParsedLog {
  km?: number;
  minutes?: number;
  gain?: number;
  kinds: SessionKind[];
}

/**
 * Número em português. Vírgula é decimal (19,4). Ponto é ambíguo: com três
 * dígitos depois é separador de milhar (1.128 = 1128), senão é decimal (8.5).
 */
const num = (s: string): number => {
  if (s.includes(",")) return Number(s.replace(/\./g, "").replace(",", "."));
  return Number(/\.\d{3}(?!\d)/.test(s) ? s.replace(/\./g, "") : s);
};

const KEYWORDS: Array<[SessionKind, RegExp]> = [
  ["corrida", /\b(corri|corrida|rodagem|rodei|esteira|trote|longão|longao|tiro|tiros|regenerativ)/i],
  ["perna", /\b(perna|agachamento|leg press|panturrilha|extensora|flexora|afundo|step[- ]?down|isometria)/i],
  ["superiores", /\b(superiores|costas|peito|ombro|bíceps|biceps|tríceps|triceps|puxada|remada|supino|barra fixa|rosca)/i],
  ["nutricao", /\b(sauna|banheira|calor|dieta|comi|refeição|refeicao|carbo|caloria)/i],
  ["recovery", /\b(gelo|bota|compressão|compressao|massagem|ventosa|pernas para cima|alongamento)/i],
  ["chave", /\b(trilha|votu|prova|macela|circuito)/i],
];

export function parseLog(text: string): ParsedLog {
  const out: ParsedLog = { kinds: [] };

  // distância: 8k · 8 km · 19,4km · 8.5 km
  const km = text.match(/(\d+(?:[.,]\d+)?)\s*(?:km|k)\b/i);
  if (km?.[1]) out.km = num(km[1]);

  // duração, na ordem: 2:55h · 1h10 · 2h · 48min · 48'
  // o formato h:mm exige o "h" no fim, senão 5:59/km viraria 359 minutos
  const colon = text.match(/(\d{1,2}):(\d{2})\s*h/i);
  const hm = text.match(/(?<![:\d])(\d{1,2})\s*h\s*(\d{1,2})?(?!\d)/i);
  const mm = text.match(/(\d+)\s*(?:min|minutos|'|’)(?!\w)/i);
  if (colon?.[1] && colon[2]) out.minutes = Number(colon[1]) * 60 + Number(colon[2]);
  else if (hm?.[1]) out.minutes = Number(hm[1]) * 60 + Number(hm[2] ?? 0);
  else if (mm?.[1]) out.minutes = Number(mm[1]);

  // desnível: 690m de ganho · 1100 de ganho · 1.128 m D+ · 700 de desnível
  const gain = text.match(
    /(\d+(?:[.,]\d+)?)\s*m?\s*(?:de\s+)?(?:ganho|d\+|desn[ií]vel|positivo)/i,
  );
  if (gain?.[1]) out.gain = num(gain[1]);

  for (const [kind, re] of KEYWORDS) if (re.test(text)) out.kinds.push(kind);

  return out;
}

/** "8 km · 48 min · 690 m D+" — vazio quando não deu para entender nada. */
export function describeLog(p: ParsedLog): string {
  const bits: string[] = [];
  if (p.km !== undefined) bits.push(`${fmt(p.km)} km`);
  if (p.minutes !== undefined) bits.push(formatMinutes(p.minutes));
  if (p.gain !== undefined) bits.push(`${fmt(p.gain)} m D+`);
  return bits.join(" · ");
}

export function hasNumbers(p: ParsedLog): boolean {
  return p.km !== undefined || p.minutes !== undefined || p.gain !== undefined;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
}

function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h${String(rest).padStart(2, "0")}` : `${h}h`;
}
