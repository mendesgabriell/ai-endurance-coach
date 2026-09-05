# 04 · Engine de decisão — Verde / Amarelo / Vermelho

> Este é o núcleo do produto. É código determinístico, testado contra dados conhecidos,
> sem LLM em nenhum ponto. O documento executivo dá os limiares; aqui eles viram especificação.

## Princípio

Nenhuma métrica é comparada contra um valor absoluto ou contra outro atleta.
**Todo sinal é comparado contra o baseline do próprio atleta, no próprio fornecedor.**

Um HRV de 45ms não significa nada. Um HRV 1,3 desvios-padrão abaixo da faixa normal
daquele atleta significa muito.

---

## Sinais de entrada

### 1. HRV — `lnRMSSD`

O RMSSD bruto tem distribuição assimétrica e é ruidoso dia a dia. O padrão da literatura
(Kiviniemi, Plews) é usar o **logaritmo natural** e uma **média móvel**, não a leitura isolada.

```
lnRMSSD(d)        = ln(RMSSD(d))
lnRMSSD_7d(d)     = média móvel de 7 dias
baseline(d)       = média dos últimos 60 dias de lnRMSSD, excluindo a janela corrente
faixa_normal(d)   = baseline ± 1 desvio-padrão da janela de 60 dias
desvio(d)         = (lnRMSSD_7d(d) − baseline(d)) / SD_60d(d)     → em unidades de SD
```

**Decisões que isso força:**
- São necessários **≥ 30 dias** de dados antes do baseline valer alguma coisa.
  Durante o período de coleta o sistema opera em **modo aprendizado** e não emite Vermelho
  por HRV — só por carga e sono. Isso precisa estar explícito na UX do onboarding.
- Se o atleta troca de wearable, o baseline **reinicia**. Não se mistura fornecedor.

### 2. Sono

Score proprietário e não comparável entre marcas. Normalizar para 0–100 é uma
aproximação — guarde sempre o score original e o fornecedor junto.

Sinais usados: duração total, eficiência, score normalizado, e **débito de sono
acumulado em 7 dias** contra a necessidade declarada do atleta na anamnese.

### 3. Carga de treino

Uma métrica de carga por sessão, escolhida pelo dado disponível, em ordem de preferência:

| Se existe | Métrica | Nota |
|---|---|---|
| Potência (bike) + FTP | TSS | Padrão |
| Pace + limiar do atleta (corrida) | rTSS | Precisa do pace de limiar calibrado |
| Só FC + zonas do atleta | hrTSS / TRIMP (Banister) | Fallback confiável |
| Nada | duração × RPE | Último recurso, exige input do atleta |

⚠️ Trail e ultra distorcem qualquer métrica baseada em pace — 1km com 200m D+ não é 1km.
Corrigir por **elevação (GAP — grade adjusted pace)** antes de calcular carga. Sem isso, o
sistema vai subestimar sistematicamente a carga de quem treina em montanha, que é exatamente
o público-alvo.

### 4. Cargas agregadas

```
CTL(d) = CTL(d−1) + (carga(d) − CTL(d−1)) / 42     "fitness"  — EWMA 42 dias
ATL(d) = ATL(d−1) + (carga(d) − ATL(d−1)) / 7      "fadiga"   — EWMA 7 dias
TSB(d) = CTL(d−1) − ATL(d−1)                        "forma"
```

### 5. ACWR — razão carga aguda / crônica

```
aguda(d)   = EWMA 7 dias da carga diária
crônica(d) = EWMA 28 dias da carga diária
ACWR(d)    = aguda / crônica
```

Usar a variante **EWMA** (Williams et al., 2017), não a média móvel simples — a simples
trata a carga de 28 dias atrás com o mesmo peso da de ontem, o que é fisiologicamente falso.

⚠️ **Ressalva honesta:** o ACWR foi bastante criticado metodologicamente (Impellizzeri e
outros) quanto à sua capacidade de *prever* lesão. Ele entra aqui como **um sinal de
tendência de carga entre vários**, nunca como preditor isolado de lesão. O produto não deve
comunicar ao atleta que um ACWR alto significa que ele vai se lesionar.

