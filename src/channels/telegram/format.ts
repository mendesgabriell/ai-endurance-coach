import { blockFor, daysToRace, RACE_NAME, sessionsOn } from "@/plan/plan";
import type { PlannedSession, SessionKind } from "@/plan/types";

const ICON: Record<SessionKind, string> = {
  corrida: "🏃",
  perna: "🦵",
  superiores: "💪",
  recovery: "🧊",
  nutricao: "🍽",
  chave: "⭐️",
};

export function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}

/** Mensagem da manhã. Sem LLM — determinística, sempre igual para o mesmo dia. */
export function dailyMessage(date: string): string {
  const td = daysToRace(date);
  const block = blockFor(date);
  const list = sessionsOn(date);

  const countdown =
    td > 1 ? `faltam ${td} dias` : td === 1 ? "é amanhã" : td === 0 ? "É HOJE" : "concluída";
  const head =
    `<b>${escapeHtml(RACE_NAME)}</b> · ${countdown}` +
    (block ? `\n<i>${escapeHtml(block.title)}</i>` : "");

  if (list.length === 0) {
    return `${head}\n\n<b>Descanso.</b> Nada programado hoje — e isso é parte do plano.`;
  }

  return `${head}\n\n${list.map(renderSession).join("\n\n")}`;
}

function renderSession(s: PlannedSession): string {
  const lines = [`${ICON[s.kind]} <b>${escapeHtml(s.text)}</b>`];

  if (s.exercises?.length) {
    const items = s.exercises.map((e) => escapeHtml(e)).join("\n");
    // lista longa vira bloco recolhível: a mensagem fica curta, toca para abrir
    lines.push(
      s.exercises.length > 4
        ? `<blockquote expandable>${items}</blockquote>`
        : `<blockquote>${items}</blockquote>`,
    );
  }

  if (s.why) lines.push(`<i>${escapeHtml(s.why)}</i>`);

  return lines.join("\n");
}

/** Contexto compacto para o coach responder pergunta livre. */
export function planContext(date: string): string {
  return [-1, 0, 1, 2, 3, 4, 5]
    .map((offset) => shift(date, offset))
    .map((d) => {
      const list = sessionsOn(d);
      const marker = d === date ? " <- HOJE" : "";
      const items = list.length
        ? list
            .map((s) => {
              const ex = s.exercises?.length
                ? `\n${s.exercises.map((e) => `      . ${e}`).join("\n")}`
                : "";
              const why = s.why ? `\n      (motivo: ${s.why})` : "";
              return `  - [${s.kind}] ${s.text}${ex}${why}`;
            })
            .join("\n")
        : "  - descanso";
      return `${d} (T-${daysToRace(d)})${marker}\n${items}`;
    })
    .join("\n\n");
}

function shift(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
