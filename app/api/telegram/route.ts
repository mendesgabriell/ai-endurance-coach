import { NextResponse } from "next/server";
import { answerCallback, isAthlete, sendMessage, sendTyping } from "@/channels/telegram/client.js";
import { reply } from "@/coach/reply.js";
import { recentTurns, saveCheckin, saveTurn } from "@/db/client.js";
import { dailyMessage } from "@/channels/telegram/format.js";
import { todayISO } from "@/plan/plan.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Update {
  message?: { chat: { id: number }; text?: string };
  callback_query?: { id: string; data?: string; message?: { chat: { id: number } } };
}

export async function POST(req: Request): Promise<NextResponse> {
  // Telegram devolve o secret_token registrado no setWebhook.
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expected && req.headers.get("x-telegram-bot-api-secret-token") !== expected) {
    return NextResponse.json({ ok: true }); // 200 silencioso — não dá pista a quem sondar
  }

  const update = (await req.json()) as Update;

  // Botão de check-in
  const cb = update.callback_query;
  if (cb?.data?.startsWith("ck:")) {
    const chat = cb.message?.chat.id;
    if (chat === undefined || !isAthlete(chat)) return NextResponse.json({ ok: true });
    const [, day, status] = cb.data.split(":");
    if (day && status) {
      await saveCheckin(day, day, status as "feito" | "adaptei" | "nao_rolou");
      await answerCallback(cb.id, { feito: "Anotado 💪", adaptei: "Me conta o que mudou", nao_rolou: "Sem drama" }[status] ?? "Ok");
      if (status !== "feito") {
        await sendMessage("O que rolou? Escreve aqui que eu ajusto o resto da semana.");
      }
    }
    return NextResponse.json({ ok: true });
  }

  const msg = update.message;
  if (!msg?.text || !isAthlete(msg.chat.id)) return NextResponse.json({ ok: true });

  const day = todayISO();
  const text = msg.text.trim();

  if (text === "/hoje" || text === "/start") {
    await sendMessage(dailyMessage(day));
    return NextResponse.json({ ok: true });
  }

  await sendTyping();
  await saveTurn("user", text);

  try {
    const answer = await reply(day, await recentTurns(), text);
    await saveTurn("assistant", answer);
    await sendMessage(answer);
  } catch (err) {
    console.error("coach falhou", err);
    await sendMessage("Deu erro aqui do meu lado. Tenta de novo em um minuto.");
  }

  return NextResponse.json({ ok: true });
}
