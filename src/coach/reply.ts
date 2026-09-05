import Anthropic from "@anthropic-ai/sdk";
import { dailyMessage, planContext } from "@/channels/telegram/format";
import { SYSTEM_STABLE } from "./prompt";

export interface Turn {
  role: "user" | "assistant";
  content: string;
}

/**
 * O cliente só é construído quando existe chave. Sem ela, `new Anthropic()`
 * lança na importação e derruba a rota inteira do Telegram — inclusive o log,
 * que não precisa de modelo nenhum.
 */
let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic();
  return client;
}

export function conversationEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Responde uma mensagem livre do atleta.
 * O prefixo estável fica cacheado; o contexto do dia vai depois do breakpoint.
 *
 * Sem chave da Anthropic, devolve o resumo determinístico do dia. Ligar a
 * conversa depois é só acrescentar a variável no Vercel — nada muda aqui.
 */
export async function reply(date: string, history: Turn[], message: string): Promise<string> {
  const anthropic = getClient();
  if (!anthropic) {
    return [
      "Anotado. A conversa está desligada (sem chave da Anthropic), então vai o plano do dia:",
      "",
      dailyMessage(date),
    ].join("\n");
  }

  const res = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: 2000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    system: [
      { type: "text", text: SYSTEM_STABLE, cache_control: { type: "ephemeral" } },
      { type: "text", text: `Hoje é ${date}. Plano da janela:\n\n${planContext(date)}` },
    ],
    messages: [
      ...history.map((t) => ({ role: t.role, content: t.content })),
      { role: "user" as const, content: message },
    ],
  });

  if (res.stop_reason === "refusal") {
    return "Não consegui responder isso. Manda de outro jeito?";
  }

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return text || "Não veio resposta. Tenta de novo?";
}
