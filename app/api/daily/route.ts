import { NextResponse } from "next/server";
import { dailyMessage } from "@/channels/telegram/format.js";
import { sendMessage } from "@/channels/telegram/client.js";
import { saveTurn } from "@/db/client.js";
import { sessionsOn, todayISO } from "@/plan/plan.js";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Cron das 05:00 BRT (08:00 UTC — ver vercel.json).
 * A mensagem do dia é DETERMINÍSTICA: montada do plano, sem LLM.
 * Regra do CLAUDE.md — o modelo não decide o treino do dia.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const day = todayISO();
  const text = dailyMessage(day);
  const hasWork = sessionsOn(day).length > 0;

  await sendMessage(text, {
    buttons: hasWork
      ? [
          { text: "✅ Feito", data: `ck:${day}:feito` },
          { text: "🔀 Adaptei", data: `ck:${day}:adaptei` },
          { text: "❌ Não rolou", data: `ck:${day}:nao_rolou` },
        ]
      : undefined,
  });
  await saveTurn("assistant", text, true);

  return NextResponse.json({ ok: true, day, sessions: sessionsOn(day).length });
}
