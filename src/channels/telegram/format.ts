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

/* ---------- botões de check-in ---------- */

export interface CheckinRow {
  text: string;
  data: string;
}

/** Um botão por sessão do dia. Marcado vira ✅ e o toque desfaz. */
export function checkinRows(date: string, done: Set<string>): CheckinRow[][] {
  return sessionsOn(date).map((s) => [
    { text: `${done.has(s.id) ? "✅" : ICON[s.kind]} ${short(s.text)}`, data: `ck:${s.id}` },
  ]);
}

function short(s: string, limit = 34): string {
  const clean = s.split(" — ")[0]!.split(" · ")[0]!;
  return clean.length > limit ? `${clean.slice(0, limit - 1)}…` : clean;
}

/* ---------- outras mensagens ---------- */

const DOW = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** Os próximos 7 dias em uma tela. */
export function weekMessage(from: string): string {
  const days = [0, 1, 2, 3, 4, 5, 6].map((o) => shift(from, o));
  const body = days
    .map((d) => {
      const list = sessionsOn(d);
      const head = `<b>${DOW[new Date(`${d}T00:00:00Z`).getUTCDay()]} ${d.slice(8)}/${d.slice(5, 7)}</b>${d === from ? " · hoje" : ""}`;
      if (!list.length) return `${head}\n   descanso`;
      return `${head}\n${list.map((s) => `   ${ICON[s.kind]} ${escapeHtml(s.text)}`).join("\n")}`;
    })
    .join("\n\n");
  return `<b>Próximos 7 dias</b>\n\n${body}`;
}

/** O que ainda não foi marcado hoje. */
export function pendingMessage(date: string, done: Set<string>): string {
  const open = sessionsOn(date).filter((s) => !done.has(s.id));
  if (!open.length) return "<b>Dia fechado.</b> Tudo marcado. 💪";
  return `<b>Ainda em aberto hoje</b>\n${open.map((s) => `${ICON[s.kind]} ${escapeHtml(s.text)}`).join("\n")}`;
}

export function helpMessage(conversation: boolean): string {
  return [
    "<b>O que eu faço</b>",
    "",
    "/hoje — o treino de hoje, com botão para marcar",
    "/amanha — o de amanhã",
    "/semana — os próximos 7 dias",
    "/feito — marca tudo de hoje como feito",
    "/pendente — o que falta hoje",
    "/ajuda — isto aqui",
    "",
    "<b>Registrar, escrevendo solto</b>",
    "<i>“corri 8k em 48min”</i> · <i>“fiz perna, agachamento pesado”</i> · <i>“sauna 20 min”</i>",
    "Anoto o número, marco a sessão que bate e guardo o texto.",
    "",
    "<b>Perguntar, escrevendo solto</b>",
    "<i>“qual era o treino de esteira de ontem?”</i>",
    "<i>“o que tá pendente de ontem?”</i>",
    "<i>“o que teve no sábado?”</i> · <i>“como fica o resto da semana?”</i>",
    "Entendo <b>hoje, ontem, anteontem, amanhã</b> e o nome do dia da semana.",
    "",
    conversation
      ? "A conversa está <b>ligada</b>: pode perguntar o porquê de qualquer coisa."
      : "A conversa está <b>desligada</b> para não gastar API. Eu registro e aviso; o porquê a gente vê no Claude.",
  ].join("\n");
}

/** Sessões de um dia, opcionalmente filtradas por tipo, com ✅ no que foi feito. */
export function answerMessage(
  day: string,
  label: string,
  kinds: SessionKind[],
  done: Set<string>,
): string {
  const all = sessionsOn(day);
  const list = kinds.length ? all.filter((s) => kinds.includes(s.kind)) : all;

  if (!all.length) return `<b>${escapeHtml(label)}</b>\n\nDescanso — nada programado.`;
  if (!list.length) {
    return (
      `<b>${escapeHtml(label)}</b>\n\nNão tinha nada desse tipo nesse dia. O que tinha:\n` +
      all.map((s) => `${ICON[s.kind]} ${escapeHtml(s.text)}`).join("\n")
    );
  }

  const body = list
    .map((s) => {
      const mark = done.has(s.id) ? "✅" : ICON[s.kind];
      const ex = s.exercises?.length
        ? `\n<blockquote${s.exercises.length > 4 ? " expandable" : ""}>${s.exercises.map(escapeHtml).join("\n")}</blockquote>`
        : "";
      const why = s.why ? `\n<i>${escapeHtml(s.why)}</i>` : "";
      return `${mark} <b>${escapeHtml(s.text)}</b>${ex}${why}`;
    })
    .join("\n\n");

  return `<b>${escapeHtml(label)}</b>\n\n${body}`;
}

/** O que ficou sem marcar num dia qualquer. */
export function pendingOn(day: string, label: string, done: Set<string>): string {
  const open = sessionsOn(day).filter((s) => !done.has(s.id));
  if (!sessionsOn(day).length) return `<b>${escapeHtml(label)}</b>\n\nNão tinha nada programado.`;
  if (!open.length) return `<b>${escapeHtml(label)}</b>\n\nNada em aberto. Tudo marcado. 💪`;
  return (
    `<b>${escapeHtml(label)}</b> · em aberto\n\n` +
    open.map((s) => `${ICON[s.kind]} ${escapeHtml(s.text)}`).join("\n")
  );
}
