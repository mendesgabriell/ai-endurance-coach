# ADR-0003 · Integração direta com wearables, sem agregador

**Status:** Aceito · 2026-08-24

## Contexto

Existem agregadores de dados de wearables — Terra, Spike, Rook — que oferecem uma
integração única cobrindo dezenas de dispositivos, com normalização pronta. Para um
projeto solo com 90 dias, a economia de tempo aparente é grande.

## Decisão

**Integração direta com cada fornecedor.** Sem agregador no MVP.

## Fundamentação

1. **Não resolvem o gargalo.** O que trava o cronograma é a Training API da Garmin — a
   escrita do treino no relógio. Agregadores são fortes em leitura; escrita exige relação
   direta e aprovação própria de qualquer forma. O item mais lento continua lento.
2. **Terceirizam a barreira competitiva.** A normalização multi-wearable é o ativo
   defensável do produto (`../01-produto.md`). O que se compra pronto, o concorrente compra
   igual. O trabalho chato de fazer o HRV da Oura conversar com o HRV Status da Garmin
   *é* o produto.
3. **Custo por usuário desde o usuário zero**, num produto cujo unit economics ainda não
   fecha (ver `../05-integracoes.md` → WhatsApp).
4. **Não abrem a Strava.** A seção 5.16 da política da Strava proíbe expressamente
   abstraction layers e aggregators que re-exponham a API a terceiros. O maior atrativo
   da via indireta não existe.
5. **Uma dependência a mais entre você e o dado do atleta**, num produto cujo valor inteiro
   depende de o dado chegar.

## Consequências

**Negativas**
- Cada fornecedor novo é trabalho: OAuth, webhooks, normalização, testes.
- Um adaptador quebrado é problema seu, não de um fornecedor com SLA.

**Positivas**
- O modelo canônico é seu, e melhora a cada fornecedor integrado.
- Sem custo por usuário na camada de dados.
- Relação direta com Garmin e COROS — necessária de qualquer forma para escrita.

## Revisão

Reavaliar quando **ambos** forem verdade: houver mais de três fornecedores esperando na
fila de integração, **e** a manutenção dos adaptadores estiver consumindo mais tempo do que
o núcleo do produto. Nesse cenário, um agregador vira via de *cauda longa* — os
fornecedores principais seguem diretos, os raros entram pelo agregador.
