import type { Bloco, SemanaModelo, SessaoCorrida, SessaoForca } from "./ciclo-types";

/**
 * MODELO DO CICLO · Pedra do Baú
 *
 * Extraído de public/dash.html em 06/10/2026 por scripts/extrair-ciclo.mjs.
 * A partir daqui ESTE arquivo é a fonte: plan.ts expande ele em sessões
 * datadas. O ciclo abre na segunda 28/09/2026 e fecha na INDOMIT Pedra do Baú.
 */

export const INICIO = "2026-09-28";

export const BLOCOS: Bloco[] = [
  {
    "n": "Bloco 0",
    "nm": "Retomada",
    "dt": "29/09 – 18/10",
    "q": "Reconstruir a rotina de seis dias e aferir o estado atual. Teste de limiar na semana 2 e a WTR Campos do Jordão de 19 km na semana 3, corrida sem preparo específico."
  },
  {
    "n": "Bloco 1",
    "nm": "Base aeróbia",
    "dt": "19/10 – 13/12",
    "q": "Volume sobe em degraus de 10% com uma semana de descarga a cada quatro. Subida na esteira inclinada terça e quinta, independente de chuva. Fecha o ano lambendo os 88 km."
  },
  {
    "n": "Bloco 2",
    "nm": "Volume",
    "dt": "14/12 – 31/01",
    "q": "Cruza os 100 km pela primeira vez. O longão de trilha de sábado passa de 25 km e passa a ter D+ de prova."
  },
  {
    "n": "Bloco 3",
    "nm": "Específico",
    "dt": "01/02 – 07/03",
    "q": "Cem quilômetros sustentados. Longão com desnível de prova, ensaio de ritmo e de alimentação. É aqui que o Baú é decidido."
  },
  {
    "n": "Bloco 4",
    "nm": "Polimento",
    "dt": "08/03 – 20/03",
    "q": "Volume cai 40% e depois 70%. Nada de carga nova. Perna pesada sai da academia e entra o treino T no lugar."
  }
];

/** O abdominal muda por dia da semana — índice de Date.getDay(), domingo = 0. */
export const ABDOMINAL: string[] = [
  "Prancha — 3 × 60s",
  "Elevação de pernas suspenso — 3 × 12",
  "Pallof press — 3 × 12 cada lado",
  "Ab wheel — 3 × 10",
  "Prancha lateral — 3 × 45s cada",
  "Canivete — 3 × 15",
  "Dead bug — 3 × 12 cada"
];

/** Qual sessão de força cai em cada dia da semana. */
export const FORCA_DO_DIA: Record<string, string> = {
  "seg": "P1",
  "ter": "C1",
  "qua": "T1",
  "qui": "P2",
  "sex": "C2",
  "sáb": "BO",
  "dom": "T2"
};

export const DIAS: readonly string[] = ["seg","ter","qua","qui","sex","sáb","dom"];