### 6. Contexto não fisiológico

Calendário (compromissos fixos), lesão ativa reportada, viagem/fuso, e — quando aplicável —
fase do ciclo menstrual, em que o HRV naturalmente cai na fase lútea. Nesse caso o sistema
**ajusta a expectativa em vez de reduzir o treino**, que é o erro que a maioria dos apps comete.

---

## A regra do semáforo

Avaliada em ordem. **O primeiro gatilho que dispara define o status** — e o status mais
restritivo sempre vence.

### 🔴 Vermelho — descanso ativo

Qualquer um destes:

| Gatilho | Limiar |
|---|---|
| HRV | desvio ≤ −2,0 SD do baseline pessoal |
| Sono | score < 55 **ou** < 5h de duração |
| ACWR | > 1,5 |
| Lesão | lesão ativa reportada com dor em atividade |
| Doença | atleta reporta febre ou sintoma sistêmico |
| Sono acumulado | débito > 8h na janela de 7 dias |

**Saída:** Z1 até 30min ou descanso total, mais mobilidade. Intensidade proibida.

### 🟡 Amarelo — volume reduzido

Qualquer um destes, na ausência de gatilho vermelho:

| Gatilho | Limiar |
|---|---|
| HRV | desvio entre −2,0 e −1,0 SD |
| Sono | score 55–74 |
| ACWR | 1,3 – 1,5 |
| TSB | < −25 |
| Contexto | conflito de agenda que impede a sessão planejada |

**Saída:** volume reduzido ou sessão dividida em duas. Intensidade removida.

### 🟢 Verde — sessão completa

Nenhum gatilho amarelo ou vermelho ativo. Sessão do plano, integral.

### Regras de estabilidade

Sem elas o sistema vira um alarme e o atleta para de confiar:

1. **Histerese** — sair do Vermelho exige dois dias consecutivos de sinais em faixa normal.
2. **Teto de oscilação** — no máximo uma mudança de status por dia. Sem revisão às 14h.
3. **Modo aprendizado** — com menos de 30 dias de HRV, os gatilhos de HRV ficam inativos;
   o sistema decide por carga, sono e contexto, e **diz ao atleta que ainda está calibrando**.
4. **Override do atleta** — o atleta pode discordar e treinar assim mesmo. O sistema
   registra a discordância e o resultado. Esses são os dados mais valiosos do produto:
   é assim que se descobre se os limiares estão certos para aquela pessoa.

---

## Saída

```ts
type DailyReadiness = {
  athleteId: string
  date: string
  status: 'green' | 'yellow' | 'red'
  triggers: Array<{
    signal: 'hrv' | 'sleep' | 'acwr' | 'tsb' | 'injury' | 'illness' | 'context'
    value: number | string
    threshold: number | string
    severity: 'yellow' | 'red'
  }>
  metrics: { lnrmssdDeviation: number | null; sleepScore: number | null
             acwr: number | null; ctl: number; atl: number; tsb: number }
  confidence: 'learning' | 'partial' | 'full'   // depende de quantos dias de baseline existem
  computedAt: string
}
```

`triggers` é obrigatório e nunca vazio quando o status não é verde. É o que permite explicar
a decisão ao atleta, auditar o sistema e depurar um dia estranho seis meses depois.

`confidence` é o que impede o produto de soar confiante quando ainda não tem base para isso.

---

## Testes — não negociável

`src/physiology/` e `src/readiness/` só sobem com:

1. **Fixtures de dados conhecidos** — séries sintéticas onde CTL/ATL/TSB e ACWR têm valor
   calculado à mão, conferido.
2. **Casos de fronteira** — exatamente no limiar, um passo acima, um passo abaixo.
3. **Dados faltantes** — noite sem HRV, semana sem treino, atleta novo sem baseline.
   O sistema nunca pode quebrar nem inventar; deve degradar o `confidence`.
4. **Replay histórico** — rodar a engine contra o histórico real do atleta-zero e comparar
   o que ela teria decidido com o que de fato aconteceu.

O item 4 é o mais importante e o mais barato de fazer: assim que houver histórico exportado,
ele valida a engine inteira sem precisar de um único usuário.
