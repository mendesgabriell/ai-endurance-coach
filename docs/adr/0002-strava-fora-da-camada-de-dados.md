# ADR-0002 · Strava fora da camada de dados

**Status:** Aceito · 2026-08-24
**Dossiê completo:** [`../../pesquisa/strava-api-policy-2026.md`](../../pesquisa/strava-api-policy-2026.md)

## Contexto

O Documento Executivo v2.0 lista "Strava ✅" como fonte de dados **ativa** na Camada 1.
A Strava é a plataforma com maior penetração entre atletas amadores brasileiros, e a
premissa de que ela seria uma via de entrada de dados atravessa o documento inteiro.

A investigação da [API Policy 2026 da Strava](https://www.strava.com/legal/api_policy)
mostrou que essa premissa é insustentável.

## Decisão

**A Strava não será usada como fonte de dados.** Não via API, não via agregador, não via MCP.

## Fundamentação

Seis cláusulas independentes bloqueiam o produto. Não é uma restrição contornável — é o
desenho da política.

| Cláusula | Texto | Efeito |
|---|---|---|
| **5.3** | Proíbe usar dados "in connection with the development, training, evaluation, **or operation** of any AI Application", incluindo explicitamente "ingestion into a context window or working memory" | Um coach de IA que lê os dados viola o contrato. O "operation" cobre inferência, não só treino de modelo |
| **5.4** | "You may not **combine Strava Data with other customer data** for these or any other purposes" | A engine de correlação — que existe para cruzar treino com HRV e sono — é exatamente o que está proibido |
| **5.5** | Proíbe "Persistent Index" e acúmulo em corpus/base de dados | Impede manter histórico |
| **6.2** | Cache máximo de **7 dias** | CTL exige 42 dias e o baseline de HRV exige 60. Esta cláusula sozinha inviabiliza o produto |
| **6.1** | Só se pode exibir a um usuário os dados **dele mesmo** | Elimina o modo treinador multi-atleta |
| **5.16** | Proíbe agregadores, abstraction layers, proxies e MCP servers de terceiros | Fecha a via indireta: Terra, Spike e Rook também não resolvem |

A seção 3.5 confirma o fechamento: o Strava MCP é a única interface agent-mediated
autorizada, e é **exclusivamente para uso pessoal** — "not authorized for... any commercial
or third-party access".

Há ainda um risco adicional de conflito com a **5.2** (aplicações competitivas): a Strava
é dona da Runna, um app de planos de treino adaptativos. Um produto de coaching é
plausivelmente competitivo com ela.

## Consequências

**Negativas**
- Perde-se a fonte com maior penetração no público-alvo brasileiro.
- O onboarding fica mais atritado: "conecte seu Garmin" pede mais do usuário do que
  "conecte seu Strava".
- Atletas que só usam Strava (sem wearable conectado a outro serviço) não são atendidos.

**Positivas**
- A Strava nunca teve o dado que importa. HRV, sono, temperatura e recovery vêm de Garmin,
  Oura, WHOOP e COROS. A perda é de conveniência de onboarding, não de sinal.
- Elimina um risco existencial: construir sobre uma fonte que pode revogar o acesso a
  qualquer momento — como já fez com muitos apps.
- Força a arquitetura na direção certa desde o dia 1: integração direta com quem tem o
  dado fisiológico.

## Caminhos que permanecem abertos

1. **Escrita, não leitura.** Publicar a atividade concluída no Strava do atleta é um caso
   de uso distinto e comum. Continua sujeito ao mesmo contrato e ao risco da 5.2 — avaliar
   antes de implementar, e nunca como fonte de dados.
2. **Upload do próprio arquivo pelo atleta.** O atleta exportar os próprios dados da Strava
   e enviar ao produto é o titular exercendo portabilidade, não o produto usando a API.
   Caminho legítimo, mas com atrito alto. Baixa prioridade.

## Revisão

Reavaliar se a Strava publicar um programa de parceria comercial que licencie
explicitamente uso em aplicações de IA. Até lá, a decisão está fechada.
