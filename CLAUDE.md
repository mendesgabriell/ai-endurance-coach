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

Camada de coach usa a **Claude API** com `claude-opus-5` e adaptive thinking.
Detalhes, alternativas de custo e desenho do loop: `docs/03-arquitetura.md` → Camada 4.

## Decisões

Toda decisão de arquitetura que seja cara de reverter vira um ADR em `docs/adr/`,
numerado sequencialmente. Formato: Contexto → Decisão → Consequências → Alternativas descartadas.
