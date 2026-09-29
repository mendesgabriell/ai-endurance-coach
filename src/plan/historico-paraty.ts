import type { PlannedSession } from "./types";

/**
 * Ciclo do UTMB Paraty 58K, encerrado em 19/09/2026. Fica aqui como histórico:
 * as marcações do atleta no calendário apontam para estes ids, e apagá-los
 * quebraria o registro do que foi feito. NÃO adicionar sessões novas aqui.
 */
export const HISTORICO_PARATY: PlannedSession[] = [
  { id: "a1", date: "2026-08-25", kind: "corrida", text: "Ladeira neuromuscular 45'", exercises: ["15' aquecimento", "8 × 20\" forte em 10–15%", "15' solto"] },
  { id: "a2", date: "2026-08-25", kind: "perna", text: "Perna · Força máxima", exercises: ["Agachamento — 5 × 5 · RPE 8", "Leg press — 4 × 8 pesado", "Afundo com halteres — 3 × 8 cada perna", "Cadeira extensora — 3 × 10 + drop set na última", "Mesa flexora — 3 × 10", "Panturrilha em pé — 4 × 8 pesado", "Panturrilha sentado (sóleo) — 3 × 12", "Isometria: agachamento na parede — 3 × 45s"] },
  { id: "a3", date: "2026-08-25", kind: "superiores", text: "Superiores · Push", exercises: ["Supino reto com halteres — 4 × 8–10", "Desenvolvimento — 4 × 8–10", "Supino inclinado — 3 × 10–12", "Elevação lateral — 3 × 12–15 + drop set na última", "Tríceps corda — 3 × 12 + drop set na última", "Tríceps testa — 3 × 10–12"] },

  { id: "b1", date: "2026-08-26", kind: "corrida", text: "Base 60' fácil — FC abaixo de 140" },
  { id: "b2", date: "2026-08-26", kind: "perna", text: "Perna · Excêntrico (60% do volume)", exercises: ["Agachamento — 4 × 6 · negativa de 4s", "Leg press — 4 × 6 · negativa de 5s", "Step-down com halteres — 4 × 8 cada perna · desce em 4s", "Extensora excêntrica — 3 × 8 · sobe com 2 pernas, desce com 1", "Mesa flexora — 3 × 8 · negativa de 4s", "Isometria: búlgaro parado embaixo — 3 × 30s cada perna"] },

  { id: "c0", date: "2026-08-27", kind: "chave", text: "Dorme primeiro — nada antes de 6h de sono" },
  { id: "c1", date: "2026-08-27", kind: "corrida", text: "Reativação 45–50' fácil — FC abaixo de 140", why: "3 dias sem correr e sem dormir não se resolve com volume." },
  { id: "c2", date: "2026-08-27", kind: "perna", text: "Perna · Força máxima — só se dormir 6h+", exercises: ["Agachamento — 5 × 5 · RPE 8", "Leg press — 4 × 8 pesado", "Afundo com halteres — 3 × 8 cada perna", "Cadeira extensora — 3 × 10 + drop set na última", "Mesa flexora — 3 × 10", "Panturrilha em pé — 4 × 8 pesado", "Panturrilha sentado (sóleo) — 3 × 12", "Isometria: agachamento na parede — 3 × 45s"] },

  { id: "d1", date: "2026-08-28", kind: "corrida", text: "Regenerativo 35–40' bem fácil" },
  { id: "d2", date: "2026-08-28", kind: "perna", text: "Perna · Estabilidade (metodologia antiga)", why: "Dia passado. Estabilidade saiu do plano em 04/09." },

  { id: "e1", date: "2026-08-29", kind: "chave", text: "VOTU · 15k + 10k — 23 km / 1.170 m · ~3h15" },
  { id: "e2", date: "2026-08-29", kind: "corrida", text: "1ª descida repetida — 4 descidas técnicas forçadas" },

  { id: "f1", date: "2026-08-30", kind: "corrida", text: "Fácil 50–60' em perna cansada" },
  { id: "f2", date: "2026-08-30", kind: "superiores", text: "Superiores · Ombro, braço e core", exercises: ["Desenvolvimento com halteres — 4 × 8–10", "Elevação lateral — 3 × 15 + drop set na última", "Elevação frontal — 3 × 12", "Crucifixo inverso — 3 × 15", "Rosca alternada — 3 × 12", "Tríceps banco — 3 × 15 + drop set na última", "Isometria: prancha — 3 × 45s", "Pallof press — 3 × 12 cada lado"] },

  { id: "g1", date: "2026-08-31", kind: "superiores", text: "Superiores · Push", exercises: ["Supino reto com halteres — 4 × 8–10", "Desenvolvimento — 4 × 8–10", "Supino inclinado — 3 × 10–12", "Elevação lateral — 3 × 12–15 + drop set na última", "Tríceps corda — 3 × 12 + drop set na última", "Tríceps testa — 3 × 10–12"], why: "Entrou no lugar da perna: 9.061 kg de perna no domingo." },
  { id: "g2", date: "2026-08-31", kind: "corrida", text: "Regenerativo 30–40' bem fácil" },

  { id: "h1", date: "2026-09-01", kind: "corrida", text: "ESTEIRA · subidas em limiar — ~1h", exercises: ["15' aquecimento", "5 × 4' a 8–12% de inclinação, FC 155–162", "recuperação 3' a 2% entre as séries", "10' solto"] },

  { id: "i1", date: "2026-09-02", kind: "corrida", text: "ESTEIRA · 30' fácil — FC abaixo de 140", why: "Cortado de 60' a pedido. Os 30' foram para quinta e domingo." },
  { id: "i2", date: "2026-09-02", kind: "perna", text: "Perna · Excêntrico", exercises: ["Agachamento — 4 × 6 · negativa de 4s", "Leg press — 4 × 6 · negativa de 5s", "Step-down com halteres — 4 × 8 cada perna · desce em 4s", "Extensora excêntrica — 3 × 8 · sobe com 2 pernas, desce com 1", "Mesa flexora — 3 × 8 · negativa de 4s", "Isometria: búlgaro parado embaixo — 3 × 30s cada perna"], why: "Único excêntrico da semana — esteira não faz declive negativo. Não pula." },
  { id: "i0", date: "2026-09-02", kind: "chave", text: "REGRA: posterior dolorido do 400 de ontem? Corta nórdico e afundo com déficit" },

  { id: "j1", date: "2026-09-03", kind: "chave", text: "ESTEIRA · power hiking longo — ~1h25", exercises: ["15' aquecimento", "4 × 8' caminhando forte a 15% (com bastões se tiver)", "recuperação 3' a 3% entre as séries", "15' corrida fácil (os 30' que vieram de quarta)", "10' solto"], why: "A Macela sobe 1.443 m em 13 km com trechos a 17–18%. Você vai caminhar boa parte." },
  { id: "j2", date: "2026-09-03", kind: "superiores", text: "Superiores · Pull", exercises: ["Barra fixa ou puxada alta — 4 × 8–10", "Remada curvada — 4 × 10", "Remada baixa — 3 × 10–12", "Face pull — 3 × 15", "Rosca direta — 3 × 10–12 + drop set na última", "Rosca martelo — 3 × 12"] },

  { id: "k1", date: "2026-09-04", kind: "corrida", text: "Regenerativo 40'" },
  { id: "k2", date: "2026-09-04", kind: "perna", text: "Academia: pulada — casa e mercado", why: "Sem prejuízo. Perna teve dia pesado na quarta e 689 m de subida na quinta." },
  { id: "k4", date: "2026-09-04", kind: "chave", text: "REGRA: perna pesada de sábado → se ainda estiver dolorido segunda de manhã, corta as repetições de descida e faz só o circuito" },

  { id: "l1", date: "2026-09-05", kind: "perna", text: "Perna · Força com foco em descida", exercises: ["Agachamento — 5 × 5 · RPE 8", "Leg press — 4 × 8 pesado", "Step-down no banco com halteres — 4 × 8 cada perna · desce em 3s", "Cadeira extensora — 3 × 10 + drop set duplo na última", "Panturrilha em pé — 4 × 8 pesado", "Panturrilha sentado (sóleo) — 3 × 12", "Isometria: agachamento na parede — 3 × 45s", "Isometria: panturrilha parada no degrau — 2 × 30s"], why: "Trilha saiu: descida técnica em pedra molhada 15 dias antes da prova é risco, não treino." },
  { id: "l8", date: "2026-09-05", kind: "corrida", text: "ESTEIRA · power hiking 50' — o desnível que a rua não dá", exercises: ["15' aquecimento", "4 × 7' caminhando forte a 12–15%", "recuperação 3' a 3% entre as séries", "5' solto"], why: "Uma esteira com inclinação vale mais que duas corridas planas." },

  { id: "m1", date: "2026-09-06", kind: "corrida", text: "Rodagem fácil 60–75' na rua — FC abaixo de 145", why: "Perna descansada para segunda. Se chover forte, esteira plana no mesmo tempo." },
  { id: "m2", date: "2026-09-06", kind: "superiores", text: "Superiores · Ombro, braço e core", exercises: ["Desenvolvimento com halteres — 4 × 8–10", "Elevação lateral — 3 × 15 + drop set na última", "Elevação frontal — 3 × 12", "Crucifixo inverso — 3 × 15", "Rosca alternada — 3 × 12", "Tríceps banco — 3 × 15 + drop set na última", "Isometria: prancha — 3 × 45s", "Pallof press — 3 × 12 cada lado"] },

  { id: "n5", date: "2026-09-07", kind: "chave", text: "ACADEMIA · esteira power hiking — 4 × 7' a 15%", exercises: ["12' aquecimento caminhando a 5%", "4 × 7' caminhando forte a 15% (bastões se tiver)", "recuperação 3' a 3% entre as séries", "5' solto"], why: "VOTU caiu por logística — fica a 40 km e o dia não fecha. A esteira dá a subida; a descida técnica não tem substituto e volta só em Paraty." },
  { id: "n6", date: "2026-09-07", kind: "perna", text: "Perna · Excêntrico + glúteo — LOGO DEPOIS da esteira, sem sentar", exercises: ["Agachamento — 4 × 6 · negativa de 4s", "Leg press — 4 × 6 · negativa de 5s", "Step-down no banco com halteres — 4 × 8 cada perna · desce em 4s", "Búlgaro — 3 × 8 cada perna · negativa de 3s", "Elevação pélvica (hip thrust) — 4 × 10 pesado", "Cadeira abdutora — 3 × 15 + drop set na última", "Cadeira adutora — 3 × 15 + drop set na última", "Abdução em pé no cabo — 3 × 15 cada lado", "Mesa flexora — 3 × 8 · negativa de 4s", "Panturrilha em pé — 3 × 10"], why: "A ordem não é negociável: esteira primeiro. Perna já cansada descendo carga é a réplica possível dos km 37–59. Se o tempo apertar, corta panturrilha e flexora — abdutora e adutora ficam." },

  { id: "o1", date: "2026-09-08", kind: "corrida", text: "Regenerativo 40' bem fácil — dia depois da trilha" },
  { id: "o2", date: "2026-09-08", kind: "superiores", text: "Superiores · Push — peito, ombro e tríceps", exercises: ["Supino reto com halteres — 4 × 8–10", "Desenvolvimento — 4 × 8–10", "Supino inclinado — 3 × 10–12", "Elevação lateral — 3 × 12–15 + drop set na última", "Tríceps corda — 3 × 12 + drop set na última", "Tríceps testa — 3 × 10–12"], why: "Último peito foi 31/08. Terça e quinta estavam as duas em costas, e o peito só voltaria em 15/09 — quinze dias. Push não disputa nada com a perna: é o volume mais barato do bloco." },

  { id: "p1", date: "2026-09-09", kind: "corrida", text: "Base 50' fácil — na ESTEIRA a 6–8% se der", why: "Mesmo tempo, mesmo esforço, ~250 m de ganho de graça. É assim que se compra desnível sem sessão nova." },
  { id: "p2", date: "2026-09-09", kind: "perna", text: "Perna · Moderado + glúteo — última carga de perna do ciclo", exercises: ["Agachamento — 3 × 6 · RPE 7, não vai à falha", "Leg press — 3 × 8", "Step-down no banco com halteres — 3 × 8 cada perna · desce em 3s", "Elevação pélvica (hip thrust) — 4 × 10 pesado", "Cadeira abdutora — 3 × 15 + drop set na última", "Cadeira adutora — 3 × 15 + drop set na última", "Abdução em pé no cabo — 3 × 15 cada lado", "Mesa flexora — 3 × 10", "Panturrilha em pé — 3 × 12"], why: "Moderado porque segunda foi pesado. Duas sessões pesadas em 48h a 10 dias da prova não constroem nada — só atrasam o sábado." },

  { id: "q1", date: "2026-09-10", kind: "corrida", text: "Ativação 40' com 5 × 1' em ritmo forte" },
  { id: "q2", date: "2026-09-10", kind: "superiores", text: "Superiores · Pull — 4 exercícios só", exercises: ["Barra fixa ou puxada alta — 4 × 8–10", "Remada curvada — 4 × 10", "Face pull — 3 × 15", "Rosca direta — 3 × 10–12 + drop set na última"] },

  { id: "r1", date: "2026-09-11", kind: "corrida", text: "25–30' destravante conhecendo a cidade — bem fácil, sem cronômetro", why: "Poços de Caldas é ladeira em todo lugar: se pegar subida no caminho, sobe caminhando e desce solto. Isso é acordar a perna para sábado, não treinar." },
  { id: "r3", date: "2026-09-11", kind: "superiores", text: "Core + mobilidade — sem carga. NÃO é dia de repor o que faltou.", exercises: ["Prancha — 3 × 45s", "Pallof press — 3 × 12 cada lado", "Mobilidade de quadril e tornozelo — 10'"], why: "Ficaram para trás a esteira de segunda e a perna de quarta. As duas eram para CONSTRUIR, e construção leva semanas — fazer hoje não devolve nada e tira a perna de sábado. Volume perdido é perdido." },

  { id: "s1", date: "2026-09-12", kind: "chave", text: "WTR TERRAS VULCÂNICAS · 17 km / ~900 m" },
  { id: "s2", date: "2026-09-12", kind: "corrida", text: "Subida: teto de 142 bpm. Vai perder posição — é o exercício." },
  { id: "s3", date: "2026-09-12", kind: "corrida", text: "Descida: solta. 3º estímulo excêntrico do ciclo." },
  { id: "s5", date: "2026-09-12", kind: "superiores", text: "Academia · ombro, braço e core DEPOIS da prova — zero perna", exercises: ["Desenvolvimento com halteres — 3 × 10 · RPE 6", "Elevação lateral — 3 × 12", "Crucifixo inverso — 3 × 15", "Rosca alternada — 3 × 12", "Tríceps corda — 3 × 12", "Isometria: prancha — 3 × 45s"], why: "Academia todo dia, mas a perna já foi a prova: 16 km com 900 m. Puxada pesada também sai — as costas já trabalharam na subida. Fecha o rodízio: push terça, pull quinta, ombro e braço hoje." },

  { id: "t1", date: "2026-09-13", kind: "chave", text: "Longão em fadiga · 2h a 2h30 — 18 a 22 km com D+, aeróbico" },
  { id: "t2", date: "2026-09-13", kind: "chave", text: "REGRA: prova te esvaziou ontem? Hoje vira 50' e ponto" },
  { id: "t3", date: "2026-09-13", kind: "superiores", text: "Academia · core e mobilidade — zero perna, zero carga", exercises: ["Prancha — 3 × 45s", "Pallof press — 3 × 12 cada lado", "Elevação de pernas — 3 × 12", "Mobilidade de quadril e tornozelo — 10'"], why: "Prova ontem + longão hoje é a semana dupla inteira. Academia sim, perna não." },

  { id: "u1", date: "2026-09-14", kind: "corrida", text: "Off de corrida — academia sim", why: "O longão de domingo não aconteceu, então você está mais descansado do que este dia previa. Isso não é problema a 5 dias: treino acabou, o que constrói agora é dormir." },
  { id: "u2", date: "2026-09-14", kind: "superiores", text: "Academia · superiores leve + glúteo em ativação", exercises: ["Supino reto com halteres — 3 × 10 · RPE 6", "Puxada alta — 3 × 10", "Elevação lateral — 3 × 12", "Elevação pélvica — 3 × 12 leve, só ativação", "Cadeira abdutora — 3 × 15 leve", "Cadeira adutora — 3 × 15 leve", "Prancha — 3 × 45s"], why: "Off é de corrida, não de academia. Glúteo entra sem carga: a perna vem de prova + longão." },

  { id: "v1", date: "2026-09-15", kind: "corrida", text: "Ativação ~35' — 6 tiros curtos", exercises: ["1 · AQUECE — 12' de trote bem fácil. FC abaixo de 140. Se estiver passando, anda.", "2 · TIRO 1 — 30\" forte, em ritmo de prova de rua. Não é sprint.", "3 · Recupera — 90\" de trote bem lento ou caminhada, até a respiração normalizar.", "4 · TIRO 2 — 30\" forte. Mesma coisa.", "5 · Recupera — 90\".", "6 · TIRO 3 — 30\" forte.", "7 · Recupera — 90\".", "8 · TIRO 4 — 30\" forte.", "9 · Recupera — 90\".", "10 · TIRO 5 — 30\" forte.", "11 · Recupera — 90\".", "12 · TIRO 6 — 30\" forte. Último.", "13 · DESAQUECE — 10' de trote solto e devagar. Acabou."], why: "Os tiros existem para a perna não dormir no polimento. São curtos de propósito: 30 segundos não gera fadiga nenhuma, só lembra o corpo de como é ir rápido." },
  { id: "v2", date: "2026-09-15", kind: "superiores", text: "Superiores · Push leve — metade das séries, sem falha. PERNA PESADA: NÃO.", exercises: ["Supino reto com halteres — 2 × 8–10 · RPE 6", "Desenvolvimento — 2 × 8–10 · RPE 6", "Elevação lateral — 2 × 12–15", "Tríceps corda — 2 × 12"], why: "Perna pesada a 4 dias da prova não constrói nada — adaptação leva 10 a 14 dias — e a dor muscular tardia bate justamente na quinta e sexta. A última perna pesada foi 07/09, 8,4 t: essa é a boa despedida." },

  { id: "w1", date: "2026-09-16", kind: "corrida", text: "30' com TETO DE 142 BPM — o ensaio da regra de sábado", exercises: ["0 · ANTES DE SAIR — põe a FC na tela principal do relógio. Se não estiver lá, muda agora.", "1 · AQUECE — 5' caminhando rápido. Deixa a FC subir sozinha, sem correr ainda.", "2 · CORRE — 25' de trote, olhando o relógio.", "3 · A REGRA: passou de 142, você ANDA até voltar para 135. Depois volta a trotar.", "4 · Vai passar várias vezes no começo. É normal e é o exercício.", "5 · Não tem desaquecimento: você já esteve fácil o tempo inteiro."], why: "Na Terras Vulcânicas você correu a FC média de 153, máxima de 168 — 91% do teto, o mesmo número de 2025. O teto de 142 nunca foi ensaiado. Esta é a última chance de sentir no corpo o quanto isso é devagar, antes de precisar dele por 3 horas sob adrenalina." },
  { id: "w5", date: "2026-09-16", kind: "superiores", text: "Core leve + mobilidade 20' — sem carga" },

  { id: "x1", date: "2026-09-17", kind: "corrida", text: "Soltinho ~25' — 4 toques de ritmo", exercises: ["1 · AQUECE — 10' de trote bem fácil e solto. Sem pressa.", "2 · TIRO 1 — 20\" rápido e leve. Passada solta, não é força.", "3 · Recupera — 60\" caminhando.", "4 · TIRO 2 — 20\" rápido e leve.", "5 · Recupera — 60\" caminhando.", "6 · TIRO 3 — 20\" rápido e leve.", "7 · Recupera — 60\" caminhando.", "8 · TIRO 4 — 20\" rápido e leve. Último.", "9 · DESAQUECE — 8 a 10' de trote bem devagar."], why: "Vinte segundos é curto demais para cansar. Serve para a passada não ficar pesada depois de dias fáceis — é manutenção de coordenação, não treino." },
  { id: "x4", date: "2026-09-17", kind: "superiores", text: "Ativação leve 15' — elástico, glúteo, tornozelo" },

  { id: "y1", date: "2026-09-18", kind: "corrida", text: "Dois shakeout runs — ~10 km somados, TETO DE 130 BPM", exercises: ["1 · SHAKEOUT 1 — 5 km de trote bem leve, dá para conversar. Teto de 130 bpm.", "2 · Entre um e outro: come, bebe e senta. NÃO emenda os dois.", "3 · SHAKEOUT 2 — 5 km. Mesma coisa, ainda mais leve se a perna pedir.", "4 · Passou de 130 em qualquer momento? Anda. Sem exceção.", "5 · Se o segundo parecer demais na hora, corta pela metade e para. Ninguém ganha prova na véspera."], why: "Dez quilômetros na véspera de 58K só não atrapalha porque é a 130 bpm — isso é caminhada rápida com passada de corrida. O risco não é a distância, é o ritmo subir no meio do grupo. O teto vale mais que a quilometragem." },
  { id: "y4", date: "2026-09-18", kind: "superiores", text: "Academia · ativação 15' — elástico e glúteo médio. Zero carga.", exercises: ["Abdução com elástico — 2 × 15 cada lado", "Adução isométrica com bola — 2 × 20s", "Elevação pélvica sem carga — 2 × 15", "Mobilidade de tornozelo — 5'"], why: "Isto é ativação, não treino: acorda glúteo médio e adutor, que estabilizam 3.295 m de descida amanhã." },
  { id: "y3", date: "2026-09-18", kind: "chave", text: "Retirada de kit · mochila montada e pesada · 8h30 de sono" },

  { id: "z1", date: "2026-09-19", kind: "chave", text: "UTMB PARATY 58K — teto de 142 bpm nas primeiras 3 horas. Sem exceção." },
];
