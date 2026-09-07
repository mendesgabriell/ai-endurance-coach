#!/usr/bin/env node
// Worker do Coach. Roda no Mac, só faz HTTPS de saída.
// Puxa jobs da fila (bridge), executa com Claude Code headless — login da
// assinatura, não a API paga — e devolve o resultado. A bridge manda no Telegram.
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ENV_FILE = path.join(os.homedir(), ".coach-worker.env");
function loadEnv() {
  const env = {};
  if (!fs.existsSync(ENV_FILE)) return env;
  for (const line of fs.readFileSync(ENV_FILE, "utf8").split("\n")) {
    if (line.trim().startsWith("#")) continue;
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}
const ENV = loadEnv(); // lê o ARQUIVO: o launchd não carrega o seu .zshrc
const { BRIDGE_URL, WORKER_KEY } = ENV;
const CLAUDE_BIN = ENV.CLAUDE_BIN || "claude";
const WORKSPACE = ENV.WORKSPACE || os.homedir();
const WORKER_NAME = ENV.WORKER_NAME || os.hostname();
const MODEL = ENV.MODEL || "sonnet";
const TOOL_BIN = path.join(os.homedir(), ".local", "bin", "coach-tool");

if (!BRIDGE_URL || !WORKER_KEY) {
  console.error(`faltam BRIDGE_URL/WORKER_KEY em ${ENV_FILE}`);
  process.exit(1);
}
const log = (...a) => console.log(new Date().toISOString(), ...a);

async function bridge(action, payload = {}) {
  const res = await fetch(BRIDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-worker-key": WORKER_KEY },
    body: JSON.stringify({ action, ...payload }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`bridge ${action}: ${res.status} ${body.error || ""}`);
  return body;
}

function run(bin, args, { timeout = 300000, cwd, env } = {}) {
  return new Promise((resolve) => {
    execFile(bin, args, {
      timeout, cwd, maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, PATH: `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ""}`, ...env },
    }, (err, stdout, stderr) => resolve({ ok: !err, out: String(stdout || ""), errOut: String(stderr || "") }));
  });
}

/** Aviso direto, sem passar pela nuvem — se a nuvem cair, o alerta dela cai junto. */
async function tgDirect(text) {
  if (!ENV.TELEGRAM_BOT_TOKEN || !ENV.TELEGRAM_CHAT_ID) return;
  await fetch(`https://api.telegram.org/bot${ENV.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: ENV.TELEGRAM_CHAT_ID, text }),
  }).catch(() => {});
}

async function jobChat(job) {
  const text = String(job.params?.text || "").trim();
  if (!text) throw new Error("chat: params.text obrigatório");
  const ctx = await bridge("context");

  const tools = (ctx.tools || [])
    .map((t) => `- ${TOOL_BIN} ${t.name} '${t.input}'\n    ${t.desc}`)
    .join("\n");
  const hist = (ctx.historico || [])
    .map((m) => `${m.role === "user" ? "Gabriel" : "Coach"}: ${m.content}`)
    .join("\n");

  const prompt = [
    ctx.system_prompt,
    "",
    `Hoje é ${ctx.hoje}. Use esta data para qualquer referência relativa.`,
    "",
    "## Plano de hoje (já consultado para você)",
    JSON.stringify(ctx.plano, null, 1),
    "",
    "## Ferramentas — rode no Bash exatamente assim, uma por comando, sem pipe",
    tools,
    "",
    "REGRA DE OURO: nunca diga que consultou ou registrou algo sem ter rodado a",
    "ferramenta e visto a resposta. Se a ferramenta falhar, diga que falhou.",
    "Você NÃO calcula carga, HRV, ACWR, CTL/ATL/TSB nem o semáforo do dia — esses",
    "números vêm de código testado. Você lê o resultado e conversa sobre ele.",
    "Responda APENAS o texto final para o Gabriel, em português, sem falar de bastidores.",
    "Pode usar <b>negrito</b> e <i>itálico</i> do HTML do Telegram, mais nada.",
    "",
    "## Conversa até aqui",
    hist || "(vazia)",
    "",
    "## Mensagem nova",
    text,
  ].join("\n");

  const env = {};
  if (ENV.CLAUDE_CODE_OAUTH_TOKEN) env.CLAUDE_CODE_OAUTH_TOKEN = ENV.CLAUDE_CODE_OAUTH_TOKEN;

  const r = await run(
    CLAUDE_BIN,
    ["-p", prompt, "--model", MODEL, "--allowedTools", `Bash(${TOOL_BIN}:*)`],
    { cwd: WORKSPACE, timeout: 5 * 60 * 1000, env },
  );
  const reply = (r.out || "").trim();
  if (!r.ok || !reply) {
    if (/not logged in|please log in|oauth|authentication/i.test(r.errOut)) {
      await tgDirect(`Worker ${WORKER_NAME}: o login do Claude Code expirou. Rode "claude" e faça /login nesta máquina.`);
    }
    throw new Error(`claude falhou: ${(r.errOut || r.out).slice(-300)}`);
  }
  return reply;
}

async function processJob(job) {
  log(`job #${job.id} (${job.kind}) iniciando`);
  try {
    if (job.kind !== "chat") throw new Error(`kind desconhecido: ${job.kind}`);
    const result = await jobChat(job);
    await bridge("complete", { id: job.id, ok: true, result });
    log(`job #${job.id} concluído`);
  } catch (e) {
    log(`job #${job.id} ERRO:`, e.message);
    await bridge("complete", { id: job.id, ok: false, error: e.message }).catch(() => {});
  }
}

let busy = false;
let backoffUntil = 0;
async function tick() {
  if (busy || Date.now() < backoffUntil) return;
  busy = true;
  try {
    const { job } = await bridge("claim", { worker: WORKER_NAME });
    if (job) await processJob(job);
  } catch (e) {
    log("tick erro:", e.message);
    if (/ 4\d\d/.test(e.message)) backoffUntil = Date.now() + 5 * 60_000;
  } finally {
    busy = false;
  }
}
async function beat() {
  try {
    await bridge("heartbeat", { name: WORKER_NAME, info: { host: os.hostname(), busy } });
  } catch (e) {
    log("heartbeat erro:", e.message);
  }
}

log(`worker do coach iniciado — bridge ${BRIDGE_URL}, modelo ${MODEL}`);
beat();
setInterval(tick, 5000);
setInterval(beat, 60000);
