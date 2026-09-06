import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { checkins, messages, notes } from "./schema";
import type { Turn } from "@/coach/reply";

const url = process.env.DATABASE_URL;

/** Sem DATABASE_URL o bot roda igual — só não guarda nada. */
export const db = url
  ? drizzle(postgres(url, { prepare: false }), { schema: { checkins, messages, notes } })
  : null;

export async function recentTurns(limit = 20): Promise<Turn[]> {
  if (!db) return [];
  const rows = await db.select().from(messages).orderBy(desc(messages.createdAt)).limit(limit);
  return rows.reverse().map((r) => ({ role: r.role, content: r.content }));
}

export async function saveTurn(
  role: "user" | "assistant",
  content: string,
  fromCron = false,
): Promise<void> {
  if (!db) return;
  await db.insert(messages).values({ role, content, fromCron });
}

export type CheckinStatus = "feito" | "adaptei" | "nao_rolou";

export async function saveCheckin(
  sessionId: string,
  day: string,
  status: CheckinStatus,
  note?: string,
): Promise<void> {
  if (!db) return;
  await db.insert(checkins).values({ sessionId, day, status, note: note ?? null });
}

/** Último status de cada sessão do dia. Insert-only: vale o mais recente. */
export async function checkinsOn(day: string): Promise<Map<string, CheckinStatus>> {
  if (!db) return new Map();
  const rows = await db
    .select()
    .from(checkins)
    .where(eq(checkins.day, day))
    .orderBy(desc(checkins.createdAt));
  const out = new Map<string, CheckinStatus>();
  for (const r of rows) if (!out.has(r.sessionId)) out.set(r.sessionId, r.status);
  return out;
}

export async function saveNote(day: string, text: string): Promise<void> {
  if (!db) return;
  await db.insert(notes).values({ day, text });
}

export async function notesOn(day: string): Promise<string[]> {
  if (!db) return [];
  const rows = await db.select().from(notes).where(eq(notes.day, day)).orderBy(notes.createdAt);
  return rows.map((r) => r.text);
}
