# Instruções do projeto — AI Endurance Coach

## Contexto de trabalho

Projeto **solo**: o Gabriel é o operador e o atleta-zero; o Claude Code escreve o código.
Isso é uma restrição de design, não um detalhe: toda escolha técnica deve minimizar
o número de peças que uma pessoa só precisa manter acordada às 3h da manhã.

**Regra de ouro:** prefira menos serviços, mais gerenciado, uma linguagem só.
Se uma decisão adiciona um serviço novo ao stack, ela precisa de um ADR justificando.

## Idioma

Documentação, commits e conversa em **português**. Código, nomes de variáveis,
tabelas e chaves de API em **inglês**.

## Antes de escrever código

1. Leia `docs/02-escopo-mvp.md`. Se a tarefa não está no escopo dos 90 dias, pergunte antes.
2. Leia `docs/03-arquitetura.md` para saber onde a peça encaixa.
3. Se a tarefa toca dado de atleta, leia `docs/06-lgpd.md` primeiro. Não é opcional.

## Regras duras

- **Nunca** persistir dado de wearable sem passar pela camada de normalização canônica
  (`docs/03-arquitetura.md` → Camada 2). Schema de fornecedor não vaza para o domínio.
- **Nunca** deixar o LLM calcular carga, HRV baseline, ACWR, CTL/ATL/TSB ou decidir o
  semáforo do dia. Esses números são código determinístico e testado. Ver `docs/04-engine-decisao.md`.
- **Nunca** integrar Strava como fonte de dados. Ver `docs/adr/0002-strava-fora-da-camada-de-dados.md`.
- **Nunca** commitar `.env`, arquivos `.fit`/`.tcx`/`.gpx`, ou qualquer export de atleta real.
- Toda métrica fisiológica precisa de teste unitário com dados conhecidos antes de subir.

## Modelo de IA

A camada de coach roda **Claude Code headless** (`claude -p`) no Mac do Gabriel,
pelo worker em `scripts/worker.mjs` — gastando a **assinatura**, não a API por token.
Decisão de 06/09: ele não quer custo por token, nem como reserva.

Com o computador desligado, o bot responde **deterministicamente** a partir do plano:
comando, botão de check-in, registro de treino e pergunta sobre qualquer dia. Nada de
API paga como fallback.

O modelo **nunca** calcula métrica — ver a regra dura acima e `docs/adr/0004`.
As ferramentas que ele pode chamar estão em `src/coach/tools.ts` e são servidas
por `/api/bridge`.

## Fonte única do plano

`src/plan/plan.ts` é a **única** fonte do plano de treino. O artefato Calendário
Macela é gerado dele:

```
npx tsx scripts/build-calendar.ts <caminho-do-html>
```

**Nunca editar o array `SESS` do HTML na mão.** Em 05/09 o plano existia nos dois
lugares, o calendário mudou, o `plan.ts` não, e o bot mandou o treino errado para
o atleta. O gerador substitui só `SESS` e `WEEKS` — notas, CSS e o
`<script id="state">` com as marcações do atleta ficam intactos.

## Decisões

Toda decisão de arquitetura que seja cara de reverter vira um ADR em `docs/adr/`,
numerado sequencialmente. Formato: Contexto → Decisão → Consequências → Alternativas descartadas.
