import { blockFor, daysToRace, RACE_NAME, sessionsOn } from "@/plan/plan.js";
import type { PlannedSession, SessionKind } from "@/plan/types.js";

const LABEL: Record<SessionKind, string> = {
  corrida: "🏃 Corrida",
  perna: "🦵 Perna",
  superiores: "💪 Superiores",
  recovery: "🧊 Recovery",
  nutricao: "🍽 Nutrição",
  chave: "⭐️ Chave",
};

export function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}

/** Mensagem das 5h. Sem LLM — determinística, sempre igual para o mesmo dia. */
export function dailyMessage(date: string): string {
  const td = daysToRace(date);
  const block = blockFor(date);
  const list = sessionsOn(date);

  const head =
    `<b>${escapeHtml(RACE_NAME)}</b> · ${td > 0 ? `T-${td}` : td === 0 ? "É HOJE" : "concluída"}\n` +
    (block ? `<i>${escapeHtml(block.title)}</i>\n` : "");

  if (list.length === 0) {
    return `${head}\n<b>Descanso.</b> Nada programado hoje — e isso é parte do plano.`;
  }

  const body = list.map(renderSession).join("\n\n");
  const whys = list.filter((s) => s.why).map((s) => `· ${escapeHtml(s.why!)}`);

  return (
    `${head}\n${body}` +
    (whys.length ? `\n\n<blockquote>${whys.join("\n")}</blockquote>` : "")
  );
}

function renderSession(s: PlannedSession): string {
  return `${LABEL[s.kind]}\n${escapeHtml(s.text)}`;
}

/** Contexto compacto para o coach responder pergunta livre. */
export function planContext(date: string): string {
  const around = [-1, 0, 1, 2, 3, 4, 5]
    .map((offset) => shift(date, offset))
    .map((d) => {
      const list = sessionsOn(d);
      const marker = d === date ? " ← HOJE" : "";
      const items = list.length
        ? list.map((s) => `  - [${s.kind}] ${s.text}${s.why ? ` (motivo: ${s.why})` : ""}`).join("\n")
        : "  - descanso";
      return `${d} (T-${daysToRace(d)})${marker}\n${items}`;
    });
  return around.join("\n\n");
}

function shift(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
