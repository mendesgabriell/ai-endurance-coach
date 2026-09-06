import { NextResponse } from "next/server";
import { checkinRows, dailyMessage } from "@/channels/telegram/format";
import { sendMessage } from "@/channels/telegram/client";
import { checkinsOn, saveTurn } from "@/db/client";
import { sessionsOn, todayISO } from "@/plan/plan";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Cron da manhã (ver vercel.json). No plano Hobby o Vercel dispara uma vez ao
 * dia, em qualquer minuto da hora agendada.
 *
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
  const sessions = sessionsOn(day);
  const done = await checkinsOn(day);

  await sendMessage(text, {
    buttons: sessions.length ? checkinRows(day, doneSet(done)) : undefined,
  });
  await saveTurn("assistant", text, true);

  return NextResponse.json({ ok: true, day, sessions: sessions.length });
}

function doneSet(map: Map<string, string>): Set<string> {
  return new Set([...map].filter(([, v]) => v === "feito").map(([k]) => k));
}
