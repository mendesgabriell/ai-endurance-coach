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

Duas tarefas agendadas no app Claude, com o mesmo roteiro, enquanto o app
estiver aberto no Mac (o Mac é o servidor):

- `prumo-retrato-diario`: de manhã, a cada 10 minutos, das 05:00 às 07:50.
  É a janela em que ele acorda, o relógio sobe a noite e o treino começa.
- `prumo-retrato-dia`: de hora em hora, das 08:50 às 22:50, para o que chega
  durante o dia (treinos, força, tênis).

Para ler na hora, sem esperar: o botão "Run now" da tarefa, na seção
"Scheduled" do app. Cada rodada é uma sessão do Claude; por isso a cadência
não desce de 10 minutos. Leitura de 2 em 2 minutos pede um leitor sem modelo
no Mac, falando direto com a nuvem do COROS: é uma peça nova, com ADR.

Cada rodada:

1. lê no conector do COROS as últimas 3 noites, os 7 dias de HRV com a faixa
   normal, o VO₂max, o limiar e as previsões de prova;
2. lê no conector do Strava as atividades dos últimos 3 dias (esforço
   relativo, tênis, links), as séries de cada sessão de força e os km dos
   tênis usados no período;
3. grava os arquivos em `.prumo-refresh/` (fora do git) e roda
   `python3 scripts/prumo-refresh.py`, que valida, mescla e recalcula o
   fitness. O modelo transcreve; quem calcula é o script;
4. commita só `src/prumo/estatico.json` e dá push na branch e na `main`,
   apenas quando algo mudou. Sem novidade, a rodada termina sem commit.

Se um conector falhar, a parte dele fica como estava. Se a validação falhar,
nada é gravado. A rotina nunca toca em `.env`.

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
- **Deixar o app Claude aberto no Mac** para a rotina diária rodar.

## Ainda não existe

- Aviso no Telegram quando a prontidão mudar o treino do dia.
- RPs de toda a vida e fotos oficiais dos tênis (dependem do Strava logado).
- Bioimpedância e exames de sangue no painel.
