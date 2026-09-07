import {
  bigint,
  boolean,
  date,
  index,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/** Check-in do atleta numa sessão do plano. */
export const checkins = pgTable(
  "checkins",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    day: date("day").notNull(),
    status: text("status", { enum: ["feito", "adaptei", "nao_rolou"] }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("checkins_day_idx").on(t.day)],
);

/** Histórico de conversa, para o coach ter memória entre mensagens. */
export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    fromCron: boolean("from_cron").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("messages_created_idx").on(t.createdAt)],
);

/** Observação livre do atleta, por dia. Espelha o campo do Calendário Macela. */
export const notes = pgTable(
  "notes",
  {
    id: serial("id").primaryKey(),
    day: date("day").notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("notes_day_idx").on(t.day)],
);

/** Fila de trabalhos do agente. O worker no Mac puxa daqui. */
export const agentJobs = pgTable(
  "agent_jobs",
  {
    id: serial("id").primaryKey(),
    kind: text("kind").notNull(),
    params: jsonb("params").$type<Record<string, unknown>>().notNull().default({}),
    status: text("status", { enum: ["pending", "running", "done", "error"] })
      .notNull()
      .default("pending"),
    notify: boolean("notify").notNull().default(true),
    requestedBy: text("requested_by"),
    /** id do update do Telegram — impede processar a mesma mensagem duas vezes */
    tgUpdateId: bigint("tg_update_id", { mode: "number" }).unique(),
    claimedBy: text("claimed_by"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    result: text("result"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("agent_jobs_status_idx").on(t.status, t.createdAt)],
);

/** Sinal de vida do worker. Sem sinal há 3 minutos = Mac offline. */
export const workerStatus = pgTable("worker_status", {
  name: text("name").primaryKey(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
  info: jsonb("info").$type<Record<string, unknown>>().notNull().default({}),
});
