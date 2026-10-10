# Rotinas de dados do painel

O painel (`/prumo`) mistura dado vivo com retratos. Esta página diz de onde vem
cada número, o que atualiza sozinho, o que uma rotina atualiza e o que depende
do Gabriel. Ver também `docs/03-arquitetura.md` e a ADR-0006.

## De onde vem cada coisa

| Dado | Fonte | Como chega ao painel | Atualiza |
|---|---|---|---|
| Treinos (km, carga, FC, D+) | COROS → intervals.icu | `/api/prumo` lê o intervals a cada abertura | sozinho, após o relógio sincronizar |
| HRV, FC de repouso, horas de sono | COROS → intervals.icu | idem | sozinho |
| Fitness, fadiga, forma (CTL/ATL) do intervals | intervals.icu | idem | sozinho |
| Plano, blocos, sessões | `src/plan/ciclo-bau.ts` | código, no deploy | a cada commit |
| Nota e fases do sono, deitou/levantou, faixa normal do HRV, VO₂max, limiar, previsões de prova | COROS (conector) | retrato em `src/prumo/estatico.json` | rotina diária |
| Esforço relativo por atividade, fitness do Strava, km dos tênis, séries de força | Strava (conector) | retrato em `src/prumo/estatico.json` | rotina diária |
| Comida, água, peso | MyFitnessPal → Apple Health → Health Auto Export | `POST /api/nutricao` | sozinho, depois da configuração no iPhone |
| Suplementação por treino | o atleta conta | ferramenta `suplementacao` da ponte, ou `POST /api/nutricao` | a cada treino |
| Clima esperado por prova | Open-Meteo, 2021–2025 | retrato | quando o calendário mudar |
| Traçados oficiais | tracedetrail (ITRA) | retrato | quando a organização mudar |

## O que roda sozinho

1. **Relógio → intervals.icu → painel.** O COROS sincroniza com o celular; o
   intervals.icu puxa do COROS; `/api/prumo` lê o intervals na hora. Sem
   sincronizar o relógio no celular, a leitura do dia não chega e a prontidão
   fica marcada como desatualizada (e não ajusta o treino).
2. **Vercel.** Todo push na `main` publica o site.

## A rotina diária: retrato do COROS e do Strava

Tarefa agendada no app Claude (`prumo-retrato-diario`), todo dia às 06:45,
enquanto o app estiver aberto no Mac. Ela:

1. lê no conector do COROS as últimas 14 noites, os 7 dias de HRV com a faixa
   normal, o VO₂max, o limiar e as previsões de prova;
2. lê no conector do Strava as atividades dos últimos 10 dias (esforço
   relativo, tênis, links), as séries de cada sessão de força e os km dos
   tênis usados no período;
3. grava os arquivos em `.prumo-refresh/` (fora do git) e roda
   `python3 scripts/prumo-refresh.py`, que valida, mescla e recalcula o
   fitness. O modelo transcreve; quem calcula é o script;
4. commita só `src/prumo/estatico.json` e dá push na branch e na `main`.

Se um conector falhar, a parte dele fica como estava. Se a validação falhar,
nada é gravado. A rotina nunca toca em `.env`.

## O que depende do Gabriel

- **Sincronizar o relógio** no app do COROS ao acordar. É o gatilho de tudo.
- **Não desligar a ligação COROS → intervals.icu.** O intervals saiu da
  interface, mas é o cano do dado vivo.
- **Chave do modo privado:** `PRUMO_CHAVE` nas variáveis da Vercel e a visita
  única a `/api/prumo/entrar?chave=…`.
- **Nutrição:** MyFitnessPal gravando no Apple Health e o Health Auto Export
  com a automação REST para `/api/nutricao` (header `Authorization: Bearer
  <PRUMO_CHAVE>`).
- **Suplementação:** depois do treino, dizer o que entrou.
- **Deixar o app Claude aberto no Mac** para a rotina diária rodar.

## Ainda não existe

- Aviso no Telegram quando a prontidão mudar o treino do dia.
- RPs de toda a vida e fotos oficiais dos tênis (dependem do Strava logado).
- Bioimpedância e exames de sangue no painel.
