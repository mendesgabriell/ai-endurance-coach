import { boolean, date, index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

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
