import type { SessionKind } from "@/plan/types";
import { parseLog } from "./parse";

/** O que o atleta quis dizer. Zero LLM: regra e palavra-chave. */
export type Intent =
  | { type: "log"; kinds: SessionKind[] }
  | { type: "ask"; day: string; scope: "dia" | "pendente" | "semana"; kinds: SessionKind[] };

const QUESTION_START =
  /^\s*(o\s*que|oq|qual|quais|quando|quanto|cad[êe]|me\s+lembra|lembra|como|onde|tem\s|tinha\s|era\s|foi\s)/i;

/**
 * Fronteira de palavra ciente de acento. O \b do JavaScript é ASCII: em
 * "amanhã" não existe fronteira depois do ã, então /\bamanhã\b/ nunca casa.
 */
function word(body: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${body})(?![\\p{L}\\p{N}])`, "iu");
}

const PENDING = word("pendentes?|falta|faltando|faltou|em\\s+aberto|resta|sobrou");
const WEEK = word("semana|pr[óo]ximos\\s+dias|resto\\s+da\\s+semana");

const WEEKDAYS: Array<[RegExp, number]> = [
  [word("domingo"), 0], [word("segunda|segunda-feira"), 1], [word("ter[çc]a|ter[çc]a-feira"), 2],
  [word("quarta|quarta-feira"), 3], [word("quinta|quinta-feira"), 4],
  [word("sexta|sexta-feira"), 5], [word("s[áa]bado"), 6],
];

const ANTEONTEM = word("anteontem");
const ONTEM = word("ontem");
const DEPOIS_AMANHA = word("depois\\s+de\\s+amanh[ãa]");
const AMANHA = word("amanh[ãa]");
const HOJE_RE = word("hoje");
const PROXIMA = word("pr[óo]xim[ao]|que\\s+vem");

export function isQuestion(text: string): boolean {
  return text.trim().endsWith("?") || QUESTION_START.test(text);
}

/** A que dia a frase se refere. Sem referência, o dia corrente. */
export function resolveDay(text: string, today: string): string {
  if (ANTEONTEM.test(text)) return shift(today, -2);
  if (ONTEM.test(text)) return shift(today, -1);
  if (DEPOIS_AMANHA.test(text)) return shift(today, 2);
  if (AMANHA.test(text)) return shift(today, 1);
  if (HOJE_RE.test(text)) return today;

  for (const [re, dow] of WEEKDAYS) {
    if (!re.test(text)) continue;
    // dia da semana sem "próxima" volta para a ocorrência mais recente
    const future = PROXIMA.test(text);
    const cur = new Date(`${today}T00:00:00Z`).getUTCDay();
    const delta = future ? (dow - cur + 7) % 7 || 7 : -((cur - dow + 7) % 7);
    return shift(today, delta);
  }
  return today;
}

export function classify(text: string, today: string): Intent {
  const kinds = parseLog(text).kinds;
  if (!isQuestion(text)) return { type: "log", kinds };

  const day = resolveDay(text, today);
  const scope = WEEK.test(text) ? "semana" : PENDING.test(text) ? "pendente" : "dia";
  return { type: "ask", day, scope, kinds };
}

export function shift(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/** "ontem, sábado 05/09" — para a resposta dizer de que dia está falando. */
export function dayLabel(day: string, today: string): string {
  const diff = Math.round(
    (Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
  );
  const rel =
    diff === 0 ? "hoje" : diff === -1 ? "ontem" : diff === -2 ? "anteontem"
      : diff === 1 ? "amanhã" : diff === 2 ? "depois de amanhã" : null;
  const name = NAMES[new Date(`${day}T00:00:00Z`).getUTCDay()]!;
  const dm = `${day.slice(8)}/${day.slice(5, 7)}`;
  return rel ? `${rel}, ${name} ${dm}` : `${name} ${dm}`;
}
