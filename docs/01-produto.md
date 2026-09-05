# 01 · Produto

> Destilado do Documento Executivo v2.0 (junho/2026), com as premissas que não sobreviveram
> à investigação técnica marcadas explicitamente. O HTML original está em `executivo/`.

## A tese em uma frase

O coach que **age**, não o que informa.

Atletas de endurance têm dados no relógio, plano numa planilha, nutrição num app e sono em
outro — e ninguém conecta tudo para dizer o que fazer hoje, agora, considerando tudo ao mesmo
tempo. O produto lê todos os sinais e decide:

> "Hoje seu 20km vira 12km pela manhã + 8km à noite, porque seu HRV caiu 18% e você tem reunião às 7h."

## Para quem

**Primário — atleta direto.** Amador sério de endurance, Brasil e LATAM. Treina 6–15h/semana,
tem prova no calendário, usa wearable. 25–50 anos. Do primeiro 5km ao ultra de 500km.

**Secundário — treinadores e assessorias (H2).** Canal B2B. Um treinador com 30 alunos = 30
usuários. A IA assiste o treinador, não o substitui. Alto LTV, baixo CAC.

## O gap de mercado

| Concorrente | Ponto forte | Falha crítica |
|---|---|---|
| WHOOP Coach | HRV + sono | Preso ao hardware. Sem plano real. Sem endurance específico |
| Runna (Strava) | UX excelente, planos adaptativos | Só road running. Sem biométrica real. Sem força. Sem nutrição |
| Vert.run | Trail/ultra, Coros/Garmin | Sem IA conversacional. Sem HRV/sono. Sem força |
| athletedata | CTL/ATL/TSB, WhatsApp, envia pro relógio | Interface de engenheiro. Sem trail/ultra. Fora do Brasil |
| afasteryou | IA que age | Só triathlon. Muito técnico. Sem modo treinador |
| Future | Coach humano | US$250/mês. Não escala |

**O espaço vazio:** todos os esportes de endurance + multi-wearable + força integrada +
age em vez de informar + UX de classe mundial + PT/BR first.

## Os cinco pilares

1. **Coach de treino adaptativo** — plano periodizado por prova alvo, sem teto de distância.
   Endurance + força como plano único e coerente, desde o iniciante.
2. **Nutrição inteligente** — a lógica do *carbo de performance*: os 320kcal de gel ingeridos
   durante um 20km são combustível, não caloria do déficit. Nenhum app de nutrição faz essa
   distinção hoje.
3. **Race intelligence** — perfil de elevação, clima histórico, splits dos top finishers,
   pacing strategy por prova, periodização montada ao contrário a partir da data da prova A.
4. **Recovery e saúde** — mobilidade diária de 15min gerada por contexto, plano adaptado
   a lesão ativa, detecção de padrão pré-lesão.
5. **Plataforma de treinadores** (H2) — modo multi-atleta.

## O que torna o produto defensável

Em ordem de dificuldade de cópia:

1. **A camada de normalização multi-wearable.** Garmin, COROS, Oura, WHOOP e Apple Health
   chamam de "HRV" cinco coisas medidas de formas diferentes em janelas diferentes. Fazer
   esses sinais conversarem num modelo canônico é trabalho chato, invisível e difícil de
   replicar. É a barreira real. Ver `03-arquitetura.md` → Camada 2.
2. **A engine de correlação.** HRV × sono × carga × calendário × histórico de lesão, com
   zonas calibradas por atleta e não genéricas.
3. **Força + endurance num plano único.** Ninguém no mercado faz.
4. **Carbo de performance fora do déficit.** Lógica inédita, simples de descrever e difícil
   de acertar sem entender o atleta.
5. **PT/BR e WhatsApp.** Vantagem de canal e de contexto cultural, não de tecnologia.

O modelo de linguagem não é o diferencial — é commodity. Os itens 1 e 2 são.

## Premissas do documento executivo que não sobreviveram

| Premissa original | Status | Onde está a análise |
|---|---|---|
| "Strava ✅" como fonte de dados ativa | ❌ **Inviável** | `adr/0002`, `pesquisa/strava-api-policy-2026.md` |
| "Coros ✅" como fonte ativa | ⚠️ Depende de aprovação | `05-integracoes.md` |
| Envio de treino pro relógio no H1 | ⚠️ Gated em aprovação Garmin | `05-integracoes.md` |
| H1 com 16 entregas em 6 meses | ❌ Irreal | `02-escopo-mvp.md` |
| WhatsApp 7am sem custo modelado | ⚠️ Custo por conversa afeta o unit economics do Starter | `05-integracoes.md` |

## Modelo de receita (do documento executivo)

Freemium com conversão progressiva. Free (R$0, provas até 10km, 1 wearable) →
Starter (R$29/mês) → Pro (R$59/mês) → Elite (R$99/mês). B2B treinador a definir.

⚠️ **Pendente:** o custo variável por usuário (mensagens WhatsApp + tokens de LLM + APIs)
ainda não foi modelado contra o preço do Starter. Ver `07-roadmap.md` → Semana 3.
