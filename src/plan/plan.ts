import type { Block, PlannedSession } from "./types";

export const RACE_DATE = "2026-09-19";
export const RACE_NAME = "UTMB Paraty 58K";
export const ATHLETE_TZ = "America/Sao_Paulo";

export const BLOCKS: Block[] = [
  { start: "2026-08-24", title: "Bloco 1 · Religar", detail: "~50 km · 1.500 m D+" },
  { start: "2026-08-31", title: "Bloco 2 · Pico", detail: "~72 km · 3.100 m D+" },
  { start: "2026-09-07", title: "Bloco 3 · Semana dupla", detail: "prova + longão" },
  { start: "2026-09-14", title: "Bloco 4 · Polimento", detail: "volume −60% · largada" },
];

export const PLAN: PlannedSession[] = [
  { id: "g1", date: "2026-08-31", kind: "superiores", text: "Superiores A · Push — supino, desenvolvimento, elevação lateral, tríceps", why: "Entrou no lugar da Perna A: 9.061 kg de perna no domingo, 24h depois do longão." },
  { id: "g2", date: "2026-08-31", kind: "corrida", text: "Regenerativo 30–40' bem fácil" },
  { id: "g3", date: "2026-08-31", kind: "recovery", text: "Bota de compressão 40'" },

  { id: "h1", date: "2026-09-01", kind: "corrida", text: "ESTEIRA · subidas em limiar — 15' aquec. + 5 × 4' a 8–12% de inclinação, FC 155–162, recup. 3' a 2% + 10' solto" },
  { id: "h4", date: "2026-09-01", kind: "chave", text: "Portão: perna dolorida de domingo → corta para 4 × 4'" },
  { id: "h3", date: "2026-09-01", kind: "nutricao", text: "Começa aclimatação ao calor — sauna 15–20' pós-treino, 4–5×/semana até 16/09" },

  { id: "i1", date: "2026-09-02", kind: "corrida", text: "Base 70' fácil" },
  { id: "i2", date: "2026-09-02", kind: "perna", text: "Perna B · excêntrico — agachamento excêntrico 4–5s desc. 4×6 · step-down unilateral 4×8 · extensora excêntrica 3×8 · afundo com déficit 3×8 · nórdico 3×5", why: "Único veículo de excêntrico do meio de semana: esteira não faz declive negativo. Não pula." },
  { id: "i3", date: "2026-09-02", kind: "recovery", text: "Massagem profunda" },
  { id: "i4", date: "2026-09-02", kind: "corrida", text: "Opcional: escada de prédio — sobe de elevador, desce a pé, 8–10 andares × 6" },

  { id: "j1", date: "2026-09-03", kind: "chave", text: "ESTEIRA · power hiking longo — 15' aquec. + 4 × 8' caminhando forte a 15%, recup. 3' a 3% + 10' solto", why: "A Macela sobe 1.443 m em 13 km com trechos a 17–18%. Você vai caminhar boa parte." },
  { id: "j2", date: "2026-09-03", kind: "superiores", text: "Superiores B · Pull" },
  { id: "j3", date: "2026-09-03", kind: "nutricao", text: "Sauna 15–20' pós-treino" },
  { id: "j4", date: "2026-09-03", kind: "recovery", text: "Ventosa 20'" },

  { id: "k1", date: "2026-09-04", kind: "corrida", text: "Regenerativo 40'" },
  { id: "k2", date: "2026-09-04", kind: "perna", text: "Perna C · estabilidade — adutor, glúteo médio, tornozelo" },
  { id: "k3", date: "2026-09-04", kind: "recovery", text: "Gelo 10'" },
  { id: "k4", date: "2026-09-04", kind: "chave", text: "Portão: checa o semáforo — se vermelho, sábado vira só o 21k" },

  { id: "l1", date: "2026-09-05", kind: "chave", text: "VOTU · circuito 21k — 18,7 km / 1.128 m · ~3h15" },
  { id: "l2", date: "2026-09-05", kind: "chave", text: "DEPOIS do circuito: 5 a 6 repetições de UM trecho técnico de descida — sobe caminhando, desce forçando (~40')", why: "Você já está cansado: é a réplica exata dos km 37–59." },
  { id: "l3", date: "2026-09-05", kind: "nutricao", text: "Ensaio geral: mochila, géis, sal, tênis, meia, roupa. Nada novo depois de hoje." },
  { id: "l4", date: "2026-09-05", kind: "nutricao", text: "60 g carbo/h · 500–700 ml/h · 800–1.000 mg sódio/h", why: "Sábado passado foram 40. Escada até 80 no dia 12." },
  { id: "l5", date: "2026-09-05", kind: "recovery", text: "Em casa: pernas para cima + refeição em 60'. Sem gelo." },

  { id: "m1", date: "2026-09-06", kind: "corrida", text: "Fácil 60–70', sem cronômetro" },
  { id: "m2", date: "2026-09-06", kind: "superiores", text: "Superiores C · ombro, braço e core — leve" },

  { id: "n1", date: "2026-09-07", kind: "perna", text: "Última Perna A pesada do ciclo" },
  { id: "n2", date: "2026-09-07", kind: "corrida", text: "Off" },
  { id: "n3", date: "2026-09-07", kind: "recovery", text: "Bota de compressão 40'" },

  { id: "o1", date: "2026-09-08", kind: "corrida", text: "ESTEIRA · power hiking — 3 × 8' a 15% + 5 × 20\" de ladeira" },
  { id: "o2", date: "2026-09-08", kind: "superiores", text: "Superiores A · Push" },
  { id: "o3", date: "2026-09-08", kind: "nutricao", text: "Sauna 20'" },

  { id: "p1", date: "2026-09-09", kind: "corrida", text: "Base 50' fácil" },
  { id: "p2", date: "2026-09-09", kind: "perna", text: "Perna B — última do ciclo, volume −50%" },
  { id: "p3", date: "2026-09-09", kind: "recovery", text: "Última massagem profunda antes de Paraty" },

  { id: "q1", date: "2026-09-10", kind: "corrida", text: "Ativação 40' com 5 × 1' em ritmo forte" },
  { id: "q2", date: "2026-09-10", kind: "superiores", text: "Superiores B · Pull — volume −30%" },
  { id: "q3", date: "2026-09-10", kind: "nutricao", text: "Sauna 20'" },
  { id: "q4", date: "2026-09-10", kind: "recovery", text: "Ventosa 20'" },

  { id: "r1", date: "2026-09-11", kind: "corrida", text: "25' destravante ou off — véspera de prova" },
  { id: "r2", date: "2026-09-11", kind: "recovery", text: "Gelo liberado a partir de hoje — 10'" },

  { id: "s1", date: "2026-09-12", kind: "chave", text: "WTR TERRAS VULCÂNICAS · 16 km / ~900 m" },
  { id: "s2", date: "2026-09-12", kind: "corrida", text: "Subida: teto de 142 bpm. Vai perder posição — é o exercício." },
  { id: "s3", date: "2026-09-12", kind: "corrida", text: "Descida: solta. 3º estímulo excêntrico do ciclo." },
  { id: "s4", date: "2026-09-12", kind: "nutricao", text: "80 g carbo/h. Acaba o déficit calórico — de amanhã, manutenção." },

  { id: "t1", date: "2026-09-13", kind: "chave", text: "Longão em fadiga · 2h a 2h30 — 18 a 22 km com D+, aeróbico" },
  { id: "t2", date: "2026-09-13", kind: "chave", text: "Portão: se a prova te esvaziou ontem, hoje vira 50' e ponto" },

  { id: "u1", date: "2026-09-14", kind: "corrida", text: "Off completo — você vem de prova + longão" },
  { id: "u2", date: "2026-09-14", kind: "perna", text: "Perna C só ativação, sem carga" },
  { id: "u3", date: "2026-09-14", kind: "recovery", text: "Massagem leve, drenagem" },

  { id: "v1", date: "2026-09-15", kind: "corrida", text: "40' com 6 × 30\" em ritmo de prova" },
  { id: "v2", date: "2026-09-15", kind: "superiores", text: "Superiores A leve — último do ciclo, metade das séries, sem falha" },
  { id: "v3", date: "2026-09-15", kind: "nutricao", text: "Manutenção · ~2.900 kcal" },

  { id: "w1", date: "2026-09-16", kind: "corrida", text: "30' fácil" },
  { id: "w2", date: "2026-09-16", kind: "nutricao", text: "Carb load dia 1 · 7 g/kg = 530 g" },
  { id: "w3", date: "2026-09-16", kind: "nutricao", text: "Última sauna do ciclo" },
  { id: "w4", date: "2026-09-16", kind: "recovery", text: "Bota 20'" },

  { id: "x1", date: "2026-09-17", kind: "corrida", text: "25' soltinho + 4 × 20\"" },
  { id: "x2", date: "2026-09-17", kind: "nutricao", text: "Carb load dia 2 · 9 g/kg = 685 g. Baixa fibra e gordura." },
  { id: "x3", date: "2026-09-17", kind: "recovery", text: "Gelo 10'" },

  { id: "y1", date: "2026-09-18", kind: "corrida", text: "20' destravante — ou off, se a viagem apertar" },
  { id: "y2", date: "2026-09-18", kind: "nutricao", text: "Carb load dia 3 · 10 g/kg = 760 g. Fibra mínima." },
  { id: "y3", date: "2026-09-18", kind: "chave", text: "Retirada de kit · mochila montada e pesada · 8h30 de sono" },

  { id: "z1", date: "2026-09-19", kind: "chave", text: "UTMB PARATY 58K — teto de 142 bpm nas primeiras 3 horas. Sem exceção." },
];

/** Data de hoje no fuso do atleta, como YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ATHLETE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function sessionsOn(date: string): PlannedSession[] {
  return PLAN.filter((s) => s.date === date);
}

/** Dias inteiros de `from` até a prova. Negativo depois dela. */
export function daysToRace(from: string): number {
  const ms = Date.parse(`${RACE_DATE}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function blockFor(date: string): Block | undefined {
  return [...BLOCKS].reverse().find((b) => b.start <= date);
}
