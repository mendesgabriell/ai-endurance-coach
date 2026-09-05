# ADR-0004 · O LLM não decide o semáforo

**Status:** Aceito · 2026-08-24

## Contexto

O produto é "um coach de IA". A leitura ingênua disso é entregar todos os dados do atleta
ao modelo e pedir que ele decida o que fazer hoje. É o caminho mais rápido para um
protótipo que impressiona.

A decisão diária — Verde, Amarelo ou Vermelho — é o núcleo do produto e a coisa que o
atleta vai seguir com o próprio corpo.

## Decisão

**A decisão do dia é código determinístico.** O LLM recebe a decisão pronta e faz outra
coisa: traduz, replaneja dentro da restrição, e conversa.

Nenhum cálculo de carga, baseline de HRV, ACWR, CTL/ATL/TSB ou definição de status passa
pelo modelo.

## Fundamentação

- **Auditabilidade.** Quando o sistema manda descansar, é preciso poder dizer exatamente
  por quê — qual sinal, qual limiar, qual valor. `DailyReadiness.triggers` existe para isso.
  Uma explicação gerada depois do fato não é a razão da decisão.
- **Testabilidade.** Uma engine determinística roda contra anos de histórico em segundos.
  É assim que se valida o produto antes de existir usuário (`../07-roadmap.md`, Semana 3–4).
  Não há equivalente disso com um modelo no meio.
- **Custo e latência.** A decisão roda todo dia, para todo usuário, para sempre. Aritmética
  custa zero.
- **Segurança.** Um número alucinado aqui vira recomendação de treino errada para uma
  pessoa real. Cálculo não é tarefa para modelo de linguagem quando a fórmula é conhecida.
- **Consistência.** O mesmo dia com os mesmos dados precisa dar o mesmo resultado. Um
  atleta que recebe respostas diferentes para a mesma situação para de confiar.

## O que o LLM faz — e faz bem

1. **Traduz** `TSB −18, ACWR 1.42, lnRMSSD −1.3 SD` em linguagem humana que motiva em vez
   de assustar.
2. **Replaneja** a sessão de hoje dentro da restrição: dado o plano, o status, o calendário,
   o clima e a lesão, o que exatamente o atleta faz.
3. **Conversa** sobre o plano, responde dúvidas, ajusta o que precisa de julgamento.

## Guardrail

O status é **restrição dura** no prompt, e a saída estruturada é **validada em código**
antes de chegar ao atleta: dia Vermelho não pode produzir sessão com intensidade. Se a
saída violar a restrição, regenera com o erro como feedback.

Nunca confie na obediência do modelo para uma regra de segurança. A regra tem que ser
verificável fora dele.

## Consequências

- Mais código para escrever e manter do que "manda tudo pro modelo".
- Exige que a fisiologia esteja especificada de verdade (`../04-engine-decisao.md`), o que
  é trabalho — e é o trabalho certo.
- A qualidade do produto passa a depender dos limiares, não do modelo. Isso é bom:
  limiares se calibram com dados reais; comportamento de modelo, não.
- **O modelo vira substituível.** Se surgir algo melhor ou mais barato, troca-se a Camada 4
  sem tocar no núcleo. O produto não fica refém de um fornecedor de IA.
