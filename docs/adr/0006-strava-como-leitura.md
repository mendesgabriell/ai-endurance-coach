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

A leitura é feita pela API oficial do Strava, com um app registrado pelo
atleta (OAuth, escopos de leitura) e tokens guardados na tabela
`integrations` do Supabase. A Vercel sincroniza sozinha a cada abertura da
página (quando a última leitura passou de 10 minutos) e o GitHub Actions
mantém a cadência da manhã. Nada roda no Claude; o modelo não vê os dados
passarem. Ver `docs/08-rotinas-de-dados.md`.

O treino do dia, a carga e a prontidão continuam vindo do relógio pelo
intervals.icu (ADR-0002 segue valendo para o plano e para a auditoria).

## Consequências

- O retrato do Strava envelhece até a rotina rodar; o painel mostra a data.
- Um número do Strava que o conector não publica (o Fitness da própria
  plataforma) não entra: o painel mostra o que calcula e diz de onde veio.

## Alternativas descartadas

- Conector do Strava dentro de sessões do Claude: funcionava, mas dependia
  do app aberto no Mac e gastava assinatura a cada leitura. O atleta pediu a
  rotina online, sem token. Descartado em 10/10/2026.
- Manter o Strava fora: contraria a decisão do atleta de olhar o número que
  ele já acompanha.
