# ADR-0005 · Telegram como canal do atleta-zero

**Status:** Aceito · 2026-09-01

## Contexto

O `03-arquitetura.md` fixa **Meta WhatsApp Cloud API** como a camada de mensageria, e o
`02-escopo-mvp.md` lista "canal WhatsApp com mensagem diária das 7h" como item do núcleo
se o prazo permitir. Essa continua sendo a decisão certa para o produto.

Mas o `05-integracoes.md` já documenta o que o WhatsApp custa para começar:

- Business Verification da Meta exige CNPJ e leva de dias a semanas
- Mensagem proativa não é texto livre — é *template* aprovado previamente, por categoria
- A resposta do atleta abre uma janela de 24h; fora dela, só template
- Custo por conversa, com o item aberto de modelagem ainda em pé

A definição de pronto do MVP exige 21 dias consecutivos com o Gabriel como atleta-zero.
Nenhum desses 21 dias depende de aprovação da Meta — depende de existir um canal que
funcione hoje.

O contexto de uso também é assimétrico: **o atleta-zero é o operador do produto.** Ele é
o titular e o controlador dos próprios dados, o que remove desse canal específico o
capítulo de consentimento de terceiro do `06-lgpd.md`.

## Decisão

**Telegram é o canal do atleta-zero. WhatsApp continua sendo o canal do produto.**

A Camada 5 já trata canal como adaptador. `src/channels/telegram/` nasce ao lado do futuro
`src/channels/whatsapp/`, implementando a mesma superfície: `sendMessage`, botões de
check-in, recebimento de resposta livre.

Consequência de desenho que vem junto: **a mensagem diária é determinística**, montada do
plano em `src/plan/plan.ts`, sem passar pelo modelo. O LLM só entra na conversa livre.
Isso mantém o ADR-0004 válido no canal novo.

## Consequências

**Ganhos**
- Zero fila de aprovação. Token do BotFather em dois minutos, sem CNPJ
- Mensagem proativa ilimitada e em texto livre — sem template, sem janela de 24h
- Custo zero de mensageria; sobra só o custo de token da Claude API
- Botões inline e envio de foto (útil quando a camada de nutrição entrar)
- O loop mínimo do `02-escopo-mvp.md` roda em n=1 sem esperar terceiro

**Custos**
- Um canal a mais para manter quando o WhatsApp entrar. Mitigado pelo adaptador comum
- Telegram tem penetração baixa no Brasil — é canal de atleta-zero, não de produto.
  Nenhuma decisão de produto deve ser tomada a partir da experiência nele
- A superfície de webhook é pública. Protegida por `secret_token` no `setWebhook` mais
  allowlist de `chat_id`; um webhook aberto chamando uma API paga é conta de terceiro

**Reavaliar quando:** a Business Verification da Meta sair. O Telegram não morre nesse dia
— ele continua sendo o canal de desenvolvimento e de teste de mensagem nova antes de virar
template aprovado.

## Alternativas descartadas

**Esperar o WhatsApp.** Trava o atleta-zero atrás de uma fila de terceiro sem SLA
publicado. O MVP tem 90 dias e a prova-alvo tem data.

**SMS ou e-mail.** Sem botão, sem conversa fluida, sem foto. E-mail não é lido antes de
treinar às 5h da manhã.

**PWA com push.** Resolve a notificação e não resolve a conversa. Continua exigindo abrir
um app. O `02-escopo-mvp.md` já registra o PWA como alternativa de custo do WhatsApp, e ele
continua válido nesse papel — mas não substitui o canal conversacional.

**Bot do Telegram usando um MCP para ler wearable.** Não existe: conector MCP é sessão do
claude.ai, não credencial de servidor. A ingestão do agente depende da API da COROS, cuja
submissão ainda não saiu. Enquanto isso, a fonte de verdade da execução é o relato do
atleta pelo próprio canal — que é o que o `02-escopo-mvp.md` chama de "coletar feedback
de execução".