/** Biblioteca de força, por código. */
export const FORCA: Record<string, SessaoForca> = {
  "P1": {
    "nome": "P1 · Perna, quadríceps",
    "sub": "perna quad",
    "tip": "Pirâmide nos dois primeiros: carga sobe, repetição cai. Isolador com carga fixa e drop na última. 17 séries, ~45 min.",
    "ex": [
      {
        "n": "Agachamento livre",
        "s": "4 × 12·10·8·6",
        "a": "Quadríceps, glúteo máximo, eretores da espinha",
        "nt": "Carga sobe a cada série. A última é RPE 9. Descanso 2 min."
      },
      {
        "n": "Leg press 45°",
        "s": "4 × 12·10·8·8",
        "a": "Vasto lateral, vasto medial, glúteo máximo",
        "nt": "Pé baixo e junto. Descanso 2 min."
      },
      {
        "n": "Cadeira extensora",
        "s": "3 × 12",
        "a": "Reto femoral, vastos",
        "nt": "Carga fixa, drop duplo na última. Descanso 75s."
      },
      {
        "n": "Panturrilha em pé",
        "s": "3 × 12",
        "a": "Gastrocnêmio",
        "nt": "Pausa de 1s no alongamento. Descanso 60s."
      },
      {
        "n": "Cadeira abdutora + adutora",
        "s": "3 × 15 cada",
        "maq": 1,
        "a": "Glúteo médio e mínimo, adutores",
        "nt": "Supersérie: emenda as duas sem descanso, 60s entre os pares. Tronco inclinado na abdutora."
      },
      {
        "n": "Abdominal do dia",
        "s": "3 séries",
        "a": "Reto abdominal, oblíquos, transverso"
      }
    ]
  },
  "P2": {
    "nome": "P2 · Perna, posterior e glúteo",
    "sub": "perna post.",
    "tip": "A lombar mora aqui, no terra romeno. 17 séries, ~45 min.",
    "ex": [
      {
        "n": "Levantamento terra romeno",
        "s": "4 × 12·10·8·6",
        "a": "Isquiotibiais, glúteo máximo, eretores da espinha",
        "nt": "Excêntrica de 3s. É o exercício de lombar com carga da semana. Descanso 2 min."
      },
      {
        "n": "Elevação pélvica com barra",
        "s": "4 × 12·10·8·8",
        "a": "Glúteo máximo",
        "nt": "Isometria de 2s no topo. Descanso 2 min."
      },
      {
        "n": "Mesa flexora",
        "s": "3 × 12",
        "a": "Bíceps femoral, semitendinoso",
        "nt": "Drop na última. Quadril colado no aparelho. Descanso 75s."
      },
      {
        "n": "Panturrilha sentada",
        "s": "3 × 15",
        "a": "Sóleo",
        "nt": "Joelho flexionado isola o sóleo. Descanso 60s."
      },
      {
        "n": "Cadeira abdutora + adutora",
        "s": "3 × 15 cada",
        "maq": 1,
        "a": "Glúteo médio e mínimo, adutores",
        "nt": "Supersérie, 60s entre os pares."
      },
      {
        "n": "Abdominal do dia",
        "s": "3 séries",
        "a": "Reto abdominal, oblíquos, transverso"
      }
    ]
  },
  "C1": {
    "nome": "C1 · Costas",
    "sub": "costas",
    "tip": "Duas puxadas, duas remadas, um adjacente. Nada de três remadas no mesmo dia. 17 séries.",
    "ex": [
      {
        "n": "Puxada articulada unilateral",
        "s": "4 × 12·10·8·6",
        "maq": 1,
        "a": "Latíssimo do dorso",
        "nt": "Um lado por vez. Carga sobe a cada série. Descanso 2 min."
      },
      {
        "n": "Remada articulada",
        "s": "4 × 12·10·8·6",
        "maq": 1,
        "a": "Latíssimo, romboides, trapézio médio",
        "nt": "É onde a carga bruta sobe sem a lombar ser o limite. Descanso 2 min."
      },
      {
        "n": "Barra fixa",
        "s": "3 × máximo",
        "a": "Latíssimo, redondo maior",
        "nt": "Passou de 12 limpas? Põe peso no cinto. Descanso 90s."
      },
      {
        "n": "Remada baixa",
        "s": "3 × 12",
        "a": "Trapézio médio, romboides",
        "nt": "Retração escapular completa no fim de cada repetição. Descanso 75s."
      },
      {
        "n": "Tríceps testa + corda",
        "s": "3 × 12",
        "a": "Tríceps, cabeça longa e lateral",
        "nt": "Adjacente. Entra aqui porque na remada o tríceps não trabalhou — chega descansado. Drop na corda."
      },
      {
        "n": "Abdominal do dia",
        "s": "3 séries",
        "a": "Reto abdominal, oblíquos, transverso"
      }
    ]
  },
  "C2": {
    "nome": "C2 · Costas",
    "sub": "costas",
    "tip": "Mesma estrutura do C1 com os ângulos trocados. É aqui que mora a variedade da semana. 17 séries.",
    "ex": [
      {
        "n": "Puxada aberta, pegada supinada",
        "s": "4 × 12·10·8·6",
        "a": "Latíssimo do dorso, bíceps",
        "nt": "A pegada supinada muda a linha de tração. Descanso 2 min."
      },
      {
        "n": "Remada curvada com barra",
        "s": "4 × 12·10·8·6",
        "a": "Romboides, trapézio médio, latíssimo",
        "nt": "Tronco a 45°. Descanso 2 min."
      },
      {
        "n": "Puxada articulada neutra",
        "s": "3 × 12",
        "maq": 1,
        "a": "Latíssimo, redondo maior",
        "nt": "Descanso 75s."
      },
      {
        "n": "Remada unilateral com halter",
        "s": "3 × 12 cada",
        "a": "Latíssimo, romboides",
        "nt": "Joelho no banco. Corrige assimetria. Descanso 75s."
      },
      {
        "n": "Rosca direta + martelo",
        "s": "3 × 12",
        "a": "Bíceps braquial, braquial, braquiorradial",
        "nt": "Adjacente. Já vem aquecido das puxadas. Sem balanço de tronco."
      },
      {
        "n": "Abdominal do dia",
        "s": "3 séries",
        "a": "Reto abdominal, oblíquos, transverso"
      }
    ]
  },
  "T1": {
    "nome": "T1 · Peito",
    "sub": "peito",
    "tip": "Dois supinos, um isolador, um de ombro, um adjacente. 17 séries.",
    "ex": [
      {
        "n": "Supino articulado",
        "s": "4 × 12·10·8·6",
        "maq": 1,
        "a": "Peitoral maior",
        "nt": "Abre pesado sem o estabilizador limitando. Descanso 2 min."
      },
      {
        "n": "Supino inclinado com halteres",
        "s": "4 × 12·10·8·8",
        "a": "Peitoral maior, porção clavicular",
        "nt": "É onde falta desenho no colo. Descanso 2 min."
      },
      {
        "n": "Crossover na polia alta",
        "s": "3 × 15",
        "a": "Peitoral maior, porção esternal",
        "nt": "Drop na última. Descanso 60s."
      },
      {
        "n": "Desenvolvimento militar em pé",
        "s": "3 × 10",
        "a": "Deltoide anterior e medial, tríceps",
        "nt": "Em pé, o core trabalha junto. Descanso 90s."
      },
      {
        "n": "Elevação lateral",
        "s": "3 × 15",
        "a": "Deltoide medial",
        "nt": "Adjacente. Carga fixa e execução limpa — pirâmide aqui vira balanço. É o que dá largura de ombro."
      },
      {
        "n": "Abdominal do dia",
        "s": "3 séries",
        "a": "Reto abdominal, oblíquos, transverso"
      }
    ]
  },
  "T2": {
    "nome": "T2 · Peito",
    "sub": "peito",
    "tip": "Barra livre no lugar da articulada, ângulos trocados. 17 séries.",
    "ex": [
      {
        "n": "Supino reto com barra",
        "s": "4 × 12·10·8·6",
        "a": "Peitoral maior, tríceps, deltoide anterior",
        "nt": "Carga sobe a cada série. Descanso 2 min."
      },
      {
        "n": "Supino inclinado articulado",
        "s": "4 × 12·10·8·8",
        "maq": 1,
        "a": "Peitoral maior, porção clavicular",
        "nt": "Descanso 2 min."
      },
      {
        "n": "Crucifixo inclinado com halteres",
        "s": "3 × 12",
        "a": "Peitoral maior, porção clavicular",
        "nt": "Amplitude completa, sem hiperextender o ombro embaixo. Descanso 75s."
      },
      {
        "n": "Desenvolvimento com halteres, sentado",
        "s": "3 × 10",
        "a": "Deltoide anterior e medial",
        "nt": "Descanso 90s."
      },
      {
        "n": "Crucifixo inverso",
        "s": "3 × 15",
        "a": "Deltoide posterior, trapézio",
        "nt": "Adjacente. A cabeça que quase todo mundo esquece e que arredonda o ombro de perfil."
      },
      {
        "n": "Abdominal do dia",
        "s": "3 séries",
        "a": "Reto abdominal, oblíquos, transverso"
      }
    ]
  },
  "BO": {
    "nome": "BO · Braço e ombro",
    "sub": "opcional",
    "tip": "Sábado, depois da trilha. É a sessão descartável: se chegou cansado ou a trilha foi longa, não faz. Nenhuma perna aqui.",
    "ex": [
      {
        "n": "Desenvolvimento militar",
        "s": "4 × 12·10·8·6",
        "a": "Deltoide anterior e medial, tríceps",
        "nt": "Descanso 2 min."
      },
      {
        "n": "Elevação lateral",
        "s": "4 × 15",
        "a": "Deltoide medial",
        "nt": "Carga fixa, drop na última. Descanso 60s."
      },
      {
        "n": "Rosca direta com barra",
        "s": "3 × 12·10·8",
        "a": "Bíceps braquial",
        "nt": "Sem balanço de tronco. Descanso 75s."
      },
      {
        "n": "Tríceps testa",
        "s": "3 × 12·10·8",
        "a": "Tríceps, cabeça longa",
        "nt": "Dois terços do volume do braço. Descanso 75s."
      },
      {
        "n": "Rosca martelo + tríceps corda",
        "s": "3 × 12",
        "a": "Braquial, braquiorradial, tríceps lateral",
        "nt": "Adjacente, em supersérie. Fecha o braço com sangue."
      },
      {
        "n": "Abdominal do dia",
        "s": "3 séries",
        "a": "Reto abdominal, oblíquos, transverso"
      }
    ]
  },
  "CP": {
    "nome": "CP · Costas e peito",
    "sub": "coringa",
    "tip": "O curinga de recuperar semana: quando um dia furou, esta sessão fecha os dois grupos de uma vez. Também entra na semana de prova, no lugar da perna.",
    "ex": [
      {
        "n": "Remada articulada",
        "s": "4 × 12·10·8·6",
        "maq": 1,
        "a": "Latíssimo, romboides, trapézio médio",
        "nt": "Descanso 2 min."
      },
      {
        "n": "Supino articulado",
        "s": "4 × 12·10·8·6",
        "maq": 1,
        "a": "Peitoral maior",
        "nt": "Descanso 2 min."
      },
      {
        "n": "Puxada aberta",
        "s": "3 × 12",
        "a": "Latíssimo do dorso",
        "nt": "Pegada larga, puxa até o peito. Descanso 75s."
      },
      {
        "n": "Crossover na polia alta",
        "s": "3 × 15",
        "a": "Peitoral maior, porção esternal",
        "nt": "Drop na última. Descanso 60s."
      },
      {
        "n": "Crucifixo inverso",
        "s": "3 × 15",
        "a": "Deltoide posterior, trapézio",
        "nt": "Adjacente."
      },
      {
        "n": "Abdominal do dia",
        "s": "3 séries",
        "a": "Reto abdominal, oblíquos, transverso"
      }
    ]
  }
};

