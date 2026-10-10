import { NextResponse } from "next/server";
import { sincronizarStrava } from "@/integrations/strava/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Sincroniza o Strava agora. Com CRON_SECRET definido, exige o header; sem ele, é aberto (só lê a conta ligada). */
export async function GET(req: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  try {
    return NextResponse.json(await sincronizarStrava({ forcar: true }));
  } catch (e) {
    return NextResponse.json({ ok: false, erro: String(e).slice(0, 200) }, { status: 502 });
  }
}
