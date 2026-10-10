import { NextResponse } from "next/server";
import { appConfigurado, authorizeUrl } from "@/integrations/strava/client";

export const dynamic = "force-dynamic";

/** Começa a ligação com o Strava. Só no modo privado: o cookie da chave precisa estar presente. */
export function GET(req: Request): NextResponse {
  const chave = process.env.PRUMO_CHAVE;
  const cookie = req.headers.get("cookie") || "";
  const privado = !!chave && cookie.split(";").some((c) => c.trim() === `prumo=${chave}`);
  if (!privado) return NextResponse.json({ erro: "só no modo privado: entre com a chave antes" }, { status: 401 });
  if (!appConfigurado()) return NextResponse.json({ erro: "STRAVA_CLIENT_ID e STRAVA_CLIENT_SECRET precisam estar nas variáveis da Vercel" }, { status: 500 });
  const origin = new URL(req.url).origin;
  return NextResponse.redirect(authorizeUrl(`${origin}/api/strava/callback`));
}
