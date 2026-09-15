import type { PlannedSession, SessionKind } from "@/plan/types";
import type { IntervalsEvent } from "./client";

/**
 * Traduz uma sessão do plano para um evento do intervals.icu.
 *
 * O que vai para o relógio e o que não vai:
 *   corrida            → Run          (com passos estruturados quando há blocos)
 *   perna, superiores  → WeightTraining
 *   chave com trilha   → Run
 *   chave sem trilha   → NOTE  (REGRA — decisão de treino, aparece no calendário)
 *   nutricao, recovery → NADA. Não sobem. Regra do atleta, 07/09/2026.
 *                        Calor, gelo, massagem e dieta vivem no Telegram e no
 *                        calendário; relógio é para treino.
 *
 * Nada aqui decide treino: é tradução pura de `src/plan/plan.ts`.
 */
const TYPE: Partial<Record<SessionKind, string>> = {
  corrida: "Run",
  perna: "WeightTraining",
  superiores: "WeightTraining",
};

/**
 * Sessão-chave que é lembrete, não treino. Testado ANTES do padrão de treino:
 * "REGRA: prova te esvaziou ontem?" contém "prova" e viraria treino no relógio.
 */
const CHAVE_E_LEMBRETE = /^\s*(REGRA\b|Ensaio\b|Retirada\b|Dorme\b|DEPOIS\b)/i;
/** Sessão-chave que é treino de verdade. */
const CHAVE_E_TREINO = /\b\d+\s*(km|k)\b|D\+|circuito|prova|long[ãa]o|esteira|UTMB|WTR/i;

