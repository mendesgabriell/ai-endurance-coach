import { NextResponse } from "next/server";
import { montarDados } from "@/prumo/dados";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Os dados da página. O modo privado só vem com o cookie certo. */
export async function GET(req: Request): Promise<NextResponse> {
  const chave = process.env.PRUMO_CHAVE;
  const cookie = req.headers.get("cookie") || "";
  const privado = !!chave && cookie.split(";").some((c) => c.trim() === `prumo=${chave}`);
  const dados = await montarDados(privado);
  return NextResponse.json(dados, { headers: { "Cache-Control": "private, max-age=120" } });
}
