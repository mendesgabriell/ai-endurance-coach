# Dash do Coach AI

Documento único do ciclo. O que estiver aqui vale; o que não estiver, não foi
decidido. O artefato publicado é a versão visual disto, e o arquivo que o serve
é `public/dash.html`.

**Artefato:** https://claude.ai/artifact/C5YwW85S1PY5hSihKb22JL
**No Vercel:** `/dash.html`

As seções abaixo são as mesmas do dash, na mesma ordem.

---

## 0. Torre de Controle

Acrescentada em 06/10/2026, inspirada na torre do João (`jppace.com/road2boston`).
É o portão da manhã: um número decide se a sessão do dia sai como está, sai menor,
ou não sai.

### O semáforo

Quatro perguntas de 1 a 7 — **sono, fadiga geral, dor, estresse** — somadas. Quatro
é o melhor dia possível, 28 o pior. Depois o relógio acrescenta penalidade onde o
corpo discorda da resposta:

| Medida | Gatilho | Penalidade |
|---|---|---|
| HRV da noite | abaixo da média de 7 dias menos um desvio | +4 |
| FC de repouso | 5 bpm acima da média de 7 dias | +4 |
| Horas de sono | menos de 6h / menos de 5h | +3 / +6 |
| Recuperação COROS | abaixo de 50% | +3 |

| Nível | Faixa | Corrida | Força |
|---|---|---|---|
| 5 · Pronto para prova | 4–10 | a sessão como está, pode subir o alvo | pesado, pirâmide completa |
| 4 · Liberado | 11–16 | a sessão como está | pesado, como prescrito |
| 3 · Atenção | 17–23 | mantém o tempo, corta a intensidade | sai a série de 6, fica em 10–12 |
| 2 · Segura | 24–31 | metade do tempo, zona 2 | só máquina e isolador |
| 1 · Parado | 32+ | não corre | não levanta; abdominal e mobilidade valem |

**A trava da dor passa por cima de tudo:** dor 6 ou 7 nunca libera acima do nível 2,
mesmo com HRV ótimo e oito horas de sono. É regra de código, não julgamento.

### A projeção e o buraco

Única âncora real: Paraty 58K em 12h30, que dá **12:56/km**.

| Prova | Quando | Meta | Ritmo médio | Contra Paraty |
|---|---|---|---|---|
| INDOMIT Pedra do Baú 50K | 20/03/2027 | sub-9h | 10:48/km | 2:08/km mais rápido |
| | | sonho: sub-8h | 9:36/km | 3:20/km mais rápido |
| La Misión Brasil 110K | 12–14/08/2027 | sub-25h | 13:38/km | 0:42/km mais lento |
| | | mira: 20h | 10:54/km | 2:02/km mais rápido |

São dois problemas diferentes. A INDOMIT pede **ritmo**; a La Misión sub-25h pede
**duração** — o ritmo é mais lento que o de Paraty, mas por 110 km e uma noite. As
20h da La Misión pedem as duas coisas juntas e são a meta mais dura por margem larga.

### Os cinco portões

| | Quando | Critério | Abre |
|---|---|---|---|
| G1 | semana 2 · 05–11/10 | teste de limiar feito inteiro, FC média dos últimos 20' | as zonas reais do ciclo |
| G2 | semana 3 · 17–18/10 | WTR Campos 19 km sem dor | o Bloco 1 e a subida de 10% |
| G3 | semana 11 · 07–13/12 | semana de 88 km sem furo | cruzar os 100 |
| G4 | semana 16 · 11–17/01 | longão de 26 km com D+ no ritmo alvo | o Bloco 3 e a janela da meta-sonho |
| G5 | 20/03/2027 | o tempo da INDOMIT | a meta da La Misión |

### As quatorze rotinas

Na ordem em que uma destrava a outra. **Nenhuma é o modelo calculando** — todas são
código com teste, e o modelo só lê o resultado (ADR-0004).

| | Rotina | O que faz | Onde |
|---|---|---|---|
| R1 | As quatro perguntas | cron manda as 4 no Telegram com botões 1–7 → `checkin_subjetivo` | rota + tabela |
| R2 | Sincronia do COROS | HRV, FC repouso, sono, recuperação → `metricas_diarias` | rota + tabela |
| R3 | `baseline.ts` | média móvel de 7 dias e desvio | módulo + teste |
| R4 | `semaforo.ts` | soma, penalidades, trava da dor → nível 1–5 | módulo + teste |
| R5 | `modula.ts` | aplica o nível à sessão do dia | módulo + teste |
| R6 | Mensagem da manhã v2 | manda o nível e a sessão **já modulada** | formatador |
| R7 | `carga.ts` | carga por FC e por tonelagem | módulo + teste |
| R8 | `acwr.ts` · `fitness.ts` | agudo/crônico, CTL/ATL/TSB | módulo + teste |
| R9 | `conformidade.ts` | alvo × executado; em dia fácil, rápido demais conta como fora | módulo + teste |
| R10 | `projecao.ts` | tempo projetado com faixa, a partir do limiar medido | módulo + teste |
| R11 | `portoes.ts` | avalia os cinco portões com motivo | módulo + teste |
| R12 | O dash lendo o banco | a página deixa de ser estática | rota |
| R13 | `tenis.ts` | km por par e vida útil | módulo + tabela |
| R14 | O ciclo da La Misión | o modelo fecha em 21/03; de lá a 12/08 é outro ciclo | modelo |