/** `4 × 7'` ou `8 × 20"` — abre um bloco de repetição (formato antigo). */
const REPEAT = /^(\d+)\s*[×x]\s*(\d+)\s*(['"″’])\s*(.*)$/u;
/** `15' aquecimento` — passo único (formato antigo). */
const STEP = /^(\d+)\s*(['"″’])\s*(.*)$/u;
/** `recuperação 3' a 3%` — pertence ao bloco de repetição anterior. */
const RECOVERY = /^recupera[çc][ãa]o\s+(\d+)\s*(['"″’])\s*(.*)$/iu;

/**
 * `1 · AQUECE — 10' de trote` — o formato numerado, que é o que o atleta lê no
 * relógio sem precisar interpretar nada. A duração pode estar em qualquer
 * posição da linha; o número da frente é só ordem.
 */
const NUMERADO = /^(\d+)\s*·\s*(.*)$/u;
/** Primeira duração ou distância da linha: `10'`, `20"`, `5 km`. */
const DURACAO = /(\d+)\s*(['"″’])|(\d+(?:[.,]\d+)?)\s*km\b/u;

const isSeconds = (mark: string) => mark === '"' || mark === "″";
const dur = (n: number, mark: string) => (isSeconds(mark) ? `${n}s` : `${n}m`);
const secs = (n: number, mark: string) => (isSeconds(mark) ? n : n * 60);

interface Built {
  description: string;
  movingTime: number;
}

/**
 * Monta a sintaxe de treino do intervals.icu a partir dos blocos do plano.
 *
 * Dois formatos convivem. O NUMERADO (`1 · AQUECE — 10' de trote`) vira um
 * passo linear por linha, que é o que o relógio cronometra e apita — o atleta
 * só reproduz. O ANTIGO (`4 × 7' a 15%` seguido de `recuperação 3'`) vira um
 * bloco de repetição; ele sobrevive por causa das sessões já passadas.
 *
 * Linha sem duração vira comentário, nunca passo: "3 · A REGRA: passou de 142,
 * anda" não é um bloco de 142 minutos.
 */
export function buildWorkout(blocks: string[]): Built {
  const out: string[] = [];
  let total = 0;
  let pending: { reps: number; line: string; each: number } | null = null;

  const flush = (recovery?: { line: string; each: number }) => {
    if (!pending) return;
    out.push(`${pending.reps}x`, pending.line);
    let each = pending.each;
    if (recovery) {
      out.push(recovery.line);
      each += recovery.each;
    }
    total += pending.reps * each;
    out.push("");
    pending = null;
  };

  for (const raw of blocks) {
    const line = raw.trim();

    const num = NUMERADO.exec(line);
    if (num) {
      flush();
      const corpo = num[2]!.trim();
      const d = DURACAO.exec(corpo);
      if (!d) {
        out.push(`# ${corpo}`);
        continue;
      }
      // "8 a 10' de trote" -> "trote": tira o começo do intervalo e o "de" órfão
      const antes = corpo.slice(0, d.index).replace(/\d+\s*a\s*$/u, "");
      const depois = corpo.slice(d.index + d[0].length).replace(/^\s*(?:de|a)\s+/u, " ");
      const rotulo = (antes + depois)
        .replace(/\s*[—–-]\s*([.,;:])/gu, "$1")
        .replace(/\s*[—–-]\s*$/u, "")
        .replace(/\s{2,}/g, " ")
        .replace(/\s+([.,])/g, "$1")
        .trim();
      if (d[3]) {
        out.push(`- ${d[3]!.replace(",", ".")}km ${rotulo}`.trimEnd());
      } else {
        const n = Number(d[1]);
        out.push(`- ${dur(n, d[2]!)} ${rotulo}`.trimEnd());
        total += secs(n, d[2]!);
      }
      continue;
    }

    const rec = RECOVERY.exec(line);
    if (rec && pending) {
      flush({ line: `- ${dur(+rec[1]!, rec[2]!)} recuperação ${rec[3]!}`.trimEnd(), each: secs(+rec[1]!, rec[2]!) });
      continue;
    }

    const rep = REPEAT.exec(line);
    if (rep) {
      flush();
      pending = {
        reps: +rep[1]!,
        line: `- ${dur(+rep[2]!, rep[3]!)} ${rep[4]!}`.trimEnd(),
        each: secs(+rep[2]!, rep[3]!),
      };
      continue;
    }

    flush();
    const st = STEP.exec(line);
    if (st) {
      out.push(`- ${dur(+st[1]!, st[2]!)} ${st[3]!}`.trimEnd());
      total += secs(+st[1]!, st[2]!);
    } else {
      out.push(`# ${line}`);
    }
  }
  flush();

  return { description: out.join("\n").replace(/\n{3,}/g, "\n\n").trim(), movingTime: total };
}

/**
 * Tem duração ou distância no texto? Sem isso a "corrida" não é treino, é
 * instrução: "Subida: teto de 142 bpm", "Descida: solta", "Off completo".
 * Essas viram NOTE — três Runs no dia da prova é ruído no relógio.
 */
const TEM_DURACAO = /\d+\s*(?:[-–]\s*\d+\s*)?['’′"″]|\d+\s*h\b|\bkm\b|\d+\s*min\b/i;

/** Nunca sobem: o relógio é para treino. */
const NUNCA_SOBE: ReadonlySet<SessionKind> = new Set(["nutricao", "recovery"]);

export function toEvent(s: PlannedSession): IntervalsEvent | null {
  if (NUNCA_SOBE.has(s.kind)) return null;

  const chaveTreina =
    s.kind === "chave" && !CHAVE_E_LEMBRETE.test(s.text) && CHAVE_E_TREINO.test(s.text);
  const corridaTreina =
    s.kind !== "corrida" || Boolean(s.exercises?.length) || TEM_DURACAO.test(s.text);
  const type = corridaTreina ? (TYPE[s.kind] ?? (chaveTreina ? "Run" : undefined)) : undefined;
  const base = {
    start_date_local: `${s.date}T00:00:00`,
    name: s.text,
    external_id: `coach-${s.id}`,
  };

  if (!type) {
    return {
      ...base,
      category: "NOTE",
      description: [s.why, ...(s.exercises ?? [])].filter(Boolean).join("\n"),
    };
  }

  const why = s.why ? `\n\n# ${s.why}` : "";

  if (type === "WeightTraining") {
    return {
      ...base,
      category: "WORKOUT",
      type,
      description: `${(s.exercises ?? []).map((e) => `- ${e}`).join("\n")}${why}`.trim(),
    };
  }

  if (!s.exercises?.length) {
    return { ...base, category: "WORKOUT", type, description: why.trim() };
  }

  const built = buildWorkout(s.exercises);
  return {
    ...base,
    category: "WORKOUT",
    type,
    description: `${built.description}${why}`,
    ...(built.movingTime > 0 ? { moving_time: built.movingTime } : {}),
  };
}
