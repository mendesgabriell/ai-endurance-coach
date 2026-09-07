import { and, desc, eq, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { agentJobs, checkins, messages, notes, workerStatus } from "./schema";
import type { Turn } from "@/coach/reply";

const url = process.env.DATABASE_URL;

/** Sem DATABASE_URL o bot roda igual — só não guarda nada. */
export const db = url
  ? drizzle(postgres(url, { prepare: false }), {
      schema: { agentJobs, checkins, messages, notes, workerStatus },
    })
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

/* ---------- fila de trabalhos e sinal de vida do worker ---------- */

export interface AgentJob {
  id: number;
  kind: string;
  params: Record<string, unknown>;
  notify: boolean;
  requestedBy: string | null;
}

/** Worker vivo = sinal nos últimos 3 minutos. */
export async function workerOnline(): Promise<boolean> {
  if (!db) return false;
  const rows = await db.select().from(workerStatus);
  const limit = Date.now() - 3 * 60_000;
  return rows.some((r) => r.lastSeenAt.getTime() > limit);
}

export async function heartbeat(name: string, info: Record<string, unknown>): Promise<void> {
  if (!db) return;
  await db
    .insert(workerStatus)
    .values({ name, lastSeenAt: new Date(), info })
    .onConflictDoUpdate({
      target: workerStatus.name,
      set: { lastSeenAt: new Date(), info },
    });
}

export async function enqueue(job: {
  kind: string;
  params: Record<string, unknown>;
  notify?: boolean;
  requestedBy?: string;
  tgUpdateId?: number;
}): Promise<number | null> {
  if (!db) return null;
  const rows = await db
    .insert(agentJobs)
    .values({
      kind: job.kind,
      params: job.params,
      notify: job.notify ?? true,
      requestedBy: job.requestedBy ?? null,
      tgUpdateId: job.tgUpdateId ?? null,
    })
    .onConflictDoNothing({ target: agentJobs.tgUpdateId })
    .returning({ id: agentJobs.id });
  return rows[0]?.id ?? null;
}

/**
 * Pega um job pendente. O update condicional em status garante que só um
 * worker leve cada job, mesmo com dois rodando ao mesmo tempo.
 */
export async function claimJob(worker: string): Promise<AgentJob | null> {
  if (!db) return null;
  const [next] = await db
    .select({ id: agentJobs.id })
    .from(agentJobs)
    .where(eq(agentJobs.status, "pending"))
    .orderBy(agentJobs.createdAt)
    .limit(1);
  if (!next) return null;

  const rows = await db
    .update(agentJobs)
    .set({ status: "running", claimedBy: worker, startedAt: new Date() })
    .where(and(eq(agentJobs.id, next.id), eq(agentJobs.status, "pending")))
    .returning();
  const j = rows[0];
  return j
    ? { id: j.id, kind: j.kind, params: j.params, notify: j.notify, requestedBy: j.requestedBy }
    : null;
}

export async function completeJob(
  id: number,
  ok: boolean,
  result?: string,
  error?: string,
): Promise<{ notify: boolean } | null> {
  if (!db) return null;
  const rows = await db
    .update(agentJobs)
    .set({
      status: ok ? "done" : "error",
      result: result ?? null,
      error: error ?? null,
      finishedAt: new Date(),
    })
    .where(eq(agentJobs.id, id))
    .returning({ notify: agentJobs.notify });
  return rows[0] ?? null;
}

/** Devolve à fila jobs que um worker pegou e abandonou. */
export async function requeueStale(minutes = 15): Promise<number> {
  if (!db) return 0;
  const rows = await db
    .update(agentJobs)
    .set({ status: "pending", claimedBy: null, startedAt: null })
    .where(and(eq(agentJobs.status, "running"), lt(agentJobs.startedAt, new Date(Date.now() - minutes * 60_000))))
    .returning({ id: agentJobs.id });
  return rows.length;
}
