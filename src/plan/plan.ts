import type { Block, PlannedSession } from "./types";

export const RACE_DATE = "2026-09-19";
export const RACE_NAME = "UTMB Paraty 58K";
export const ATHLETE_TZ = "America/Sao_Paulo";

export const BLOCKS: Block[] = [
  { start: "2026-08-24", title: "Bloco 1 · Religar", detail: "~50 km · 1.500 m D+" },
  { start: "2026-08-31", title: "Bloco 2 · Carga", detail: "pico foi para segunda 07/09" },
  { start: "2026-09-07", title: "Bloco 3 · Pico + semana dupla", detail: "trilha · prova · longão" },
  { start: "2026-09-14", title: "Bloco 4 · Polimento", detail: "volume −60% · largada" },
];

/**
 * FONTE ÚNICA DO PLANO.
 * O calendário publicado é gerado daqui por scripts/build-calendar.mjs.
 * Editar aqui, rodar o script, publicar. Nunca editar o HTML na mão.
 */
export const PLAN: PlannedSession[] = [
  { id: "a1", date: "2026-08-25", kind: "corrida", text: "Ladeira neuromuscular 45'", exercises: ["15' aquecimento", "8 × 20\" forte em 10–15%", "15' solto"] },
  { id: "a2", date: "2026-08-25", kind: "perna", text: "Perna · Força máxima", exercises: ["Agachamento — 5 × 5 · RPE 8", "Leg press — 4 × 8 pesado", "Afundo com halteres — 3 × 8 cada perna", "Cadeira extensora — 3 × 10 + drop set na última", "Mesa flexora — 3 × 10", "Panturrilha em pé — 4 × 8 pesado", "Panturrilha sentado (sóleo) — 3 × 12", "Isometria: agachamento na parede — 3 × 45s"] },
  { id: "a3", date: "2026-08-25", kind: "superiores", text: "Superiores · Push", exercises: ["Supino reto com halteres — 4 × 8–10", "Desenvolvimento — 4 × 8–10", "Supino inclinado — 3 × 10–12", "Elevação lateral — 3 × 12–15 + drop set na última", "Tríceps corda — 3 × 12 + drop set na última", "Tríceps testa — 3 × 10–12"] },

  { id: "b1", date: "2026-08-26", kind: "corrida", text: "Base 60' fácil — FC abaixo de 140" },
  { id: "b2", date: "2026-08-26", kind: "perna", text: "Perna · Excêntrico (60% do volume)", exercises: ["Agachamento — 4 × 6 · negativa de 4s", "Leg press — 4 × 6 · negativa de 5s", "Step-down com halteres — 4 × 8 cada perna · desce em 4s", "Extensora excêntrica — 3 × 8 · sobe com 2 pernas, desce com 1", "Mesa flexora — 3 × 8 · negativa de 4s", "Isometria: búlgaro parado embaixo — 3 × 30s cada perna"] },
  { id: "b3", date: "2026-08-26", kind: "recovery", text: "Massagem profunda" },

  { id: "c0", date: "2026-08-27", kind: "chave", text: "Dorme primeiro — nada antes de 6h de sono" },
  { id: "c1", date: "2026-08-27", kind: "corrida", text: "Reativação 45–50' fácil — FC abaixo de 140", why: "3 dias sem correr e sem dormir não se resolve com volume." },
  { id: "c2", date: "2026-08-27", kind: "perna", text: "Perna · Força máxima — só se dormir 6h+", exercises: ["Agachamento — 5 × 5 · RPE 8", "Leg press — 4 × 8 pesado", "Afundo com halteres — 3 × 8 cada perna", "Cadeira extensora — 3 × 10 + drop set na última", "Mesa flexora — 3 × 10", "Panturrilha em pé — 4 × 8 pesado", "Panturrilha sentado (sóleo) — 3 × 12", "Isometria: agachamento na parede — 3 × 45s"] },
  { id: "c3", date: "2026-08-27", kind: "recovery", text: "Ventosa 20'" },

  { id: "d1", date: "2026-08-28", kind: "corrida", text: "Regenerativo 35–40' bem fácil" },
  { id: "d2", date: "2026-08-28", kind: "perna", text: "Perna · Estabilidade (metodologia antiga)", why: "Dia passado. Estabilidade saiu do plano em 04/09." },
  { id: "d3", date: "2026-08-28", kind: "recovery", text: "Gelo 10'" },

  { id: "e1", date: "2026-08-29", kind: "chave", text: "VOTU · 15k + 10k — 23 km / 1.170 m · ~3h15" },
  { id: "e2", date: "2026-08-29", kind: "corrida", text: "1ª descida repetida — 4 descidas técnicas forçadas" },
  { id: "e3", date: "2026-08-29", kind: "nutricao", text: "Treinar 60 g de carbo/hora" },
  { id: "e5", date: "2026-08-29", kind: "recovery", text: "Em casa: pernas para cima 15' + meia de compressão" },

  { id: "f1", date: "2026-08-30", kind: "corrida", text: "Fácil 50–60' em perna cansada" },
  { id: "f2", date: "2026-08-30", kind: "superiores", text: "Superiores · Ombro, braço e core", exercises: ["Desenvolvimento com halteres — 4 × 8–10", "Elevação lateral — 3 × 15 + drop set na última", "Elevação frontal — 3 × 12", "Crucifixo inverso — 3 × 15", "Rosca alternada — 3 × 12", "Tríceps banco — 3 × 15 + drop set na última", "Isometria: prancha — 3 × 45s", "Pallof press — 3 × 12 cada lado"] },

  { id: "g1", date: "2026-08-31", kind: "superiores", text: "Superiores · Push", exercises: ["Supino reto com halteres — 4 × 8–10", "Desenvolvimento — 4 × 8–10", "Supino inclinado — 3 × 10–12", "Elevação lateral — 3 × 12–15 + drop set na última", "Tríceps corda — 3 × 12 + drop set na última", "Tríceps testa — 3 × 10–12"], why: "Entrou no lugar da perna: 9.061 kg de perna no domingo." },
  { id: "g2", date: "2026-08-31", kind: "corrida", text: "Regenerativo 30–40' bem fácil" },
  { id: "g3", date: "2026-08-31", kind: "recovery", text: "Bota de compressão 40'" },

  { id: "h1", date: "2026-09-01", kind: "corrida", text: "ESTEIRA · subidas em limiar — ~1h", exercises: ["15' aquecimento", "5 × 4' a 8–12% de inclinação, FC 155–162", "recuperação 3' a 2% entre as séries", "10' solto"] },
  { id: "h3", date: "2026-09-01", kind: "nutricao", text: "Começa aclimatação ao calor — sauna 15–20' pós-treino" },

  { id: "i1", date: "2026-09-02", kind: "corrida", text: "ESTEIRA · 30' fácil — FC abaixo de 140", why: "Cortado de 60' a pedido. Os 30' foram para quinta e domingo." },
  { id: "i2", date: "2026-09-02", kind: "perna", text: "Perna · Excêntrico", exercises: ["Agachamento — 4 × 6 · negativa de 4s", "Leg press — 4 × 6 · negativa de 5s", "Step-down com halteres — 4 × 8 cada perna · desce em 4s", "Extensora excêntrica — 3 × 8 · sobe com 2 pernas, desce com 1", "Mesa flexora — 3 × 8 · negativa de 4s", "Isometria: búlgaro parado embaixo — 3 × 30s cada perna"], why: "Único excêntrico da semana — esteira não faz declive negativo. Não pula." },
  { id: "i0", date: "2026-09-02", kind: "chave", text: "REGRA: posterior dolorido do 400 de ontem? Corta nórdico e afundo com déficit" },
  { id: "i3", date: "2026-09-02", kind: "recovery", text: "Massagem profunda" },

  { id: "j1", date: "2026-09-03", kind: "chave", text: "ESTEIRA · power hiking longo — ~1h25", exercises: ["15' aquecimento", "4 × 8' caminhando forte a 15% (com bastões se tiver)", "recuperação 3' a 3% entre as séries", "15' corrida fácil (os 30' que vieram de quarta)", "10' solto"], why: "A Macela sobe 1.443 m em 13 km com trechos a 17–18%. Você vai caminhar boa parte." },
  { id: "j2", date: "2026-09-03", kind: "superiores", text: "Superiores · Pull", exercises: ["Barra fixa ou puxada alta — 4 × 8–10", "Remada curvada — 4 × 10", "Remada baixa — 3 × 10–12", "Face pull — 3 × 15", "Rosca direta — 3 × 10–12 + drop set na última", "Rosca martelo — 3 × 12"] },
  { id: "j3", date: "2026-09-03", kind: "nutricao", text: "Sauna 15–20' pós-treino" },
  { id: "j4", date: "2026-09-03", kind: "recovery", text: "Ventosa 20'" },

  { id: "k1", date: "2026-09-04", kind: "corrida", text: "Regenerativo 40'" },
  { id: "k2", date: "2026-09-04", kind: "perna", text: "Academia: pulada — casa e mercado", why: "Sem prejuízo. Perna teve dia pesado na quarta e 689 m de subida na quinta." },
  { id: "k5", date: "2026-09-04", kind: "nutricao", text: "Calor · 1 de 6 — sauna 15–20' OU banheira a 40°C por 30'", why: "Logo depois do treino, com o corpo ainda quente. Faltam 15 dias e o bloco está zerado." },
  { id: "k3", date: "2026-09-04", kind: "recovery", text: "Pernas para cima 15' + meia de compressão. Gelo hoje NÃO.", why: "Gelo cancela a sessão de calor: banho frio derruba a temperatura central que é justamente o estímulo da aclimatação." },
  { id: "k4", date: "2026-09-04", kind: "chave", text: "REGRA: perna pesada de sábado → se ainda estiver dolorido segunda de manhã, corta as repetições de descida e faz só o circuito" },

  { id: "l1", date: "2026-09-05", kind: "perna", text: "Perna · Força com foco em descida", exercises: ["Agachamento — 5 × 5 · RPE 8", "Leg press — 4 × 8 pesado", "Step-down no banco com halteres — 4 × 8 cada perna · desce em 3s", "Cadeira extensora — 3 × 10 + drop set duplo na última", "Panturrilha em pé — 4 × 8 pesado", "Panturrilha sentado (sóleo) — 3 × 12", "Isometria: agachamento na parede — 3 × 45s", "Isometria: panturrilha parada no degrau — 2 × 30s"], why: "Trilha saiu: descida técnica em pedra molhada 15 dias antes da prova é risco, não treino." },
  { id: "l8", date: "2026-09-05", kind: "corrida", text: "ESTEIRA · power hiking 50' — o desnível que a rua não dá", exercises: ["15' aquecimento", "4 × 7' caminhando forte a 12–15%", "recuperação 3' a 3% entre as séries", "5' solto"], why: "Uma esteira com inclinação vale mais que duas corridas planas." },
  { id: "l9", date: "2026-09-05", kind: "nutricao", text: "Calor · 2 de 6 — 20' pós-treino" },
  { id: "l5", date: "2026-09-05", kind: "recovery", text: "Pernas para cima 15' + meia de compressão" },

  { id: "m1", date: "2026-09-06", kind: "corrida", text: "Rodagem fácil 60–75' na rua — FC abaixo de 145", why: "Perna descansada para segunda. Se chover forte, esteira plana no mesmo tempo." },
  { id: "m2", date: "2026-09-06", kind: "superiores", text: "Superiores · Ombro, braço e core", exercises: ["Desenvolvimento com halteres — 4 × 8–10", "Elevação lateral — 3 × 15 + drop set na última", "Elevação frontal — 3 × 12", "Crucifixo inverso — 3 × 15", "Rosca alternada — 3 × 12", "Tríceps banco — 3 × 15 + drop set na última", "Isometria: prancha — 3 × 45s", "Pallof press — 3 × 12 cada lado"] },
  { id: "m3", date: "2026-09-06", kind: "nutricao", text: "Calor · 3 de 6 — 20' pós-treino" },

  { id: "n5", date: "2026-09-07", kind: "chave", text: "ACADEMIA · esteira power hiking — 4 × 7' a 15%", exercises: ["12' aquecimento caminhando a 5%", "4 × 7' caminhando forte a 15% (bastões se tiver)", "recuperação 3' a 3% entre as séries", "5' solto"], why: "VOTU caiu por logística — fica a 40 km e o dia não fecha. A esteira dá a subida; a descida técnica não tem substituto e volta só em Paraty." },
  { id: "n6", date: "2026-09-07", kind: "perna", text: "Perna · Excêntrico + glúteo — LOGO DEPOIS da esteira, sem sentar", exercises: ["Agachamento — 4 × 6 · negativa de 4s", "Leg press — 4 × 6 · negativa de 5s", "Step-down no banco com halteres — 4 × 8 cada perna · desce em 4s", "Búlgaro — 3 × 8 cada perna · negativa de 3s", "Elevação pélvica (hip thrust) — 4 × 10 pesado", "Cadeira abdutora — 3 × 15 + drop set na última", "Cadeira adutora — 3 × 15 + drop set na última", "Abdução em pé no cabo — 3 × 15 cada lado", "Mesa flexora — 3 × 8 · negativa de 4s", "Panturrilha em pé — 3 × 10"], why: "A ordem não é negociável: esteira primeiro. Perna já cansada descendo carga é a réplica possível dos km 37–59. Se o tempo apertar, corta panturrilha e flexora — abdutora e adutora ficam." },
  { id: "n7", date: "2026-09-07", kind: "nutricao", text: "Ensaio geral: mochila, géis, sal, tênis, meia, roupa. Nada novo depois de hoje." },
  { id: "n8", date: "2026-09-07", kind: "nutricao", text: "Ensaio de 60 g carbo/h · 500–700 ml/h · 800–1.000 mg sódio/h passa para 12/09", why: "Sem 3h de trilha não dá para ensaiar nutrição em movimento. A prova de sábado vira o único ensaio real que sobrou." },
  { id: "n9", date: "2026-09-07", kind: "nutricao", text: "Calor · 4 de 6 — 20' pós-treino", why: "Estava fora porque seriam 4h de trilha. Sem a trilha, volta — e adianta o bloco, que estava espremido em 08, 09 e 10 sem folga nenhuma." },
  { id: "n3", date: "2026-09-07", kind: "recovery", text: "Pernas para cima + refeição em 60'. Sem gelo." },

  { id: "o1", date: "2026-09-08", kind: "corrida", text: "Regenerativo 40' bem fácil — dia depois da trilha" },
  { id: "o2", date: "2026-09-08", kind: "superiores", text: "Superiores · Push — peito, ombro e tríceps", exercises: ["Supino reto com halteres — 4 × 8–10", "Desenvolvimento — 4 × 8–10", "Supino inclinado — 3 × 10–12", "Elevação lateral — 3 × 12–15 + drop set na última", "Tríceps corda — 3 × 12 + drop set na última", "Tríceps testa — 3 × 10–12"], why: "Último peito foi 31/08. Terça e quinta estavam as duas em costas, e o peito só voltaria em 15/09 — quinze dias. Push não disputa nada com a perna: é o volume mais barato do bloco." },
  { id: "o3", date: "2026-09-08", kind: "nutricao", text: "Calor · 5 de 6 — 20' pós-treino" },

  { id: "p1", date: "2026-09-09", kind: "corrida", text: "Base 50' fácil — na ESTEIRA a 6–8% se der", why: "Mesmo tempo, mesmo esforço, ~250 m de ganho de graça. É assim que se compra desnível sem sessão nova." },
  { id: "p2", date: "2026-09-09", kind: "perna", text: "Perna · Moderado + glúteo — última carga de perna do ciclo", exercises: ["Agachamento — 3 × 6 · RPE 7, não vai à falha", "Leg press — 3 × 8", "Step-down no banco com halteres — 3 × 8 cada perna · desce em 3s", "Elevação pélvica (hip thrust) — 4 × 10 pesado", "Cadeira abdutora — 3 × 15 + drop set na última", "Cadeira adutora — 3 × 15 + drop set na última", "Abdução em pé no cabo — 3 × 15 cada lado", "Mesa flexora — 3 × 10", "Panturrilha em pé — 3 × 12"], why: "Moderado porque segunda foi pesado. Duas sessões pesadas em 48h a 10 dias da prova não constroem nada — só atrasam o sábado." },
  { id: "p4", date: "2026-09-09", kind: "nutricao", text: "Calor · 6 de 6 — fecha o bloco, um dia adiantado" },
  { id: "p3", date: "2026-09-09", kind: "recovery", text: "Última massagem profunda antes de Paraty" },

  { id: "q1", date: "2026-09-10", kind: "corrida", text: "Ativação 40' com 5 × 1' em ritmo forte" },
  { id: "q2", date: "2026-09-10", kind: "superiores", text: "Superiores · Pull — 4 exercícios só", exercises: ["Barra fixa ou puxada alta — 4 × 8–10", "Remada curvada — 4 × 10", "Face pull — 3 × 15", "Rosca direta — 3 × 10–12 + drop set na última"] },
  { id: "q3", date: "2026-09-10", kind: "nutricao", text: "Calor · folga — só repõe se perdeu algum dia", why: "Bloco fechou ontem. Esta é a margem que não existia." },
  { id: "q4", date: "2026-09-10", kind: "recovery", text: "Ventosa 20'" },

  { id: "r1", date: "2026-09-11", kind: "corrida", text: "25–30' destravante conhecendo a cidade — bem fácil, sem cronômetro", why: "Poços de Caldas é ladeira em todo lugar: se pegar subida no caminho, sobe caminhando e desce solto. Isso é acordar a perna para sábado, não treinar." },
  { id: "r3", date: "2026-09-11", kind: "superiores", text: "Core + mobilidade — sem carga. NÃO é dia de repor o que faltou.", exercises: ["Prancha — 3 × 45s", "Pallof press — 3 × 12 cada lado", "Mobilidade de quadril e tornozelo — 10'"], why: "Ficaram para trás a esteira de segunda e a perna de quarta. As duas eram para CONSTRUIR, e construção leva semanas — fazer hoje não devolve nada e tira a perna de sábado. Volume perdido é perdido." },
  { id: "r4", date: "2026-09-11", kind: "nutricao", text: "Calor: não. Véspera de prova — você entra hidratado." },
  { id: "r2", date: "2026-09-11", kind: "recovery", text: "Gelo liberado a partir de hoje — 10'" },

  { id: "s1", date: "2026-09-12", kind: "chave", text: "WTR TERRAS VULCÂNICAS · 17 km / ~900 m" },
  { id: "s2", date: "2026-09-12", kind: "corrida", text: "Subida: teto de 142 bpm. Vai perder posição — é o exercício." },
  { id: "s3", date: "2026-09-12", kind: "corrida", text: "Descida: solta. 3º estímulo excêntrico do ciclo." },
  { id: "s4", date: "2026-09-12", kind: "nutricao", text: "80 g carbo/h. Acaba o déficit calórico — de amanhã, manutenção." },
  { id: "s5", date: "2026-09-12", kind: "superiores", text: "Academia · ombro, braço e core DEPOIS da prova — zero perna", exercises: ["Desenvolvimento com halteres — 3 × 10 · RPE 6", "Elevação lateral — 3 × 12", "Crucifixo inverso — 3 × 15", "Rosca alternada — 3 × 12", "Tríceps corda — 3 × 12", "Isometria: prancha — 3 × 45s"], why: "Academia todo dia, mas a perna já foi a prova: 16 km com 900 m. Puxada pesada também sai — as costas já trabalharam na subida. Fecha o rodízio: push terça, pull quinta, ombro e braço hoje." },

  { id: "t1", date: "2026-09-13", kind: "chave", text: "Longão em fadiga · 2h a 2h30 — 18 a 22 km com D+, aeróbico" },
  { id: "t2", date: "2026-09-13", kind: "chave", text: "REGRA: prova te esvaziou ontem? Hoje vira 50' e ponto" },
  { id: "t3", date: "2026-09-13", kind: "superiores", text: "Academia · core e mobilidade — zero perna, zero carga", exercises: ["Prancha — 3 × 45s", "Pallof press — 3 × 12 cada lado", "Elevação de pernas — 3 × 12", "Mobilidade de quadril e tornozelo — 10'"], why: "Prova ontem + longão hoje é a semana dupla inteira. Academia sim, perna não." },

  { id: "u1", date: "2026-09-14", kind: "corrida", text: "Off completo — você vem de prova + longão" },
  { id: "u2", date: "2026-09-14", kind: "superiores", text: "Academia · superiores leve + glúteo em ativação", exercises: ["Supino reto com halteres — 3 × 10 · RPE 6", "Puxada alta — 3 × 10", "Elevação lateral — 3 × 12", "Elevação pélvica — 3 × 12 leve, só ativação", "Cadeira abdutora — 3 × 15 leve", "Cadeira adutora — 3 × 15 leve", "Prancha — 3 × 45s"], why: "Off é de corrida, não de academia. Glúteo entra sem carga: a perna vem de prova + longão." },
  { id: "u3", date: "2026-09-14", kind: "recovery", text: "Massagem leve, drenagem" },

  { id: "v1", date: "2026-09-15", kind: "corrida", text: "40' com 6 × 30\" em ritmo de prova" },
  { id: "v2", date: "2026-09-15", kind: "superiores", text: "Superiores · Push leve — metade das séries, sem falha", exercises: ["Supino reto com halteres — 2 × 8–10 · RPE 6", "Desenvolvimento — 2 × 8–10 · RPE 6", "Elevação lateral — 2 × 12–15", "Tríceps corda — 2 × 12"] },
  { id: "v3", date: "2026-09-15", kind: "nutricao", text: "Manutenção · ~2.900 kcal" },
  { id: "v4", date: "2026-09-15", kind: "nutricao", text: "Calor · manutenção — 15'" },

  { id: "w1", date: "2026-09-16", kind: "corrida", text: "30' fácil" },
  { id: "w5", date: "2026-09-16", kind: "superiores", text: "Core leve + mobilidade 20' — sem carga" },
  { id: "w2", date: "2026-09-16", kind: "nutricao", text: "Carb load dia 1 · 7 g/kg = 530 g" },
  { id: "w3", date: "2026-09-16", kind: "nutricao", text: "Calor · manutenção final — 15'. Última do ciclo." },
  { id: "w4", date: "2026-09-16", kind: "recovery", text: "Bota 20'" },

  { id: "x1", date: "2026-09-17", kind: "corrida", text: "25' soltinho + 4 × 20\"" },
  { id: "x4", date: "2026-09-17", kind: "superiores", text: "Ativação leve 15' — elástico, glúteo, tornozelo" },
  { id: "x2", date: "2026-09-17", kind: "nutricao", text: "Carb load dia 2 · 9 g/kg = 685 g. Baixa fibra e gordura." },
  { id: "x3", date: "2026-09-17", kind: "recovery", text: "Gelo 10'" },

  { id: "y1", date: "2026-09-18", kind: "corrida", text: "20' destravante — ou off, se a viagem apertar" },
  { id: "y4", date: "2026-09-18", kind: "superiores", text: "Academia · ativação 15' — elástico e glúteo médio. Zero carga.", exercises: ["Abdução com elástico — 2 × 15 cada lado", "Adução isométrica com bola — 2 × 20s", "Elevação pélvica sem carga — 2 × 15", "Mobilidade de tornozelo — 5'"], why: "Isto é ativação, não treino: acorda glúteo médio e adutor, que estabilizam 3.295 m de descida amanhã." },
  { id: "y2", date: "2026-09-18", kind: "nutricao", text: "Carb load dia 3 · 10 g/kg = 760 g. Fibra mínima." },
  { id: "y3", date: "2026-09-18", kind: "chave", text: "Retirada de kit · mochila montada e pesada · 8h30 de sono" },

  { id: "dt0903", date: "2026-09-03", kind: "nutricao", text: "Dieta · dia DURO — 3.100 kcal · 458 g carbo · 225 g proteína · 38 g gordura", exercises: ["Café: 2 ovos + 3 claras + 2 pães + tapioca de 60 g de goma", "Almoço: 200 g frango + 420 g arroz + 150 g feijão", "Lanche: 1,5 dose de whey + 2 bananas + 200 g mamão", "Jantar: 180 g frango + 420 g arroz"] },

  { id: "dt0905", date: "2026-09-05", kind: "nutricao", text: "Dieta · dia MÉDIO — 2.550 kcal · 324 g carbo · 219 g proteína · 38 g gordura", exercises: ["Café: 2 ovos + 3 claras + 2 pães", "Almoço: 200 g frango + 330 g arroz + 150 g feijão", "Lanche: 1,5 dose de whey + 1 banana + 200 g mamão", "Jantar: 180 g frango + 330 g arroz"] },

  { id: "dt0908", date: "2026-09-08", kind: "nutricao", text: "Dieta · dia DURO — 3.100 kcal · 458 g carbo · 225 g proteína · 38 g gordura", exercises: ["Café: 2 ovos + 3 claras + 2 pães + tapioca de 60 g de goma", "Almoço: 200 g frango + 420 g arroz + 150 g feijão", "Lanche: 1,5 dose de whey + 2 bananas + 200 g mamão", "Jantar: 180 g frango + 420 g arroz"] },

  { id: "dt0912", date: "2026-09-12", kind: "nutricao", text: "Dieta · dia DURO — 3.100 kcal · 458 g carbo · 225 g proteína · 38 g gordura", exercises: ["Café: 2 ovos + 3 claras + 2 pães + tapioca de 60 g de goma", "Almoço: 200 g frango + 420 g arroz + 150 g feijão", "Lanche: 1,5 dose de whey + 2 bananas + 200 g mamão", "Jantar: 180 g frango + 420 g arroz"] },

  { id: "dt0913", date: "2026-09-13", kind: "nutricao", text: "Dieta · dia DURO — 3.100 kcal · 458 g carbo · 225 g proteína · 38 g gordura", exercises: ["Café: 2 ovos + 3 claras + 2 pães + tapioca de 60 g de goma", "Almoço: 200 g frango + 420 g arroz + 150 g feijão", "Lanche: 1,5 dose de whey + 2 bananas + 200 g mamão", "Jantar: 180 g frango + 420 g arroz"] },

  { id: "dt0902", date: "2026-09-02", kind: "nutricao", text: "Dieta · dia MÉDIO — 2.550 kcal · 324 g carbo · 219 g proteína · 38 g gordura", exercises: ["Café: 2 ovos + 3 claras + 2 pães", "Almoço: 200 g frango + 330 g arroz + 150 g feijão", "Lanche: 1,5 dose de whey + 1 banana + 200 g mamão", "Jantar: 180 g frango + 330 g arroz"] },

  { id: "dt0904", date: "2026-09-04", kind: "nutricao", text: "Dieta · dia MÉDIO — 2.550 kcal · 324 g carbo · 219 g proteína · 38 g gordura", exercises: ["Café: 2 ovos + 3 claras + 2 pães", "Almoço: 200 g frango + 330 g arroz + 150 g feijão", "Lanche: 1,5 dose de whey + 1 banana + 200 g mamão", "Jantar: 180 g frango + 330 g arroz"] },

  { id: "dt0906", date: "2026-09-06", kind: "nutricao", text: "Dieta · dia MÉDIO — 2.550 kcal · 324 g carbo · 219 g proteína · 38 g gordura", exercises: ["Café: 2 ovos + 3 claras + 2 pães", "Almoço: 200 g frango + 330 g arroz + 150 g feijão", "Lanche: 1,5 dose de whey + 1 banana + 200 g mamão", "Jantar: 180 g frango + 330 g arroz"] },

  { id: "dt0909", date: "2026-09-09", kind: "nutricao", text: "Dieta · dia MÉDIO — 2.550 kcal · 324 g carbo · 219 g proteína · 38 g gordura", exercises: ["Café: 2 ovos + 3 claras + 2 pães", "Almoço: 200 g frango + 330 g arroz + 150 g feijão", "Lanche: 1,5 dose de whey + 1 banana + 200 g mamão", "Jantar: 180 g frango + 330 g arroz"] },

  { id: "dt0910", date: "2026-09-10", kind: "nutricao", text: "Dieta · dia MÉDIO — 2.550 kcal · 324 g carbo · 219 g proteína · 38 g gordura", exercises: ["Café: 2 ovos + 3 claras + 2 pães", "Almoço: 200 g frango + 330 g arroz + 150 g feijão", "Lanche: 1,5 dose de whey + 1 banana + 200 g mamão", "Jantar: 180 g frango + 330 g arroz"] },

  { id: "dt0915", date: "2026-09-15", kind: "nutricao", text: "Dieta · dia MÉDIO — 2.550 kcal · 324 g carbo · 219 g proteína · 38 g gordura", exercises: ["Café: 2 ovos + 3 claras + 2 pães", "Almoço: 200 g frango + 330 g arroz + 150 g feijão", "Lanche: 1,5 dose de whey + 1 banana + 200 g mamão", "Jantar: 180 g frango + 330 g arroz"] },

  { id: "dt0907", date: "2026-09-07", kind: "nutricao", text: "Dieta · dia MÉDIO — 2.550 kcal · 324 g carbo · 219 g proteína · 38 g gordura", exercises: ["Café: 2 ovos + 3 claras + 2 pães", "Almoço: 200 g frango + 330 g arroz + 150 g feijão", "Lanche: 1,5 dose de whey + 1 banana + 200 g mamão", "Jantar: 180 g frango + 330 g arroz"], why: "Caiu de DURO: 1h45 de academia não gasta o que 4h de trilha gastariam." },

  { id: "dt0911", date: "2026-09-11", kind: "nutricao", text: "Dieta · dia LEVE — 2.170 kcal · 241 g carbo · 210 g proteína · 37 g gordura", exercises: ["Café: 2 ovos + 3 claras + 2 pães", "Almoço: 200 g frango + 250 g arroz + 100 g feijão", "Lanche: 1,5 dose de whey + 1 banana", "Jantar: 180 g frango + 220 g arroz"] },

  { id: "dt0914", date: "2026-09-14", kind: "nutricao", text: "Dieta · dia LEVE — 2.170 kcal · 241 g carbo · 210 g proteína · 37 g gordura", exercises: ["Café: 2 ovos + 3 claras + 2 pães", "Almoço: 200 g frango + 250 g arroz + 100 g feijão", "Lanche: 1,5 dose de whey + 1 banana", "Jantar: 180 g frango + 220 g arroz"] },

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
