# ADR-0006 · intervals.icu como ponte para o relógio do atleta-zero

**Status:** Aceito · 07/09/2026

## Contexto

`02-escopo-mvp.md` lista "envio de treino pro relógio" como **condicional à aprovação da
Training API da Garmin", e `05-integracoes.md` diz o que isso significa na prática: a
funcionalidade não está travada em engenharia, está travada em **fila de aprovação de
terceiro**, sem SLA publicado. A COROS tem o mesmo formato de bloqueio.

O atleta-zero corre em **19/09/2026**. Esperar aprovação não é uma opção nessa janela.

O caminho oficial da COROS foi levantado e não resolve:
- O MCP oficial (`mcpus.coros.com/mcp`) é **somente leitura** — 22 ferramentas, todas
  `query*`/`get*`. Não existe create/push.
- Import de FIT/TCX no COROS aceita **atividade já feita**, nunca treino planejado.
- Sobram: digitar na mão no app COROS, ou um intermediário.

O **intervals.icu** já é usado pelo Gabriel e tem integração COROS nativa, com
"upload planned workouts" nas conexões: ele publica um plano semanal que o app COROS
sincroniza no relógio. Cobre bike, corrida, natação e **musculação** — o que importa aqui,
porque metade deste plano é academia, e a Tredict (a outra ponte possível) **não manda
musculação**.

A API é chave pessoal, não OAuth de empresa: **não há fila de aprovação**.

## Decisão

Usar o **intervals.icu como ponte de escrita para o relógio do atleta-zero**, gerado a
partir de `src/plan/plan.ts`, que continua sendo a fonte única.

```
src/plan/plan.ts  →  src/integrations/intervals/map.ts  →  API intervals.icu  →  COROS  →  relógio
```

- Auth: HTTP Basic, usuário literal `API_KEY`, senha = chave de Settings > Developer.
- `POST /api/v1/athlete/{id}/events`, um evento por sessão.
- **Idempotência por `external_id = coach-<id da sessão>`**: o push apaga os eventos
  `coach-*` do intervalo e recria. Evento criado à mão no intervals.icu fica intacto.
- Corrida vira `Run` com passos estruturados; perna e superiores viram `WeightTraining`;
  nutrição, recovery e REGRA viram `NOTE` — lembrete não vai para o relógio como treino.

**Esta decisão é para o atleta-zero, não para o produto.** Rotear todo usuário por uma conta
intervals.icu é outra decisão, com outro custo, e exige ADR próprio. O que se compra aqui é
tempo: a funcionalidade existe hoje em vez de existir quando a Garmin responder.

## Consequências

**Boas**
- Push pro relógio deixa de depender de aprovação de terceiro.
- A regra "fonte única do plano" se estende ao relógio: `plan.ts` → calendário → Telegram → COROS.
- Musculação vai junto, que nenhuma outra ponte gratuita entrega.

**Ruins, e assumidas**
- **Mais um serviço no stack**, contra a regra de ouro do `CLAUDE.md`. Justificado por ser
  ponte temporária de um usuário, sem código de produto dependendo dela.
- **Dependência de uma integração de terceiro com terceiro.** Falhas do lado
  intervals.icu↔COROS aparecem no fórum deles ("date is out of range", plano que não
  aparece no app). Se sumir, o fallback é digitar no app COROS — que é o estado atual.
- A sintaxe de treino do intervals.icu **não tem inclinação de esteira**. A inclinação vai
  como texto no passo, não como alvo. O relógio cronometra o bloco; quem põe 15% é o atleta.
- **Musculação estruturada não é garantida.** Que `WeightTraining` chegue ao relógio com
  séries e repetições legíveis precisa de teste real antes de confiar. Enquanto não houver,
  a academia continua valendo pelo Telegram e pelo calendário.

## Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| **Esperar a Training API da Garmin / COROS** | Fila sem SLA. A prova é em 19/09. |
| **MCP oficial da COROS** | Somente leitura. Não existe endpoint de escrita. |
| **Tredict** | Parceira oficial da COROS e boa para corrida — mas **não manda musculação**, e metade deste plano é academia. |
| **`rowlando/coros-workout-mcp`** | Faz musculação, mas é API reversa e guarda e-mail e senha da COROS **em texto plano** em `~/.config`. Risco desproporcional. |
| **Digitar no app COROS** | É o estado atual. Funciona, não escala, e diverge do `plan.ts` na primeira mudança — o bug de 05/09 de novo. |
| **Exportar FIT/TCX e importar no COROS** | Import do COROS é só para atividade concluída. Beco sem saída. |