---

## 1. A semana

Segunda a sexta, **duas sessões**: corrida de manhã entre 5h e 9h, força à noite.
Sábado, **uma sessão** — o longão de trilha. Domingo, **duas de manhã**, emendadas.

| Dia | Manhã | Noite |
|---|---|---|
| Segunda | Rodagem base · rua · Ibirapuera | A1 · perna, quadríceps |
| Terça | Subida na esteira | B · costas e lombar |
| Quarta | Rodagem com ritmo · rua | C · peito e ombro |
| Quinta | Subida longa na esteira | A2 · perna, posterior e glúteo |
| Sexta | Rodagem leve · rua | D · ombro e braço |
| Sábado | Longão de trilha | — sessão única |
| Domingo | Rodagem regenerativa | T · torso (emendado de manhã) |

**As regras**

- Segunda, quarta e sexta na **rua**, no Ibirapuera. Plano, sem desnível.
- Terça e quinta na **esteira inclinada**. Chuva não cancela — morando em São Paulo
  é o único desnível possível no meio da semana.
- Sábado é **trilha, sempre**. O VOTU fica a 40 km de casa e só dá em fim de semana.
- **Corrida de manhã, força à noite.** Nunca o contrário no mesmo dia.
- **Teto de 142 bpm** nas rodagens — o mesmo das três primeiras horas de prova.
- Deitar no máximo **23h**, acordar entre **5h e 6h**. Compromisso de 28/09/2026.
- O rodízio de força **não tem dia travado**. Se um dia furar, ele anda, não pula.

---

## 2. Calendário

| Data | Prova | Distância | Alvo |
|---|---|---|---|
| 17–18/10/2026 | WTR Campos do Jordão | 19 km · 687 m D+ | ~2h, sem preparo específico |
| **18–20/03/2027** | **INDOMIT Pedra do Baú** | **50 km** | **prova-alvo do ciclo** |
| 09–10/04/2027 | KTR Campos do Jordão | 50 km | noturna, sexta 17h. Primeira ultra da Carol |
| 27–30/05/2027 | Maratona do Rio | 21 km | 1h40 · **vaga por sorteio** |
| 05–06/06/2027 | Maratona de Porto Alegre | 42 km | 3h30 |
| **12–14/08/2027** | **La Misión Brasil** | **110 km** | **sub-25h, mirando 20h** |
| ~24–30/08/2027 | UTMB Chamonix | a definir | data 2027 não publicada |
| 29/08/2027 | Maratona de Floripa | 42 km | uma maratona por estado |
| meados/fim 08/2027 | Matterhorn Ultraks | 49 km SKY | Zermatt. Inscrição abre no outono de 2026 |

**Marcas alvo:** meia 1h40 · maratona 3h30 · 110 km sub-25h · 50K internacional sub-9h.
**2028:** menos provas, pódio de categoria nas relevantes.

### Prazo com data
**Maratona do Rio é sorteio.** Cadastro **09 a 21/11/2026**, sorteio 25/11,
resultado 27/11. Perder a janela tira a prova do calendário.

### Decisões abertas
1. **Engarrafamento de agosto.** La Misión (12–14/08), UTMB (~24–30/08) e Floripa
   (29/08) se atropelam. Floripa e UTMB na mesma semana; La Misión a 10–16 dias de
   Chamonix. Uma das três é performance, as outras duas são participação — ou saem.
2. **Baú e KTR são dois 50K com três semanas de intervalo.** Não periodizam juntos.
   Qual dos dois é performance?
3. **Rio (27–30/05) e Porto Alegre (05–06/06)** com oito dias de intervalo.

---

## 3. Mapa do Ciclo

Cinco blocos, 25 semanas, **28/09/2026 → 20/03/2027**. Subida entra desde a primeira
semana porque o ano inteiro é montanha. Velocidade de rua ganha bloco próprio em
abril, entre o KTR e Porto Alegre.

