# 05 · Integrações — status, bloqueios e lead time

> **A informação mais importante deste documento:** metade das integrações do H1 não é
> trabalho de engenharia, é fila de aprovação de terceiro. Se as submissões não saírem na
> Semana 1, o MVP não fecha — e não vai ser por falha de execução.

## Quadro geral

| Fonte | Acesso | Dado que importa | Push pro relógio | Ação |
|---|---|---|---|---|
| **Oura** | ✅ Imediato | HRV (RMSSD noturno), sono, temperatura | — | Registrar hoje |
| **WHOOP** | ✅ Imediato | HRV, sono, strain, recovery | — | Registrar hoje |
| **Arquivo .fit/.tcx** | ✅ Sem dependência | Sessão completa | — | Implementar como fallback |
| **Garmin** | ⏳ Aprovação | FC, GPS, sono, HRV Status, potência | ✅ Training API | **Submeter Semana 1** |
| **COROS** | ⏳ Aprovação | FC, GPS, treino estruturado | ✅ | **Submeter Semana 1** |
| **Apple Health** | ⚠️ Exige app iOS | HRV (SDNN), sono, workouts | — | H2 — depende do app mobile |
| **Strava** | ❌ **Proibido** | — | — | Não integrar. Ver ADR-0002 |
| **Polar / Suunto** | — | — | — | H2 |
| **TrainingPeaks** | — | — | — | H3 |

---

## Detalhamento

### Oura — liberado, comece por aqui
API v2 pública. Registro no portal do desenvolvedor libera o app na hora. O limite é
**10 usuários** até passar por review da Oura; para o atleta-zero e o grupo fechado inicial,
sobra. A submissão para ampliar o limite deve sair antes da Fase 1 do go-to-market.

Dá RMSSD médio da noite — que é exatamente o sinal que a engine precisa.

### WHOOP — liberado
Plataforma de desenvolvedor com OAuth aberta. Recovery, strain, sono e HRV.
Mesma lógica: registrar hoje, testar hoje.

### Garmin — o mais importante e o mais lento
Duas coisas separadas, e as duas exigem admissão no **Garmin Connect Developer Program**:

- **Activity / Wellness API** — leitura de treinos, sono e HRV Status
- **Training API** — publica treino no calendário do Garmin Connect, que sincroniza no
  relógio. **É isto que entrega o "envia treino pro relógio" do documento executivo.**

⚠️ Aprovação com escopo restrito é comum. Há relato público de apps aprovados **sem**
permissão de escrever sessões de força de volta no Connect como sessão reconhecida — o que
atinge diretamente o pilar "força + endurance integrados". Trate o escopo concedido como
incerto até ter a resposta na mão, e não prometa a funcionalidade ao usuário antes disso.

**Submeter na Semana 1.** Sem SLA de resposta publicado.

### COROS — aprovação, mas processo mais simples
Formulário de API Application no portal de suporte. OAuth 2.0 padrão. Exige dados da
empresa e as redirect URIs. Relevante para o público de trail/ultra, onde a COROS tem
penetração alta no Brasil.

**Submeter na Semana 1.**

### Apple Health — só com app nativo
Não existe API de servidor. O acesso ao HealthKit exige um app iOS instalado no aparelho.
Fica travado atrás da decisão de fazer o app mobile — H2, conforme `02-escopo-mvp.md`.

### Strava — ❌ fora
Proibido pela API Policy 2026 deles, em pelo menos seis cláusulas independentes.
Não há caminho: nem API direta, nem agregador, nem MCP.
Dossiê completo: [`../pesquisa/strava-api-policy-2026.md`](../pesquisa/strava-api-policy-2026.md).
Decisão: [`adr/0002-strava-fora-da-camada-de-dados.md`](adr/0002-strava-fora-da-camada-de-dados.md).

---

## Agregadores (Terra, Spike, Rook)

**A tentação:** uma integração só, dezenas de wearables, MVP mais rápido.

**Por que não, agora:**

1. **Não resolvem o gargalo.** O que trava o MVP é a Training API da Garmin (escrita no
   relógio). Agregadores são fortes em leitura; a escrita continua exigindo relação direta.
2. **Custo por usuário desde o usuário zero**, num produto cujo unit economics ainda não
   foi modelado.
3. **Terceirizam a barreira competitiva.** A normalização multi-wearable é o ativo
   defensável (`01-produto.md`). Comprar isso pronto é comprar a mesma coisa que o
   concorrente compra.
4. **Não dão acesso à Strava assim mesmo.** A seção 5.16 da política da Strava proíbe
   expressamente aggregators e abstraction layers que re-exponham a API a terceiros.

**Reavaliar quando:** houver mais de 3 fornecedores na fila e a normalização própria estiver
consumindo mais tempo do que o núcleo do produto. Registrado em
[`adr/0003-integracao-direta-vs-agregador.md`](adr/0003-integracao-direta-vs-agregador.md).

---

## WhatsApp — Meta Cloud API

O canal principal do produto, e o que tem mais pegadinha:

- **Business Verification** da Meta é pré-requisito e leva dias a semanas. Exige CNPJ e
  documentação da empresa. **Iniciar na Semana 1.**
- Mensagem proativa (a das 7h) **não** é mensagem livre: é *template message* que precisa
  ser aprovada previamente pela Meta, por categoria (utility/marketing). Isso limita o
  quanto a mensagem pode ser personalizada em texto livre.
- A resposta do atleta abre uma **janela de 24h** de conversa livre. Fora dela, só template.
- **Custo por conversa**, cobrado pela Meta. Categoria utility no Brasil é mais barata que
  marketing, mas não é zero.

⚠️ **Item aberto que precisa fechar antes do lançamento:** uma mensagem proativa por dia,
todo dia, por usuário, custa X. O plano Starter custa R$29/mês. Somando o custo de tokens
de LLM, é preciso saber se X + tokens cabe na margem — ou o canal principal do produto vira
o principal ralo de dinheiro. Modelagem na Semana 3 do roadmap.

**Alternativa se o custo não fechar:** notificação push do web app / PWA para o gratuito,
e WhatsApp como benefício dos planos pagos. É uma decisão de produto que depende do número.

---

## Checklist da Semana 1

- [ ] Registrar app no portal de desenvolvedor da **Oura** → obter client id/secret
- [ ] Registrar app no portal de desenvolvedor da **WHOOP** → obter client id/secret
- [ ] Submeter admissão ao **Garmin Connect Developer Program** (Activity + Wellness + Training API)
- [ ] Submeter **COROS API Application**
- [ ] Iniciar **Business Verification** da Meta para WhatsApp Cloud API
- [ ] Definir domínio e e-mail corporativo (várias submissões exigem)
- [ ] Publicar política de privacidade — **pré-requisito de várias submissões**, não item de compliance tardio
