import { NextResponse } from "next/server";
import { clientFromEnv, shift, syncRange } from "@/integrations/intervals/sync";
import { todayISO } from "@/plan/plan";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Sincroniza o relógio, e só isso. Sem Telegram.
 *
 * Existe separado de /api/daily porque a mensagem da manhã é uma vez ao dia e
 * esta rota é para rodar de hora em hora: o plano muda no meio da tarde e o
 * relógio não pode esperar até amanhã.
 *
 * O cron da Vercel no plano Hobby dispara uma vez ao dia — por isso quem chama
 * esta rota em intervalo curto é o agendador do GitHub Actions
 * (.github/workflows/sync.yml), que é gratuito.
 *
 * Escreve só a diferença: chamada em que nada mudou é um GET no intervals.icu.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const api = clientFromEnv();
  if (!api) {
    return NextResponse.json({ ok: true, watch: "desligado" });
  }

  const day = todayISO();
  try {
    const r = await syncRange(api, day, shift(day, 14));
    return NextResponse.json({ ok: true, day, ...r });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("sync intervals.icu falhou:", msg);
    return NextResponse.json({ ok: false, day, erro: msg }, { status: 502 });
  }
}
