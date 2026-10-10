# ADR-0006 · Strava entra como fonte de leitura

## Contexto

A ADR-0002 tirou o Strava da camada de dados: o arquivo de treino vinha do
relógio pelo intervals.icu, e o Strava distorcia trilha técnica. Em outubro de
2026 o Gabriel decidiu que o fitness do painel é o do Strava ("eu quero um
espelho do Strava"), e que tênis, RPs e links dos treinos também vêm de lá.

## Decisão

O Strava passa a ser **fonte de leitura**, nunca de cálculo de plano:

- esforço relativo por atividade, do qual o painel recalcula fitness, fadiga e
  forma com o modelo do Strava (42 e 7 dias) em código determinístico;
- quilometragem e nomes dos tênis, séries de força, links das atividades,
  melhores tempos.

A leitura é feita pelo conector oficial do Strava no Claude, dentro da rotina
diária (`docs/08-rotinas-de-dados.md`), e gravada como retrato em
`src/prumo/estatico.json`. Não há chave do Strava na Vercel nem no `.env`.

O treino do dia, a carga e a prontidão continuam vindo do relógio pelo
intervals.icu (ADR-0002 segue valendo para o plano e para a auditoria).

## Consequências

- O retrato do Strava envelhece até a rotina rodar; o painel mostra a data.
- Um número do Strava que o conector não publica (o Fitness da própria
  plataforma) não entra: o painel mostra o que calcula e diz de onde veio.

## Alternativas descartadas

- API do Strava com token na Vercel: nova peça, segredo a mais, limites de
  taxa, e dependência de app registrado. O conector já resolve a leitura.
- Manter o Strava fora: contraria a decisão do atleta de olhar o número que
  ele já acompanha.
