import { NextResponse } from "next/server";
import { sendMessage } from "@/channels/telegram/client";
import { checkinRows, dailyMessage, weekMessage } from "@/channels/telegram/format";
import { SYSTEM_STABLE } from "@/coach/prompt";
import { TOOLS } from "@/coach/tools";
import {
  checkinsOn,
  claimJob,
  completeJob,
  enqueue,
  heartbeat,
  notesOn,
  recentTurns,
  requeueStale,
  saveCheckin,
  saveNote,
  saveTurn,
} from "@/db/client";
import { sessionsOn, todayISO } from "@/plan/plan";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Ponte entre o worker no Mac e a nuvem.
 *
 * O Mac nunca abre porta: ele só faz chamadas HTTPS de saída para cá. Autentica
 * com x-worker-key, que mora no .env local e nas variáveis do Vercel — nunca
 * no prompt do modelo.
 */

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });

async function runTool(name: string, input: Record<string, string>) {
  const dia = input.dia ?? todayISO();
  switch (name) {
    case "plano_do_dia": {
      const done = await checkinsOn(dia);
      return {
        ok: true,
        result: sessionsOn(dia).map((s) => ({
          id: s.id, tipo: s.kind, texto: s.text,
          exercicios: s.exercises ?? null, motivo: s.why ?? null,
          status: done.get(s.id) ?? "em aberto",
        })),
      };
    }
    case "plano_da_semana":
      return { ok: true, result: weekMessage(input.de ?? todayISO()).replace(/<[^>]+>/g, "") };
    case "marcacoes":
      return { ok: true, result: Object.fromEntries(await checkinsOn(dia)) };
    case "marcar": {
      const id = input.id;
      if (!id) return { ok: false, error: "falta o id da sessão" };
      if (!sessionsOn(dia).some((s) => s.id === id))
        return { ok: false, error: `não existe sessão ${id} em ${dia}` };
      const status = (input.status ?? "feito") as "feito" | "adaptei" | "nao_rolou";
      await saveCheckin(id, dia, status);
      return { ok: true, result: `${id} marcada como ${status} em ${dia}` };
    }
    case "anotacoes":
      return { ok: true, result: await notesOn(dia) };
    case "anotar": {
      if (!input.texto) return { ok: false, error: "falta o texto" };
      await saveNote(dia, input.texto);
      return { ok: true, result: "anotado" };
    }
    default:
      return { ok: false, error: `ferramenta desconhecida: ${name}` };
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  const key = process.env.WORKER_KEY;
  if (!key || req.headers.get("x-worker-key") !== key) {
    return json({ error: "não autorizado" }, 401);
  }

  const body = (await req.json()) as Record<string, never> & { action?: string };
  const b = body as unknown as Record<string, string | number | boolean | Record<string, string>>;

  try {
    switch (body.action) {
      case "heartbeat": {
        await heartbeat(String(b.name ?? "mac"), (b.info as Record<string, unknown>) ?? {});
        const requeued = await requeueStale();
        return json({ ok: true, requeued });
      }

      case "claim":
        return json({ job: await claimJob(String(b.worker ?? "mac")) });

      case "complete": {
        const row = await completeJob(
          Number(b.id), Boolean(b.ok),
          b.result ? String(b.result) : undefined,
          b.error ? String(b.error) : undefined,
        );
        if (row?.notify) {
          const day = todayISO();
          if (b.ok) {
            await saveTurn("assistant", String(b.result ?? ""));
            await sendMessage(String(b.result ?? "(sem resposta)"), {
              buttons: checkinRows(day, doneSet(await checkinsOn(day))),
            });
          } else {
            await sendMessage(`Não consegui responder agora. Vai o plano do dia:\n\n${dailyMessage(day)}`);
          }
        }
        return json({ ok: true });
      }

      case "enqueue":
        return json({
          id: await enqueue({
            kind: String(b.kind ?? "chat"),
            params: (b.params as Record<string, string>) ?? {},
            notify: Boolean(b.notify),
            requestedBy: String(b.requested_by ?? "worker"),
          }),
        });

      case "context": {
        const day = todayISO();
        return json({
          system_prompt: SYSTEM_STABLE,
          hoje: day,
          plano: (await runTool("plano_do_dia", { dia: day })).result,
          historico: await recentTurns(20),
          anotacoes_recentes: await notesOn(day),
          tools: TOOLS,
        });
      }

      case "tool":
        return json(await runTool(String(b.name), (b.input as Record<string, string>) ?? {}));

      default:
        return json({ error: `ação desconhecida: ${String(body.action)}` }, 400);
    }
  } catch (err) {
    console.error("bridge", err);
    return json({ error: String(err).slice(0, 400) }, 500);
  }
}

function doneSet(map: Map<string, string>): Set<string> {
  return new Set([...map].filter(([, v]) => v === "feito").map(([k]) => k));
}
