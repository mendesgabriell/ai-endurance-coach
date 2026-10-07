import { NextResponse } from "next/server";

/** /api/prumo/entrar?chave=... grava o cookie do modo privado e volta para a página. */
export function GET(req: Request): NextResponse {
  const url = new URL(req.url);
  const chave = process.env.PRUMO_CHAVE;
  const res = NextResponse.redirect(new URL("/prumo/", url.origin));
  if (chave && url.searchParams.get("chave") === chave) {
    res.cookies.set("prumo", chave, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return res;
}
