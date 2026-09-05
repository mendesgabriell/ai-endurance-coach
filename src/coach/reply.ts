import Anthropic from "@anthropic-ai/sdk";
import { planContext } from "@/channels/telegram/format.js";
import { SYSTEM_STABLE } from "./prompt.js";

const client = new Anthropic();

export interface Turn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Responde uma mensagem livre do atleta.
 * O prefixo estável fica cacheado; o contexto do dia vai depois do breakpoint.
 */
export async function reply(date: string, history: Turn[], message: string): Promise<string> {
  const res = await client.messages.create({
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
