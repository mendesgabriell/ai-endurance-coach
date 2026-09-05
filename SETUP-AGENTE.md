# Colocar o agente no ar

Cinco passos. Os que exigem você estão marcados. Nenhum segredo passa pelo Claude.

## 1 · Criar o bot — você, 5 min

No Telegram, procure `@BotFather`:

1. `/newbot`
2. Nome: `Macela Coach` · username: algo terminado em `bot`
3. Guarde o **token** que ele devolve
4. Abra conversa com o seu bot e mande `/start`
5. Abra no navegador, trocando `<TOKEN>`:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
   Procure `"chat":{"id":` — esse número é o seu **chat_id**

## 2 · Instalar e configurar local

```
npm install
cp .env.example .env
```

Preencha o `.env`. `TELEGRAM_WEBHOOK_SECRET` e `CRON_SECRET` são strings que você inventa
(use `openssl rand -hex 32`).

⚠️ **`DATABASE_URL` não é opcional.** Sem banco, `recentTurns()` devolve lista vazia e o
coach começa do zero a cada mensagem — ele responde, mas não lembra do que você disse há
dois minutos. Para ser conversa, o Supabase é pré-requisito, não bônus.

A chave da Claude sai de `console.anthropic.com`.

## 3 · Deploy na Vercel — você, 10 min

1. `git push` do repo pro GitHub
2. Vercel → *Add New · Project* → importe o repo → Deploy
3. *Settings → Environment Variables*: cole as mesmas variáveis do `.env`
4. Redeploy para as variáveis valerem

O cron das 05:00 BRT já está declarado no `vercel.json` (`0 8 * * *` em UTC).

**Dois limites do plano Hobby que valem saber:**
- Cron roda **1× por dia, no máximo** — cabe no nosso caso (só `/api/daily`), mas uma
  segunda mensagem (resumo da noite) exigiria o plano Pro.
- O disparo acontece **em qualquer minuto dentro da hora**: `0 8 * * *` pode cair entre
  08:00 e 08:59 UTC, ou seja, **entre 5h e 5h59 da manhã**. Precisão de minuto só no Pro.
- Timeout de função: **60 s** no Hobby. As rotas estão em 30 s e 60 s, então cabem — mas
  o webhook fica no limite. Se as respostas começarem a falhar, baixe o `effort` do coach
  em `src/coach/reply.ts` de `medium` para `low`.

## 4 · Registrar o webhook — você, 1 min

Uma vez só, trocando os três valores:

```
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "content-type: application/json" \
  -d '{"url":"https://SEU-APP.vercel.app/api/telegram","secret_token":"<TELEGRAM_WEBHOOK_SECRET>","allowed_updates":["message","callback_query"]}'
```

Confere com `https://api.telegram.org/bot<TOKEN>/getWebhookInfo`.

## 5 · Banco — obrigatório para a conversa

Projeto no Supabase, região **São Paulo** (ADR-0001 e `06-lgpd.md`). Cole a connection
string em `DATABASE_URL` e rode:

```
npm run db:push
```

---

## Testar

- No Telegram: `/hoje` devolve o treino do dia
- Qualquer texto livre vira conversa com o coach
- O cron: `curl -H "Authorization: Bearer <CRON_SECRET>" https://SEU-APP.vercel.app/api/daily`

## O que ele faz

| | |
|---|---|
| **05:00** | Manda o treino do dia com botões *Feito · Adaptei · Não rolou* |
| **Texto livre** | Vira conversa com o coach, que conhece o plano e o histórico da prova de 2025 |
| **Botão** | Registra o check-in; se não foi "Feito", pede o que rolou |

A mensagem diária é **determinística** — montada de `src/plan/plan.ts`, sem passar pelo
modelo. O LLM só entra na conversa. Isso mantém o ADR-0004 válido neste canal.

## Segurança

- Webhook validado por `secret_token`; quem não mandar o header certo recebe 200 silencioso
- Só o `TELEGRAM_CHAT_ID` configurado é atendido — webhook aberto chamando API paga é conta
  de terceiro
- Cron protegido por `CRON_SECRET`
- `.env` já está no `.gitignore`

## Onde mexer

| Quero | Arquivo |
|---|---|
| Mudar treino do plano | `src/plan/plan.ts` |
| Mudar o tom / as regras do coach | `src/coach/prompt.ts` |
| Mudar o formato da mensagem | `src/channels/telegram/format.ts` |
| Mudar o horário | `vercel.json` (UTC) |
