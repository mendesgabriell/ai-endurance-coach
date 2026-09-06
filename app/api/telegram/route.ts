import { NextResponse } from "next/server";
import {
  answerCallback,
  editButtons,
  isAthlete,
  sendMessage,
  sendTyping,
} from "@/channels/telegram/client";
import {
  answerMessage,
  checkinRows,
  dailyMessage,
  helpMessage,
  pendingMessage,
  pendingOn,
  weekMessage,
} from "@/channels/telegram/format";
import { classify, dayLabel } from "@/coach/intent";
import { conversationEnabled, reply } from "@/coach/reply";
import { describeLog, hasNumbers, parseLog } from "@/coach/parse";
import { checkinsOn, recentTurns, saveCheckin, saveNote, saveTurn } from "@/db/client";
import { sessionsOn, todayISO } from "@/plan/plan";
import type { SessionKind } from "@/plan/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Update {
  message?: { chat: { id: number }; text?: string };
  callback_query?: {
    id: string;
    data?: string;
    message?: { message_id: number; chat: { id: number } };
  };
}

const ICON: Record<SessionKind, string> = {
  corrida: "🏃", perna: "🦵", superiores: "💪",
  recovery: "🧊", nutricao: "🍽", chave: "⭐️",
};

async function doneSet(day: string): Promise<Set<string>> {
  const map = await checkinsOn(day);
  return new Set([...map].filter(([, v]) => v === "feito").map(([k]) => k));
}

export async function POST(req: Request): Promise<NextResponse> {
  // Telegram devolve o secret_token registrado no setWebhook.
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expected && req.headers.get("x-telegram-bot-api-secret-token") !== expected) {
    return NextResponse.json({ ok: true }); // 200 silencioso — não dá pista a quem sondar
  }

  const update = (await req.json()) as Update;
  const day = todayISO();

  /* ---------- toque em botão de sessão ---------- */
  const cb = update.callback_query;
  if (cb?.data?.startsWith("ck:")) {
    const chat = cb.message?.chat.id;
    if (chat === undefined || !isAthlete(chat)) return NextResponse.json({ ok: true });

    const id = cb.data.slice(3);
    const session = sessionsOn(day).find((s) => s.id === id);
    const done = await doneSet(day);
    const wasDone = done.has(id);

    await saveCheckin(id, day, wasDone ? "nao_rolou" : "feito");
    if (wasDone) done.delete(id);
    else done.add(id);

    await answerCallback(cb.id, wasDone ? "Desmarquei" : `Feito 💪 ${session?.text ?? ""}`.trim());
    if (cb.message) await editButtons(chat, cb.message.message_id, checkinRows(day, done));
    return NextResponse.json({ ok: true });
  }

  const msg = update.message;
  if (!msg?.text || !isAthlete(msg.chat.id)) return NextResponse.json({ ok: true });
  const text = msg.text.trim();

  /* ---------- comandos ---------- */
  const cmd = text.split(/\s+/)[0]!.toLowerCase().replace(/@\w+$/, "");
  if (cmd.startsWith("/")) {
    switch (cmd) {
      case "/start":
      case "/hoje":
        await sendMessage(dailyMessage(day), { buttons: checkinRows(day, await doneSet(day)) });
        return NextResponse.json({ ok: true });

      case "/amanha":
      case "/amanhã":
        await sendMessage(dailyMessage(shift(day, 1)));
        return NextResponse.json({ ok: true });

      case "/semana":
        await sendMessage(weekMessage(day));
        return NextResponse.json({ ok: true });

      case "/pendente":
        await sendMessage(pendingMessage(day, await doneSet(day)));
        return NextResponse.json({ ok: true });

      case "/feito": {
        const all = sessionsOn(day);
        for (const s of all) await saveCheckin(s.id, day, "feito");
        await sendMessage(
          all.length
            ? `<b>Dia fechado.</b> Marquei as ${all.length} sessões de hoje. 💪`
            : "Hoje não tem nada programado — nada a marcar.",
        );
        return NextResponse.json({ ok: true });
      }

      case "/ajuda":
      case "/help":
        await sendMessage(helpMessage(conversationEnabled()));
        return NextResponse.json({ ok: true });

      default:
        await sendMessage(`Não conheço <code>${cmd}</code>.\n\n${helpMessage(conversationEnabled())}`);
        return NextResponse.json({ ok: true });
    }
  }

  /* ---------- texto livre ---------- */
  await saveTurn("user", text);
  const intent = classify(text, day);

  // Pergunta não é registro de treino: responde e não suja o log do dia.
  if (intent.type === "ask" && !conversationEnabled()) {
    const label = dayLabel(intent.day, day);
    const done = await doneSet(intent.day);
    const answer =
      intent.scope === "semana"
        ? weekMessage(day)
        : intent.scope === "pendente"
          ? pendingOn(intent.day, label, done)
          : answerMessage(intent.day, label, intent.kinds, done);
    await sendMessage(answer, {
      buttons: intent.day === day ? checkinRows(day, done) : undefined,
    });
    return NextResponse.json({ ok: true });
  }

  // Com chave da Anthropic, o coach conversa. Sem ela, o registro determinístico.
  if (conversationEnabled()) {
    await sendTyping();
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

  await saveNote(day, text);
  const parsed = parseLog(text);
  const done = await doneSet(day);

  // marca as sessões do dia cujo tipo bate com o que ele escreveu
  const matched = sessionsOn(day).filter((s) => parsed.kinds.includes(s.kind) && !done.has(s.id));
  for (const s of matched) {
    await saveCheckin(s.id, day, "feito", text);
    done.add(s.id);
  }

  const parts: string[] = [];
  const numbers = hasNumbers(parsed) ? describeLog(parsed) : "";
  parts.push(numbers ? `<b>Anotado.</b> ${numbers}` : "<b>Anotado.</b>");
  if (matched.length) {
    parts.push(matched.map((s) => `✅ ${ICON[s.kind]} ${s.text}`).join("\n"));
  }
  parts.push("", pendingMessage(day, done));

  await sendMessage(parts.join("\n"), { buttons: checkinRows(day, done) });
  return NextResponse.json({ ok: true });
}

function shift(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