/** Template de corrida por dia da semana, mais o teste de limiar. */
export const CORRIDA: Record<string, SessaoCorrida> = {
  "seg": {
    "dia": "Segunda",
    "n": "Rodagem base",
    "t": "rua",
    "loc": "rua · Ibirapuera",
    "obj": "Volume aeróbio em zona 2. É a sessão mais barata da semana: constrói base sem cobrar recuperação, e é ela que segura o total semanal quando o resto aperta.",
    "passos": [
      "<b>10' de trote progressivo</b> — FC subindo devagar até 130. Não comece no ritmo do treino.",
      "<b>Rodagem em zona 2</b> — FC 130 a 142, ritmo de conversar em frase inteira.",
      "<b>5' soltando</b> — FC caindo abaixo de 120.",
      "<b>4 educativos, 30 m cada</b> — skipping, anfersen, dribbling, passada."
    ],
    "presc": {
      "Bloco 0": "Contínuo, sem variação de ritmo",
      "Bloco 1": "Contínuo, últimos 10' mais firmes",
      "Bloco 2": "Contínuo + 6 × 20\" de passada no fim",
      "Bloco 3": "Contínuo + 8 × 20\" de passada no fim",
      "Bloco 4": "Contínuo, curto"
    },
    "reg": "<b>Se a FC passar de 142, anda.</b> Na semana de 28/09 dois terços do seu volume saíram acima desse teto — é isso que trava a base, não o volume."
  },
  "ter": {
    "dia": "Terça",
    "n": "Tiros em subida",
    "t": "esteira",
    "loc": "esteira · inclinação",
    "obj": "Potência de subida. Estímulo curto e forte, que recruta fibra rápida e ensina a perna a empurrar em rampa. É esta sessão, repetida por 25 semanas, que resolve o virar monstro de subida. Chuva não tem voto: é esteira.",
    "passos": [
      "<b>15' de aquecimento</b> — trote a 3%, FC até 135, mais 4 educativos.",
      "<b>Os tiros</b> — inclinação alta, forte. FC no topo de cada tiro até 160. <em>É estímulo, não rodagem em rampa.</em>",
      "<b>Recuperação completa entre os tiros</b> — caminhada a 1%, FC descendo de 130 antes do próximo.",
      "<b>10' soltando</b> a 1%."
    ],
    "presc": {
      "Bloco 0": "8 × 45\" a 10% · rec 90\"",
      "Bloco 1": "10 × 1' a 12% · rec 90\"",
      "Bloco 2": "10 × 1'30 a 12% · rec 90\"",
      "Bloco 3": "8 × 2' a 14% · rec 2'",
      "Bloco 4": "6 × 45\" a 10% · rec 90\""
    },
    "reg": "<b>Cadência acima de 175 nos tiros.</b> Passo curto e rápido sobe melhor que passada longa. Se a cadência cair, a inclinação está alta demais para hoje — baixa 2% e termina a série."
  },
  "qua": {
    "dia": "Quarta",
    "n": "Limiar",
    "t": "rua",
    "loc": "rua · Ibirapuera",
    "obj": "A sessão de qualidade em plano. Sobe o limiar, que é o que segura ritmo nas partes corríveis da prova — e é o que leva a meia para 1h40.",
    "passos": [
      "<b>15' de aquecimento</b> — trote progressivo mais 4 educativos.",
      "<b>Os blocos em limiar</b> — ritmo confortavelmente duro: dá para falar três ou quatro palavras, não uma frase.",
      "<b>Recuperação em trote leve</b>, não caminhada.",
      "<b>10' soltando.</b>"
    ],
    "presc": {
      "Bloco 0": "3 × 5' no limiar · rec 2'",
      "Bloco 1": "4 × 6' no limiar · rec 2'",
      "Bloco 2": "4 × 8' no limiar · rec 2'",
      "Bloco 3": "3 × 12' no limiar · rec 3'",
      "Bloco 4": "2 × 5' no limiar · rec 3'"
    },
    "reg": "<b>O número do limiar sai do teste.</b> Até ele acontecer, corre por sensação e me manda a FC que deu."
  },
  "qui": {
    "dia": "Quinta",
    "n": "Subida contínua",
    "t": "esteira",
    "loc": "esteira · inclinação",
    "obj": "Resistência de subida, não potência. É o ensaio do power hiking — a marcha forte que resolve as rampas longas que não dá para correr. Complementa os tiros de terça: uma dá potência, esta dá resistência.",
    "passos": [
      "<b>10' de aquecimento</b> — trote a 2%.",
      "<b>Bloco contínuo em inclinação alta</b> — caminhada forte ou trote, o que sustentar. FC teto de 145, sem picos.",
      "<b>Mão fora do corrimão.</b> <em>Segurar tira metade do trabalho e ensina o corpo errado.</em>",
      "<b>10' soltando</b> a 1%."
    ],
    "presc": {
      "Bloco 0": "20' contínuo a 12%",
      "Bloco 1": "30' contínuo a 12–15%",
      "Bloco 2": "45' contínuo a 15%, mochila de 4 kg",
      "Bloco 3": "60' contínuo a 15%, mochila de 6 kg",
      "Bloco 4": "20' a 10%, sem mochila"
    },
    "reg": "<b>A mochila entra no Bloco 2</b>, com o mesmo peso de água da prova. Antes disso o ombro e a lombar não estão prontos para carga em movimento repetido."
  },
  "sex": {
    "dia": "Sexta",
    "n": "Rodagem leve",
    "t": "rua",
    "loc": "rua · Ibirapuera",
    "obj": "Existe para o longão de sábado existir. Pernas soltas, sangue circulando, nada mais. É a sessão que a vontade manda acelerar e o plano manda segurar.",
    "passos": [
      "<b>Trote contínuo em zona 1 e 2</b> — FC teto de 135.",
      "<b>Nenhum bloco de ritmo.</b> <em>Nem no fim, nem só um pouquinho.</em>",
      "<b>4 educativos</b> no fim, se as pernas estiverem boas."
    ],
    "presc": {
      "Bloco 0": "Contínuo leve",
      "Bloco 1": "Contínuo leve",
      "Bloco 2": "Contínuo leve",
      "Bloco 3": "Contínuo leve",
      "Bloco 4": "Shakeout: 10 km a 130 bpm ou menos"
    },
    "reg": "<b>Na semana de prova esta sessão vira shakeout:</b> 10 km bem leves a 130 bpm."
  },
  "sáb": {
    "dia": "Sábado",
    "n": "Longão de trilha",
    "t": "trilha",
    "loc": "trilha",
    "obj": "O treino da semana. É a única sessão com terreno de verdade e a única em que a descida técnica é treinada — que é justamente o que o arquivo do Strava não mostra e o que a prova cobra.",
    "passos": [
      "<b>Ritmo de conversa do início ao fim.</b> Caminhar as subidas fortes é esperado, não é falha.",
      "<b>Descida técnica em atenção</b> — passo curto, olhar três metros à frente. <em>A descida é onde o quadríceps é destruído e onde o tempo é ganho.</em>",
      "<b>Comer a cada 40 min</b> a partir do Bloco 2, mesmo sem fome. É ensaio, não é necessidade do dia.",
      "<b>Beber por relógio, não por sede.</b> A quebra de 2025 foi desidratação e cãibra no km 23, não perna."
    ],
    "presc": {
      "Bloco 0": "Até 300 m de D+ · reconhecimento de terreno",
      "Bloco 1": "600 a 900 m de D+ · mochila entra vazia",
      "Bloco 2": "1000 a 1400 m de D+ · mochila completa",
      "Bloco 3": "1500 a 1800 m de D+ · desnível e duração de prova",
      "Bloco 4": "Sem D+ novo · terreno conhecido"
    },
    "reg": "<b>O VOTU fica a 40 km de casa e só dá em fim de semana — e nem sempre.</b> Quando o sábado não tiver trilha, a sessão vira o mesmo tempo em rua com o maior desnível que São Paulo der, e a quinta da semana seguinte ganha 15 min."
  },
  "dom": {
    "dia": "Domingo",
    "n": "Rodagem regenerativa",
    "t": "leve",
    "loc": "rua · leve",
    "obj": "Tirar o lixo das pernas do longão. É curta de propósito, e emenda com a força da manhã — as duas sessões de domingo são no mesmo bloco, antes do almoço.",
    "passos": [
      "<b>20 a 35' bem fácil</b> — FC teto de 130.",
      "<b>Se o sábado foi duro, anda.</b> <em>Caminhada de 30 min conta como a sessão.</em>",
      "<b>Força em seguida</b> — o T2, peito."
    ],
    "presc": {
      "Bloco 0": "20' fácil",
      "Bloco 1": "25 a 30' fácil",
      "Bloco 2": "30 a 35' fácil",
      "Bloco 3": "30 a 35' fácil",
      "Bloco 4": "20' fácil ou off"
    },
    "reg": "<b>Esta é a sessão que mais vale cortar</b> quando a semana passou do limite. Nenhuma das outras seis é negociável antes dela."
  },
  "teste": {
    "dia": "Teste",
    "n": "Teste de limiar",
    "t": "rua",
    "loc": "rua · piso plano",
    "obj": "Trinta minutos no máximo que você sustenta. A FC média dos últimos 20 minutos vira o seu limiar, e dela saem todas as zonas do ciclo. O teto de 142 que está em uso hoje foi derivado de uma prova de 12h30, não medido.",
    "passos": [
      "<b>15' de aquecimento</b> — trote progressivo mais 4 educativos. Chega no início do teste já quente.",
      "<b>30' no máximo sustentável</b> — o ritmo que você aguenta por trinta minutos e nem um a mais. Piso plano, sem subida, sem semáforo.",
      "<b>Começa conservador.</b> <em>É melhor acelerar nos últimos dez do que morrer aos vinte — um teste em que você quebra no meio não mede nada.</em>",
      "<b>10' soltando.</b>",
      "<b>Me manda a FC média dos últimos 20 minutos.</b> É esse número que vira o limiar e reescreve as zonas no dash."
    ],
    "presc": {
      "Bloco 0": "30' contrarrelógio em piso plano",
      "Bloco 1": "repetir para recalibrar",
      "Bloco 2": "repetir para recalibrar",
      "Bloco 3": "repetir para recalibrar",
      "Bloco 4": "não se faz em polimento"
    },
    "reg": "<b>Se o dia estiver ruim, adia para quinta — mas não faz pela metade.</b> Teste mal feito é pior que teste nenhum, porque as zonas do ciclo inteiro saem dele e o erro acompanha você até março. Não fazer depois de noite mal dormida."
  }
};

