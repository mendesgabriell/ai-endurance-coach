import { desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { checkins, messages } from "./schema";
import type { Turn } from "@/coach/reply";

const url = process.env.DATABASE_URL;

/** Sem DATABASE_URL o bot roda igual — só não guarda histórico. */
export const db = url ? drizzle(postgres(url, { prepare: false }), { schema: { checkins, messages } }) : null;

export async function recentTurns(limit = 20): Promise<Turn[]> {
  if (!db) return [];
  const rows = await db.select().from(messages).orderBy(desc(messages.createdAt)).limit(limit);
  return rows.reverse().map((r) => ({ role: r.role, content: r.content }));
}

export async function saveTurn(role: "user" | "assistant", content: string, fromCron = false): Promise<void> {
  if (!db) return;
  await db.insert(messages).values({ role, content, fromCron });
}

export async function saveCheckin(
  sessionId: string,
  day: string,
  status: "feito" | "adaptei" | "nao_rolou",
): Promise<void> {
  if (!db) return;
  await db.insert(checkins).values({ sessionId, day, status });
}
