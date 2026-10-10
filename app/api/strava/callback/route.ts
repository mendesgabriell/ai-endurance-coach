import { NextResponse } from "next/server";
import { conectar } from "@/integrations/strava/client";
import { sincronizarStrava } from "@/integrations/strava/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Volta do OAuth do Strava: troca o código por tokens, guarda e faz a primeira sincronia. */
export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.json({ erro: url.searchParams.get("error") || "sem código" }, { status: 400 });
  try {
    await conectar(code);
    await sincronizarStrava({ dias: 30, forcar: true });
  } catch (e) {
    return NextResponse.json({ erro: String(e).slice(0, 200) }, { status: 502 });
  }
  return NextResponse.redirect(new URL("/prumo?strava=ligado", url.origin));
}
