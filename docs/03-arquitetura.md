# 03 · Arquitetura

## Princípio que governa tudo

Projeto solo. Cada serviço adicionado é um serviço que uma pessoa só precisa entender,
monitorar e consertar. **Menos peças, mais gerenciado, uma linguagem.**

Corolário: o produto não é um sistema distribuído. É um monolito TypeScript com jobs
duráveis. A complexidade fica no domínio (fisiologia, normalização), não na infra.

---

## Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Linguagem | **TypeScript** (única) | Um runtime, um sistema de tipos, do banco ao front |
| Web + API | **Next.js** (App Router) na **Vercel** | Front e back no mesmo repo, deploy sem ops |
| Banco | **Postgres via Supabase**, região São Paulo | Relacional + séries temporais em uma peça só. Dado de saúde fica em território nacional — simplifica muito o capítulo LGPD |
| Auth | **Supabase Auth** + RLS | Isolamento por atleta imposto no banco, não na aplicação |
| ORM / migrations | **Drizzle** | TypeScript-first, migrations versionadas em SQL legível |
| Jobs e agendamento | **Inngest** | Steps duráveis com retry automático. Webhooks de wearable falham e chegam fora de ordem — isso precisa ser resolvido pela infra, não por `try/catch` |
| Camada de coach | **Claude API** — `claude-opus-5` | Ver Camada 4 |
| Mensageria | **Meta WhatsApp Cloud API** (direto) | Sem BSP no início: menos intermediário, menos custo fixo |
| Observabilidade | **Sentry** + logs da Vercel | O mínimo que permite dormir |

### O que foi deliberadamente descartado

- **Microserviços** — resolve problema de time, e não há time
- **Python/FastAPI para a parte científica** — duas linguagens, dois deploys, duas
  cadeias de dependência. Os cálculos fisiológicos são aritmética sobre séries temporais;
  TypeScript dá conta
- **Kubernetes, Docker self-hosted, VPS** — ops que ninguém vai fazer
- **Banco de séries temporais dedicado** (Timescale, Influx) — Postgres com índice em
  `(athlete_id, recorded_at)` aguenta anos de dados de um volume de usuários que ainda não existe
- **App mobile nativo agora** — ver `02-escopo-mvp.md`

---

## As cinco camadas

### Camada 1 — Ingestão

Cada fornecedor entra por um **adaptador isolado**. Um adaptador tem uma responsabilidade
só: falar o dialeto do fornecedor e devolver payload bruto.

```
src/integrations/
  garmin/     oauth, webhooks, pull, tipos do fornecedor
  coros/
  oura/
  whoop/
  fit-file/   upload manual — o fallback que nunca depende de aprovação de ninguém
```

Regras:
- Payload bruto é **persistido como recebido** antes de qualquer processamento
  (`raw_payloads`). Quando a normalização tiver bug — e vai ter — o reprocessamento
  não exige pedir os dados de novo.
- Webhook chega, grava e responde 200 imediatamente. Processamento é assíncrono via Inngest.
- Nenhum adaptador conhece o modelo de domínio. Nenhuma parte do domínio conhece um adaptador.

### Camada 2 — Normalização canônica ⭐

**Esta é a barreira competitiva real.** Trate como tal.

Cinco fornecedores chamam de "HRV" cinco coisas diferentes:

| Fornecedor | O que reporta como HRV | Janela |
|---|---|---|
| Oura | RMSSD médio | Noite inteira de sono |
| WHOOP | RMSSD | Últimos momentos de sono de ondas lentas |
| Garmin | "HRV Status" — média noturna vs. baseline de 3 semanas | Noite, com escala própria |
| Apple Health | SDNN | Amostragem esporádica, tipicamente Breathe/vigília |
| COROS | Varia por dispositivo e firmware | — |

Comparar esses números diretamente é errado. Somá-los é pior. O modelo canônico precisa
guardar **valor, unidade, método de medição, janela e fornecedor** — e a lógica de decisão
precisa comparar cada atleta **contra o baseline dele mesmo naquele fornecedor**, nunca
contra um número absoluto nem entre fornecedores.

O mesmo vale para "sleep score", que é um índice proprietário e não comparável entre marcas.

Entidades canônicas:

