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

## A rotina online: GitHub Actions + Vercel, sem o Claude no meio

Nada roda no app Claude nem gasta token. Duas peças:

1. **`/api/prumo` sincroniza sozinho.** A cada abertura da página, se a última
   leitura do Strava tem mais de 10 minutos, a Vercel puxa as atividades dos
   últimos 14 dias (esforço relativo, tênis, links) e grava no Supabase
   (`strava_activities`, `strava_gear`). O fitness é recalculado em código
   (`src/prumo/fitness.ts`, testado) a partir do esforço por dia: histórico
   versionado em `estatico.json` até a ligação, banco daí em diante.
2. **`.github/workflows/sync.yml`** chama `/api/sync`, que empurra o plano para
   o relógio e puxa o Strava, nos horários de Brasília: 05:45 e 05:55, a cada
   10 minutos das 06:00 às 07:50, e de hora em hora das 08:00 às 23:00. É
   gratuito e o GitHub pode atrasar alguns minutos na largada.

O relógio (sono, HRV, FC, treinos) continua chegando pelo intervals.icu a cada
abertura, sem rotina nenhuma.

**Ligar o Strava, uma vez:** criar um app em strava.com/settings/api (domínio
de callback `ai-endurance-coach-omega.vercel.app`), colocar `STRAVA_CLIENT_ID`
e `STRAVA_CLIENT_SECRET` nas variáveis da Vercel, fazer redeploy e, no modo
privado, abrir `/api/strava/connect`. Os tokens ficam na tabela
`integrations` e se renovam sozinhos.

**O que fica como retrato** (atualizado quando conversamos, com a data visível):
nota e fases do sono do COROS, faixa normal do HRV, VO₂max, limiar, previsões
de prova e séries de força do Strava. A API do Strava não publica séries; a do
COROS é só para parceiros. A prontidão e os gráficos não dependem deles.

## O que depende do Gabriel

- **Deixar o COROS sincronizar sozinho:** Bluetooth ligado, app do COROS não
  fechado à força e sem modo de baixo consumo no celular. O relógio manda a
  noite e os treinos para a nuvem do COROS sem toque; a rotina e o
  intervals.icu leem de lá. Nada de atualizar na mão ao longo do dia.
- **Não desligar a ligação COROS → intervals.icu.** O intervals saiu da
  interface, mas é o cano do dado vivo.
- **Chave do modo privado:** `PRUMO_CHAVE` nas variáveis da Vercel e a visita
  única a `/api/prumo/entrar?chave=…`.
- **Nutrição:** MyFitnessPal gravando no Apple Health e o Health Auto Export
  com a automação REST para `/api/nutricao` (header `Authorization: Bearer
  <PRUMO_CHAVE>`).
- **Suplementação:** depois do treino, dizer o que entrou.

## Ainda não existe

- Aviso no Telegram quando a prontidão mudar o treino do dia.
- Leitor direto da nuvem do COROS (nota de sono, previsões) sem conector:
  só com API não oficial e o login dele guardado; decisão em aberto.
- RPs de toda a vida e fotos oficiais dos tênis (dependem do Strava logado).
- Bioimpedância e exames de sangue no painel.