/** As 25 semanas: volume, bloco e o que cai em cada dia. */
export const SEMANAS: SemanaModelo[] = [
  {
    "n": "Sem 1",
    "dt": "28/09 – 04/10",
    "b": "Bloco 0",
    "km": 29,
    "tag": "realizada",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 3.8,
        "f": 1
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 4.5,
        "f": 1
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 5.1,
        "g": ""
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 7,
        "f": 1
      },
      {
        "d": "sex",
        "t": "esteira",
        "km": 7,
        "s": "ter",
        "f": 1,
        "g": "C"
      },
      {
        "d": "sáb",
        "t": "rua",
        "km": 14.3,
        "s": "seg",
        "g": "D"
      },
      {
        "d": "dom",
        "t": "trilha",
        "km": 9.7,
        "s": "sáb",
        "g": ""
      }
    ]
  },
  {
    "n": "Sem 2",
    "dt": "05 – 11/10",
    "b": "Bloco 0",
    "km": 42,
    "tag": "teste",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 6
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 6
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 8,
        "s": "teste"
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 5
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 3
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 10
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 4
      }
    ]
  },
  {
    "n": "Sem 3",
    "dt": "12 – 18/10",
    "b": "Bloco 0",
    "km": 45,
    "tag": "WTR",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 5.4
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 6.3
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 6.3
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 7.2
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 5.4
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 11.7
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 2.7
      }
    ]
  },
  {
    "n": "Sem 4",
    "dt": "19 – 25/10",
    "b": "Bloco 1",
    "km": 50,
    "tag": "",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 6
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 7
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 7
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 8
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 6
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 13
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 3
      }
    ]
  },
  {
    "n": "Sem 5",
    "dt": "26/10 – 01/11",
    "b": "Bloco 1",
    "km": 56,
    "tag": "",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 6.7
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 7.8
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 7.8
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 9
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 6.7
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 14.6
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 3.4
      }
    ]
  },
  {
    "n": "Sem 6",
    "dt": "02 – 08/11",
    "b": "Bloco 1",
    "km": 62,
    "tag": "",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 7.4
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 8.7
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 8.7
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 9.9
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 7.4
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 16.1
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 3.7
      }
    ]
  },
  {
    "n": "Sem 7",
    "dt": "09 – 15/11",
    "b": "Bloco 1",
    "km": 52,
    "tag": "desc",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 6.2
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 7.3
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 7.3
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 8.3
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 6.2
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 13.5
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 3.1
      }
    ]
  },
  {
    "n": "Sem 8",
    "dt": "16 – 22/11",
    "b": "Bloco 1",
    "km": 68,
    "tag": "",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 8.2
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 9.5
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 9.5
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 10.9
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 8.2
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 17.7
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 4.1
      }
    ]
  },
  {
    "n": "Sem 9",
    "dt": "23 – 29/11",
    "b": "Bloco 1",
    "km": 75,
    "tag": "",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 9
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 10.5
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 10.5
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 12
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 9
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 19.5
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 4.5
      }
    ]
  },
  {
    "n": "Sem 10",
    "dt": "30/11 – 06/12",
    "b": "Bloco 1",
    "km": 82,
    "tag": "",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 9.8
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 11.5
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 11.5
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 13.1
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 9.8
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 21.3
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 4.9
      }
    ]
  },
  {
    "n": "Sem 11",
    "dt": "07 – 13/12",
    "b": "Bloco 1",
    "km": 88,
    "tag": "88",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 10.6
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 12.3
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 12.3
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 14.1
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 10.6
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 22.9
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 5.3
      }
    ]
  },
  {
    "n": "Sem 12",
    "dt": "14 – 20/12",
    "b": "Bloco 2",
    "km": 90,
    "tag": "",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 10.8
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 12.6
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 12.6
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 14.4
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 10.8
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 23.4
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 5.4
      }
    ]
  },
  {
    "n": "Sem 13",
    "dt": "21 – 27/12",
    "b": "Bloco 2",
    "km": 70,
    "tag": "desc",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 8.4
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 9.8
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 9.8
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 11.2
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 8.4
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 18.2
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 4.2
      }
    ]
  },
  {
    "n": "Sem 14",
    "dt": "28/12 – 03/01",
    "b": "Bloco 2",
    "km": 92,
    "tag": "",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 11
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 12.9
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 12.9
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 14.7
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 11
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 23.9
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 5.5
      }
    ]
  },
  {
    "n": "Sem 15",
    "dt": "04 – 10/01",
    "b": "Bloco 2",
    "km": 96,
    "tag": "",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 11.5
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 13.4
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 13.4
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 15.4
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 11.5
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 25
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 5.8
      }
    ]
  },
  {
    "n": "Sem 16",
    "dt": "11 – 17/01",
    "b": "Bloco 2",
    "km": 100,
    "tag": "100",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 12
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 14
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 14
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 16
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 12
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 26
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 6
      }
    ]
  },
  {
    "n": "Sem 17",
    "dt": "18 – 24/01",
    "b": "Bloco 2",
    "km": 80,
    "tag": "desc",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 9.6
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 11.2
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 11.2
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 12.8
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 9.6
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 20.8
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 4.8
      }
    ]
  },
  {
    "n": "Sem 18",
    "dt": "25 – 31/01",
    "b": "Bloco 2",
    "km": 100,
    "tag": "",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 12
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 14
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 14
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 16
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 12
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 26
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 6
      }
    ]
  },
  {
    "n": "Sem 19",
    "dt": "01 – 07/02",
    "b": "Bloco 3",
    "km": 100,
    "tag": "",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 12
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 14
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 14
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 16
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 12
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 26
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 6
      }
    ]
  },
  {
    "n": "Sem 20",
    "dt": "08 – 14/02",
    "b": "Bloco 3",
    "km": 100,
    "tag": "",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 12
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 14
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 14
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 16
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 12
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 26
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 6
      }
    ]
  },
  {
    "n": "Sem 21",
    "dt": "15 – 21/02",
    "b": "Bloco 3",
    "km": 80,
    "tag": "desc",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 9.6
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 11.2
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 11.2
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 12.8
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 9.6
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 20.8
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 4.8
      }
    ]
  },
  {
    "n": "Sem 22",
    "dt": "22 – 28/02",
    "b": "Bloco 3",
    "km": 100,
    "tag": "",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 12
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 14
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 14
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 16
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 12
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 26
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 6
      }
    ]
  },
  {
    "n": "Sem 23",
    "dt": "01 – 07/03",
    "b": "Bloco 3",
    "km": 90,
    "tag": "",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 10.8
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 12.6
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 12.6
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 14.4
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 10.8
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 23.4
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 5.4
      }
    ]
  },
  {
    "n": "Sem 24",
    "dt": "08 – 14/03",
    "b": "Bloco 4",
    "km": 60,
    "tag": "",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 7.2
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 8.4
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 8.4
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 9.6
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 7.2
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 15.6
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 3.6
      }
    ]
  },
  {
    "n": "Sem 25",
    "dt": "15 – 18/03",
    "b": "Bloco 4",
    "km": 30,
    "tag": "BAU",
    "dias": [
      {
        "d": "seg",
        "t": "rua",
        "km": 3.6
      },
      {
        "d": "ter",
        "t": "esteira",
        "km": 4.2
      },
      {
        "d": "qua",
        "t": "rua",
        "km": 4.2
      },
      {
        "d": "qui",
        "t": "esteira",
        "km": 4.8
      },
      {
        "d": "sex",
        "t": "rua",
        "km": 3.6
      },
      {
        "d": "sáb",
        "t": "trilha",
        "km": 7.8
      },
      {
        "d": "dom",
        "t": "leve",
        "km": 1.8
      }
    ]
  }
];