| Bloco | Janela | Sem | km/sem | Fácil | Forte | Específico |
|---|---|---|---|---|---|---|
| 0 · Religar e medir | 28/09 – 18/10 | 3 | 45 | 70% | 10% | 20% |
| 1 · Base com subida | 19/10 – 13/12 | 8 | 88 | 60% | 15% | 25% |
| 2 · Volume e subida forte | 14/12 – 31/01 | 7 | 100 | 50% | 15% | 35% |
| 3 · Específico do Baú | 01/02 – 07/03 | 5 | 100 | 45% | 10% | 45% |
| 4 · Polimento | 08/03 – 20/03 | 1,5 | 50 | 65% | 15% | 20% |

**Volume total do ciclo: 1.838 km.** Pico 100 km/sem. Média 74 km/sem.
Repartição por dia no ciclo: sábado 478 km · quinta 294 · terça e quarta 257 cada ·
segunda e sexta 220 · domingo 110.

**O que cada bloco tem que entregar**

- **Bloco 0 — Religar e medir.** Volta a rotina das duplas e fixa o sono em 23h. E
  principalmente **mede onde ele está**: não existe referência limpa de velocidade no
  arquivo, tudo é ritmo dentro de ultra. Sem limiar calibrado o Bloco 1 vira chute.
  A WTR de 17/10 fecha o bloco como teste.
- **Bloco 1 — Base com subida.** O bloco mais longo e o que decide o ano. Leva o
  volume de 45 a 88. **Se este bloco furar, os 100 km de fevereiro não existem.**
- **Bloco 2 — Volume e subida forte.** Tiros de subida sérios, 12–15% na esteira,
  trilha com desnível de verdade. O volume bate os 100 e fica.
- **Bloco 3 — Específico do Baú.** O volume não sobe mais; muda a composição. Quase
  metade da semana vira específico. É aqui que se descobre se virou bom de subida
  ou só rodou muito.
- **Bloco 4 — Polimento.** Volume cai pela metade, intensidade fica.

**Duas contas que não têm margem**

1. **Teste de limiar entre 05 e 11/10.** Trinta minutos no máximo sustentável, piso
   plano. A FC média dos últimos 20 minutos vira o número de onde saem todas as zonas.
2. **30 → 88 km em onze semanas é triplicar.** Com uma descarga no meio, a conta fecha
   em 9% por semana, que é o limite do que o tendão aceita. Furar semana aqui não
   atrasa o Bloco 1, atrasa o Baú.

**Ressalva:** volume e distribuição são **alvo, não medição**. CTL de 31 é dado real
de 26/09/2026.

### Aritmética ainda não resolvida
Os **100 km/semana de 2027 são média do ano**, não piso. Cada prova custa quatro
semanas reduzidas (uma antes leve, a da prova leve, a seguinte de recuperação, a +2
em −50%). Com cinco provas, as semanas cheias teriam que ficar perto de **130 km**
para a média fechar em 100. Ou a média de 100 vale só para as semanas cheias e o ano
fecha perto de 85. **Não decidido.**

---

## 4. Treino de corrida

A **forma** da sessão não muda no ciclo. O que muda é a **dose**, que vem do Mapa
do Ciclo — mesmo número, mesma fonte.

| Dia | Sessão | Terreno | No ciclo |
|---|---|---|---|
| Segunda | Rodagem base | rua · Ibirapuera | 220 km |
| Terça | Subida na esteira | esteira inclinada | 257 km |
| Quarta | Rodagem com ritmo | rua · Ibirapuera | 257 km |
| Quinta | Subida longa na esteira | esteira inclinada | 294 km |
| Sexta | Rodagem leve | rua · Ibirapuera | 220 km |
| Sábado | Longão de trilha | trilha | 478 km |
| Domingo | Rodagem regenerativa | rua leve | 110 km |

**Progressão das duas sessões de subida**

| Bloco | Terça · subida forte | Quinta · subida longa |
|---|---|---|
| 0 | 6 × 2' a 10% · rec 2' | 20' contínuo a 12% |
| 1 | 6 × 3' a 12% · rec 2' | 30' contínuo a 12–15% |
| 2 | 5 × 5' a 12% · rec 2'30 | 45' a 15% com mochila de 4 kg |
| 3 | 4 × 8' a 14% · rec 3' | 60' a 15% com mochila de 6 kg |
| 4 | 4 × 3' a 10% · rec 2' | 20' a 10%, sem mochila |

**Quarta · limiar:** 3 × 5' (B0) → 4 × 6' (B1) → 4 × 8' (B2) → 3 × 12' (B3) → 2 × 5' (B4).
O número do limiar **ainda não existe** — sai do teste da semana 2.

**Sábado · D+ do longão:** 300 m (B0) → 600–900 m (B1) → 1000–1400 m (B2) →
1500–1800 m (B3) → sem D+ novo (B4). A mochila entra no Bloco 2.

