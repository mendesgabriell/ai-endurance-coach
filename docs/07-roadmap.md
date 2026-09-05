# 07 · Roadmap — 12 semanas

Três trilhas em paralelo. A trilha **Fila** não depende de você depois da Semana 1 — por
isso ela vem primeiro. O erro clássico é começar pelo código e descobrir no mês 3 que a
aprovação da Garmin não saiu.

| Trilha | O que é |
|---|---|
| 🕐 **Fila** | Submissões e aprovações de terceiros. Lead time, não esforço |
| ⚙️ **Núcleo** | O loop mínimo do MVP |
| 📋 **Negócio** | Decisões que precisam de número, não de código |

---

### Semana 1 — desbloquear
- 🕐 Submeter Garmin (Activity + Wellness + Training API)
- 🕐 Submeter COROS API Application
- 🕐 Registrar apps Oura e WHOOP → credenciais na mão no mesmo dia
- 🕐 Iniciar Business Verification da Meta
- 🕐 Domínio, e-mail corporativo, política de privacidade publicada *(pré-requisito das submissões)*
- ⚙️ Repositório fora do iCloud, Next.js + Supabase (São Paulo) + Drizzle de pé
- ⚙️ Schema canônico inicial + RLS

### Semana 2 — primeiro dado real
- ⚙️ OAuth Oura **ou** WHOOP funcionando ponta a ponta
- ⚙️ Ingestão → `raw_payloads` → normalização → `sleep_record` / `hrv_record`
- ⚙️ Job Inngest de pull diário
- ⚙️ Upload manual de `.fit` como fallback que não depende de aprovação nenhuma
- 📋 Exportar o histórico completo do atleta-zero — é o que valida a engine sem usuário

### Semanas 3–4 — a engine
- ⚙️ `physiology/`: TRIMP/hrTSS, GAP para trail, CTL/ATL/TSB, ACWR EWMA
- ⚙️ Baseline de lnRMSSD com modo aprendizado
- ⚙️ Motor do semáforo + suíte de testes com fixtures conhecidas
- ⚙️ **Replay histórico**: rodar a engine contra o histórico do atleta-zero
- 📋 **Modelar custo variável por usuário** (WhatsApp + tokens + APIs) vs. preço do Starter

> **Marco 1 (fim da S4):** a engine decide o dia de hoje, sozinha, com dado real, e o
> replay histórico bate com o que de fato aconteceu.

### Semanas 5–6 — o plano
- ⚙️ Anamnese e onboarding com consentimento granular versionado
- ⚙️ Zonas calibradas por atleta
- ⚙️ Periodização por prova alvo: blocos montados ao contrário a partir da data
- ⚙️ Modelo de `planned_session` / `executed_session`

### Semanas 7–8 — o coach
- ⚙️ Camada Claude: geração da sessão do dia com structured output
- ⚙️ Validação em código de que a sessão respeita o status *(guardrail — não confiar no modelo)*
- ⚙️ Geração da mensagem diária
- ⚙️ Prompt caching + tools de leitura de histórico
- 🕐 *Se Garmin aprovou:* implementar push da sessão pro relógio

> **Marco 2 (fim da S8):** o sistema entrega um treino do dia, todo dia, sozinho.

### Semanas 9–10 — interface
- ⚙️ Web app: a tela de 3 segundos — status, treino de hoje, uma métrica
- ⚙️ Calendário e periodização
- ⚙️ Feedback de execução (fez? como foi? override?)
- ⚙️ WhatsApp: template das 7h + janela de 24h *(se a verificação da Meta saiu)*

### Semanas 11–12 — validar
- ⚙️ Exportação e exclusão de dados funcionando
- ⚙️ Sentry, alertas, tratamento de falha de ingestão
- 📋 **21 dias de operação contínua com o atleta-zero** — o critério de pronto de `02-escopo-mvp.md`
- 📋 Preparar o grupo fechado da Fase 1 (atletas de ponta e treinadores convidados)

> **Marco 3 (fim da S12):** MVP validado com um atleta real, pronto para o grupo fechado.

---

## Riscos e o que fazer se

| Risco | Probabilidade | Plano B |
|---|---|---|
| Garmin não aprova ou aprova com escopo restrito | Média | COROS como primária; upload `.fit` como universal; "envia pro relógio" sai da comunicação até existir |
| Nem Garmin nem COROS aprovam a tempo | Baixa | MVP roda com Oura/WHOOP + upload `.fit`. O loop continua provável |
| Business Verification da Meta demora | Média | Web + e-mail/PWA push no MVP; WhatsApp entra depois |
| Custo do WhatsApp não fecha no Starter | Média | WhatsApp vira benefício de plano pago; free usa push |
| Baseline de HRV exige 30 dias e atrasa a validação | **Alta — é certo** | Começar a coletar do atleta-zero na Semana 2, antes da engine existir |
| Escopo volta a inchar | Alta | `02-escopo-mvp.md` é o contrato. Item novo exige tirar outro |

## O que NÃO fazer nas 12 semanas

Nutrição. Race intelligence. Modo treinador. App mobile. Landing page bonita.
Segundo wearable antes do primeiro funcionar. Otimizar custo de LLM antes de existir usuário.
