/**
 * Empurra o plano para o calendário do intervals.icu, que sincroniza no COROS.
 *
 *   npx tsx scripts/push-intervals.ts 2026-09-07 2026-09-19
 *   npx tsx scripts/push-intervals.ts 2026-09-07 2026-09-19 --dry
 *
 * Idempotente: apaga os eventos que este script criou no intervalo (marcados
 * com external_id `coach-*`) e recria. Eventos que você criou na mão no
 * intervals.icu ficam intactos.
 *
 * Fonte é sempre src/plan/plan.ts. Este script não decide nada.
 */
import { toEvent } from "../src/integrations/intervals/map";
import { clientFromEnv, syncRange } from "../src/integrations/intervals/sync";
import { PLAN } from "../src/plan/plan";

const [from, to, ...flags] = process.argv.slice(2);
const dry = flags.includes("--dry");

if (!from || !to) {
  console.error("uso: npx tsx scripts/push-intervals.ts <de:YYYY-MM-DD> <ate:YYYY-MM-DD> [--dry]");
  process.exit(1);
}

const sessions = PLAN.filter((s) => s.date >= from && s.date <= to);
const events = sessions.map(toEvent).filter((e) => e !== null);
const ignoradas = sessions.length - events.length;

if (dry) {
  for (const e of events) {
    console.log(`\n── ${e.start_date_local.slice(0, 10)} · ${e.category}${e.type ? ` · ${e.type}` : ""} · ${e.external_id}`);
    console.log(e.name);
    if (e.description) console.log(e.description);
    if (e.moving_time) console.log(`(${Math.round(e.moving_time / 60)} min)`);
  }
  console.log(`\n${events.length} eventos · ${ignoradas} ignoradas (nutrição/recovery) — nada foi enviado (--dry)`);
  process.exit(0);
}

const api = clientFromEnv();
if (!api) {
  console.error("faltam INTERVALS_API_KEY e INTERVALS_ATHLETE_ID no ambiente");
  process.exit(1);
}

try {
  const r = await syncRange(api, from, to);
  console.log(
    `${r.criados} criados · ${r.atualizados} atualizados · ${r.apagados} apagados · ` +
      `${r.intactos} sem mudança · ${ignoradas} ignoradas (nutrição/recovery) · ${from} a ${to}`,
  );
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(
    msg.includes("401")
      ? "intervals.icu recusou a chave (401). Confira INTERVALS_API_KEY em Settings > Developer\ne INTERVALS_ATHLETE_ID no formato i123456."
      : msg,
  );
  process.exit(1);
}