---

## 5. Treino de força

**Este bloco não olha o calendário de provas.** O alvo é força total e composição
corporal — o corpo de 2023 de volta. A prova toca isto uma vez só: na semana dela
saem A1 e A2 e entra o T.

**Rodízio de seis, sem dia travado:**
A1 quadríceps · B costas · C peito · A2 posterior e glúteo · D ombro e braço ·
T torso. Seis dias fecham todo grupo duas vezes. Com cinco, corta o T; com quatro,
corta o D também — perna e costas nunca saem.

**Periodização da força**

| Fase | Janela | O que muda |
|---|---|---|
| 1 · Hipertrofia | out–dez, 12 sem | 8–12 reps, RPE 8. Carga sobe toda semana |
| 2 · Força máxima | jan–fev, 8 sem | Os dois primeiros de cada sessão em 4–6 reps |
| 3 · Densidade | mar em diante | Carga mantida, intervalo em 60–75s. Déficit entra aqui |

**Todo dia de academia:** esteira inclinada 20–30 min a 8–12% com FC < 120 (antes na
perna, depois no resto) · superman 3 × 15 · abdominal do dia em rodízio.

**Padrão:** pancada de fisiculturista. 9 a 12 exercícios por sessão, isoladores
sempre (extensora, flexoras, abdutora, adutora, panturrilhas), drop set e negativa
controlada. Máquinas articuladas abrem costas e peito. **Nada de treino funcional
de corredor** — rejeitado duas vezes.

**Pontos fracos declarados:** glúteo pequeno, principalmente a parte alta · lombar
baixa sem volume · acumula gordura em colo, lombar baixa e parte baixa da barriga.

---

## 6. Acompanhamento médico

Estrutura montada, **dados pendentes**. Nenhum número aqui é estimativa: o que não
foi medido aparece como pendência.

**Dado real**

| Item | Valor | Origem |
|---|---|---|
| CTL | 31 | intervals.icu · 26/09/2026 |
| Teto de FC em prova | 142 bpm | derivado de 166 observado em prova de 12h30 |
| Peso | 73–76 kg | **não confirmado** — duas referências conflitantes |
| Hora de dormir | 01h20–01h52 | COROS, histórico. Compromisso novo: 23h desde 28/09 |

**Pendências, em ordem de urgência**

1. **Teste de limiar** — 05 a 11/10. Sem ele o Bloco 1 inteiro é chute.
2. **Exames de sangue** — hemograma, ferritina, vitamina D, B12, TSH, testosterona.
   Triplicar volume sem saber o ferro basal é descobrir anemia em janeiro.
3. **Peso e composição** — de quatro em quatro semanas, mesmo horário. A fase de
   densidade precisa de linha de base de dezembro.
4. **Quadro gastrointestinal de 26/09** — diarreia e vômito, dois dias sem treinar.
   Se repetir, vira investigação.
5. **Sono** — o COROS já mede. Se outubro não fechar abaixo de 23h30, o Bloco 1 não
   tem recuperação para sustentar 88 km.

Este projeto **não decide nada clínico**. Os números existem para levar ao médico.

---

## 7. Nutrição

A nutrição **saiu do plano de treino em 14/09/2026 a pedido dele** — é feita por
fora, com MyFitnessPal. Aqui fica só a interface entre o treino e a cozinha.

- **Decidido — ensaio de prova no longão.** A partir do Bloco 2: comer a cada 40 min
  no sábado mesmo sem fome, beber por relógio e não por sede. A quebra de 2025 foi
  desidratação e cãibra no km 23, não perna: os últimos 23 km levaram 4h34.
- **Pendente — meta calórica por fase.** Hipertrofia pede superávit leve, densidade
  pede déficit. Os números vêm do nutricionista.
- **Pendente — proteína por quilo.** O ciclo anterior usava 2,7 g/kg e gordura travada
  em 50 g/dia. Com 100 km/semana mais seis sessões de força, precisa ser revisto.

---

## Onde isto vive

| Coisa | Lugar |
|---|---|
| Este documento | `docs/00-dash.md` |
| A página do dash | `public/dash.html` → Vercel `/dash.html` |
| O artefato publicado | https://claude.ai/artifact/C5YwW85S1PY5hSihKb22JL |
| Fonte do plano diário | `src/plan/plan.ts` — **ainda com o ciclo do Paraty** |
| Histórico do Paraty | `src/plan/historico-paraty.ts` — 58 sessões |

**Pendência estrutural:** o ciclo novo ainda não está em `src/plan/plan.ts`. Enquanto
não estiver, o bot do Telegram e o push para o relógio não conhecem nada deste
documento. É o próximo elo.
