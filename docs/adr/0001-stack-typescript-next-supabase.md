# ADR-0001 · TypeScript + Next.js + Supabase + Inngest

**Status:** Aceito · 2026-08-24

## Contexto

Projeto solo: uma pessoa opera, o Claude Code escreve o código. O horizonte é um MVP em
90 dias com um usuário real (o próprio fundador) e depois um grupo fechado.

As cargas do sistema são: ingestão de webhooks e pulls agendados de wearables, cálculo
sobre séries temporais, chamadas a um LLM, uma web app e um canal de mensagem. Nenhuma
delas tem requisito de escala relevante nos próximos 12 meses.

O gargalo do projeto é **tempo e atenção de uma pessoa**, não throughput.

## Decisão

- **TypeScript** como linguagem única, do schema do banco ao front.
- **Next.js (App Router)** na **Vercel** — web e API no mesmo repositório e no mesmo deploy.
- **Supabase (Postgres) na região São Paulo** — banco, auth e storage numa peça só.
  A região importa: dado de saúde em território nacional simplifica o capítulo LGPD.
- **Drizzle** para schema e migrations.
- **Inngest** para jobs, cron e retries duráveis.
- **Sentry** para erros.

## Consequências

**Positivas**
- Um deploy, um runtime, um sistema de tipos. Sem serialização entre serviços, sem
  contratos duplicados, sem duas cadeias de dependência para manter.
- RLS do Postgres impõe isolamento por atleta no banco, e não na aplicação — o que é
  exatamente o que se quer quando o dado é sensível.
- Steps duráveis do Inngest resolvem no nível da infra o problema real da ingestão:
  webhooks de wearable falham, repetem e chegam fora de ordem.
- Zero ops. Nada de VPS, container ou cluster para manter.

**Negativas e como conviver**
- Ecossistema científico de TypeScript é mais pobre que o de Python. **Mitigação:** os
  cálculos necessários (EWMA, médias móveis, desvio-padrão, TRIMP) são aritmética sobre
  séries. Não há necessidade de scipy.
- Vercel + Supabase + Inngest são três fornecedores. **Mitigação:** os dados vivem em
  Postgres puro; migrar de Supabase é uma restauração de dump. Inngest é substituível por
  cron + fila.
- Vendor lock-in do Supabase Auth. Aceito conscientemente: o tempo economizado no MVP
  vale mais do que a portabilidade de auth.

## Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| **Python/FastAPI para a camada científica** | Duas linguagens, dois deploys, dois ambientes. O ganho científico não se materializa para as contas que este produto faz |
| **Microserviços** | Resolve problema de coordenação de time. Não há time |
| **VPS / Docker / Kubernetes** | Ops que ninguém vai fazer às 3h da manhã |
| **Banco de séries temporais dedicado** (Timescale, Influx) | Postgres com índice em `(athlete_id, recorded_at)` aguenta anos de dados no volume previsto. Uma peça a menos |
| **Supabase região US** | Latência melhor, LGPD pior. A conversa sobre dado sensível fica mais difícil sem ganho real |
| **Backend serverless puro** (só Edge Functions) | Limites de tempo de execução atrapalham backfill e reprocessamento |
