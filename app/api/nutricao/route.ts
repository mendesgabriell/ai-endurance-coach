import { NextResponse } from "next/server";
import { gravarNutricao, interpretarNutricao } from "@/prumo/nutricao";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Recebe o dia de alimentação. O caminho é MyFitnessPal → Apple Health →
 * Health Auto Export (automação REST API no iPhone) → aqui. A chave é a mesma
 * do modo privado, no header `Authorization: Bearer <PRUMO_CHAVE>`.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const chave = process.env.PRUMO_CHAVE;
  const auth = req.headers.get("authorization") || "";
  if (!chave || auth !== `Bearer ${chave}`) return NextResponse.json({ ok: false }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, erro: "corpo não é JSON" }, { status: 400 });
  }
  const dias = interpretarNutricao(body);
  if (!dias.length) return NextResponse.json({ ok: false, erro: "nenhuma métrica conhecida" }, { status: 400 });
  const n = await gravarNutricao(dias);
  return NextResponse.json({ ok: true, dias: n, ultimo: dias[dias.length - 1]?.d ?? null });
}