```
athlete
athlete_profile        anamnese, zonas, objetivos
device_connection      fornecedor, tokens, escopos, status
raw_payload            imutável, append-only
sleep_record           duração, estágios, score normalizado + score original + fornecedor
hrv_record             valor, método (RMSSD/SDNN/lnRMSSD), janela, fornecedor
activity               esporte, duração, distância, D+, FC, pace/potência, carga calculada
daily_readiness        o output da Camada 3
training_plan          blocos, semanas, prova alvo
planned_session        o que era pra ser
executed_session       o que foi
injury_report          reportado pelo atleta
consent_record         LGPD — auditável, ver 06-lgpd.md
```

**Regra dura:** nada entra no domínio sem passar por aqui. Schema de fornecedor não vaza.

### Camada 3 — Engine de decisão (determinística)

Aritmética pura, sem I/O, sem LLM, 100% testável. Especificação completa em
[`04-engine-decisao.md`](04-engine-decisao.md).

Entrada: séries canônicas · Saída: `daily_readiness` com status, os números que o
produziram, e a razão de cada gatilho que disparou.

### Camada 4 — Coach (LLM)

O modelo **não decide o status do dia e não calcula nenhuma métrica**. Ele recebe a decisão
já tomada e faz três coisas que código não faz bem:

1. **Traduz** — de `TSB -18, ACWR 1.42, lnRMSSD -1.3 SD` para "você está acumulando
   fadiga mais rápido do que absorve; hoje segura"
2. **Replaneja** — dado o treino planejado, o status e as restrições (calendário, lesão,
   clima), produz a sessão de hoje
3. **Conversa** — responde perguntas do atleta sobre o próprio plano

**Configuração:**

- Modelo: `claude-opus-5`
- Thinking: `{ type: "adaptive" }` — replanejamento é raciocínio, não preenchimento de template
- `output_config.effort`: `medium` para a mensagem diária; `high` para replanejamento de bloco
- **Structured outputs** (`output_config.format`) para a sessão gerada — a saída vira
  registro no banco, não texto solto
- **Prompt caching** no prefixo estável (system prompt + metodologia + perfil do atleta).
  A parte volátil — números de hoje — vai depois do último breakpoint de cache
- Tool use para: ler histórico do atleta, consultar o plano, registrar a sessão gerada

**Por que o LLM não decide o semáforo:** auditabilidade (é preciso saber por que o sistema
mandou descansar), testabilidade (dá para rodar o motor contra anos de dados históricos),
custo (a decisão roda todo dia para todo usuário) e segurança (um número alucinado aqui vira
recomendação de treino errada). O LLM é a interface do sistema, não o cérebro dele.

**Guardrail:** o status do dia é uma **restrição dura** no prompt. Se o dia é Vermelho, o
modelo não tem permissão de propor intensidade — e a saída estruturada é validada contra
isso em código antes de chegar ao atleta. Nunca confie na obediência do modelo para uma
regra de segurança.

### Camada 5 — Interfaces

| Interface | Papel |
|---|---|
| **Web app** | Visão macro: calendário, periodização, tendências. Desktop first |
| **WhatsApp** | Interação diária. Mensagem das 7h, check-in, perguntas |
| **Relógio** | Execução. Treino sincronizado, atleta não abre nada. *Condicional a aprovação Garmin* |

---

## Fluxo diário

```
03:00  Inngest cron por atleta (fuso do atleta)
       ↓
       pull das fontes que não têm webhook + reprocessa payloads pendentes
       ↓
05:00  engine determinística calcula daily_readiness
       ↓
       LLM gera a sessão do dia (structured output) + a mensagem
       ↓
       validação em código: a sessão respeita o status?  → se não, regenera com feedback
       ↓
07:00  entrega no WhatsApp + disponível no web app
       ↓
       (se aprovado) push da sessão para o relógio
```

Cada seta é um step durável do Inngest: falha em uma etapa não perde as anteriores.

---

## Estrutura do repositório de código

```
src/
  integrations/     adaptadores por fornecedor (Camada 1)
  canonical/        modelo canônico + normalizadores (Camada 2)
  physiology/       carga, HRV baseline, ACWR, CTL/ATL/TSB (Camada 3) — puro, sem I/O
  readiness/        motor do semáforo (Camada 3)
  planning/         periodização, blocos, tapering
  coach/            prompts, tools, structured outputs (Camada 4)
  channels/         whatsapp, web (Camada 5)
  db/               schema Drizzle, migrations, RLS
app/                Next.js — rotas web e API
inngest/            definição dos jobs
tests/
  physiology/       fixtures com dados conhecidos — obrigatório
```

`physiology/` não importa nada de fora dele. Funções puras, entrada e saída de números.
É a parte do sistema que precisa estar certa.
