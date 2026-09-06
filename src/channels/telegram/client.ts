const API = "https://api.telegram.org";

function token(): string {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t) throw new Error("TELEGRAM_BOT_TOKEN não configurado");
  return t;
}

export function athleteChatId(): string {
  const id = process.env.TELEGRAM_CHAT_ID;
  if (!id) throw new Error("TELEGRAM_CHAT_ID não configurado");
  return id;
}

/** Só o atleta fala com o bot. Qualquer outro chat é ignorado em silêncio. */
export function isAthlete(chatId: number | string): boolean {
  return String(chatId) === athleteChatId();
}

async function call<T>(method: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}/bot${token()}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!json.ok) throw new Error(`Telegram ${method}: ${json.description ?? res.status}`);
  return json.result as T;
}

export interface InlineButton {
  text: string;
  data: string;
}

function keyboard(rows?: InlineButton[][]) {
  return rows?.length
    ? { inline_keyboard: rows.map((r) => r.map((b) => ({ text: b.text, callback_data: b.data }))) }
    : undefined;
}

/** Envia texto. Os botões vão só no último pedaço, para não repetirem. */
export async function sendMessage(
  text: string,
  opts: { chatId?: string; buttons?: InlineButton[][] } = {},
): Promise<void> {
  // Telegram corta em 4096 caracteres; parte em pedaços por parágrafo.
  const chunks = split(text, 3900);
  for (let i = 0; i < chunks.length; i++) {
    await call("sendMessage", {
      chat_id: opts.chatId ?? athleteChatId(),
      text: chunks[i],
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      reply_markup: i === chunks.length - 1 ? keyboard(opts.buttons) : undefined,
    });
  }
}

/** Troca só os botões de uma mensagem já enviada — usado ao marcar sessão. */
export async function editButtons(
  chatId: number | string,
  messageId: number,
  rows: InlineButton[][],
): Promise<void> {
  try {
    await call("editMessageReplyMarkup", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard(rows) ?? { inline_keyboard: [] },
    });
  } catch {
    // "message is not modified" e afins não são erro que interesse ao atleta
  }
}

export async function sendTyping(chatId?: string): Promise<void> {
  await call("sendChatAction", { chat_id: chatId ?? athleteChatId(), action: "typing" });
}

export async function answerCallback(callbackId: string, text?: string): Promise<void> {
  await call("answerCallbackQuery", { callback_query_id: callbackId, text });
}

function split(text: string, limit: number): string[] {
  if (text.length <= limit) return [text];
  const out: string[] = [];
  let cur = "";
  for (const para of text.split("\n\n")) {
    if (cur && cur.length + para.length + 2 > limit) {
      out.push(cur);
      cur = para;
    } else {
      cur = cur ? `${cur}\n\n${para}` : para;
    }
  }
  if (cur) out.push(cur);
  return out;
}
