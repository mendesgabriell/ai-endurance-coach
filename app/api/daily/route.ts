import { NextResponse } from "next/server";
import { checkinRows, dailyMessage } from "@/channels/telegram/format";
import { sendMessage } from "@/channels/telegram/client";
import { checkinsOn, saveTurn } from "@/db/client";
import { sessionsOn, todayISO } from "@/plan/plan";
import { clientFromEnv, shift, syncRange } from "@/integrations/intervals/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

  // O relógio se conserta sozinho todo dia: o plano mudou ontem, o COROS sabe hoje.
  // Escreve só a diferença, então dia sem mudança custa um GET. Falha aqui não
  // pode derrubar a mensagem da manhã, que é o que o atleta realmente lê.
  let watch: unknown = "desligado";
  const api = clientFromEnv();
  if (api) {
    try {
      watch = await syncRange(api, day, shift(day, 14));
    } catch (err) {
      watch = { erro: err instanceof Error ? err.message : String(err) };
      console.error("sync intervals.icu falhou:", err);
    }
  }

  return NextResponse.json({ ok: true, day, sessions: sessions.length, watch });
}

function doneSet(map: Map<string, string>): Set<string> {
  return new Set([...map].filter(([, v]) => v === "feito").map(([k]) => k));
}
