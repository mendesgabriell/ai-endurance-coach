# 02 · Escopo do MVP — o corte

## O problema com o H1 original

O Horizonte 1 do documento executivo lista **16 entregas** para 6 meses, e o go-to-market
promete MVP público em 90 dias. Várias dessas entregas são projetos de meses sozinhas:
"nutrição por input manual + foto" é um produto inteiro; "modo treinador" é outro; "race
intelligence" exige uma base de dados de provas que não existe.

Uma lista de 16 itens não é um plano — é uma lista de desejos bem organizada. Tentar todos
significa entregar 16 coisas pela metade e não conseguir validar nenhuma.

## O que o MVP precisa provar

Uma única hipótese, e ela é falsificável:

> **Um sistema que lê HRV, sono e carga de treino consegue tomar a decisão de treino do dia
> melhor do que o atleta tomaria sozinho — e o atleta confia o suficiente para seguir.**

Se isso for verdade, tudo o mais é extensão. Se for falso, nutrição e race intelligence não
salvam o produto.

## O loop mínimo

```
ingerir dados do wearable
   → normalizar para o modelo canônico
      → calcular carga, baseline de HRV, ACWR, CTL/ATL/TSB
         → decidir Verde / Amarelo / Vermelho  (código determinístico)
            → gerar o treino de hoje a partir do plano + do status  (LLM)
               → entregar ao atleta
                  → coletar feedback de execução
                     → recalcular amanhã
```

Tudo o que não está nesse loop está fora do MVP.

---

## DENTRO dos 90 dias

### Núcleo — inegociável
- [ ] Ingestão de **1 fonte de recovery** (Oura **ou** WHOOP — as duas liberam acesso hoje)
- [ ] Ingestão de **1 fonte de treino** (Garmin *ou* COROS, o que aprovar primeiro;
      fallback: upload manual de arquivo `.fit`)
- [ ] Camada de normalização canônica (mesmo com uma fonte só — o desenho é o ativo)
- [ ] Cálculo de carga: TRIMP/hrTSS por sessão
- [ ] Baseline pessoal de HRV (lnRMSSD, média móvel 7d vs janela normal de 60d)
- [ ] ACWR 7:28 (EWMA), CTL/ATL/TSB
- [ ] **Motor de semáforo Verde/Amarelo/Vermelho** — determinístico, testado
- [ ] Plano periodizado por prova alvo (blocos montados ao contrário a partir da data)
- [ ] Geração do treino do dia via LLM, com o status como restrição dura
- [ ] Web app: uma tela — status do dia, treino de hoje, uma métrica que importa
- [ ] Anamnese de onboarding (objetivo, histórico, wearables, saúde, biológico, disponibilidade)
- [ ] Consentimento LGPD específico para dado de saúde, com registro auditável

### Núcleo — se o prazo permitir
- [ ] Canal WhatsApp com mensagem diária das 7h
- [ ] Integração de calendário (Google) para mover treino por conflito
- [ ] Zonas calibradas por atleta em vez de genéricas
- [ ] Força integrada ao plano de endurance
- [ ] Envio de treino pro relógio — **condicional à aprovação da Training API da Garmin**

### Fora do produto, mas dentro dos 90 dias
- [ ] Submissões de API: Garmin, COROS, Meta WhatsApp (**Semana 1**)
- [ ] Modelagem de custo variável por usuário vs. preço do Starter

---

## FORA dos 90 dias — e por quê

| Item | Por que sai |
|---|---|
| **Nutrição** (input manual, foto, carbo de performance) | Produto inteiro. Reconhecimento de alimento por foto é um projeto próprio. O carbo de performance é o diferencial, mas não prova a hipótese central |
| **Race intelligence** | Exige base de dados de percursos, clima histórico e splits que não existe. Meses de coleta |
| **Modo treinador** | B2B. Multi-tenant, permissões, dashboard multi-atleta. Depois da validação com atleta direto |
| **App mobile** | Web + WhatsApp cobrem o MVP. Nativo é 2–3 meses sozinho |
| **Ciclo hormonal feminino** | Correto e importante — mas o atleta-zero é homem. Não dá para validar o que não se consegue testar. Entra quando houver atleta mulher no grupo fechado |
| **Multi-wearable simultâneo** | A *arquitetura* suporta desde o dia 1. As *integrações* entram uma a uma |
| **Lesão ativa → plano adaptado** | Regra de segurança complexa, alto risco de dano se errada. Ver nota abaixo |
| **Mobilidade 15min diária** | Fácil de gerar, baixo valor de validação. Entra quando o núcleo estiver de pé |
| **Detecção de padrão pré-lesão** | Precisa de histórico longitudinal que só existe depois de meses de uso |
| **Gamificação** | Retenção importa depois que existe o que reter |

### Nota sobre lesão ativa

Prescrever treino para alguém com lesão ativa é a única funcionalidade do produto que pode
causar dano físico real. Não entra no MVP como "plano adaptado". O que entra é o
comportamento seguro: **se o atleta reporta lesão ativa, o sistema reduz para descanso ativo
e recomenda avaliação profissional** — e para por aí. A adaptação inteligente vem depois,
com revisão de um profissional de saúde no desenho da regra.

---

## Definição de pronto do MVP

O MVP está pronto quando, por **21 dias consecutivos**, com o Gabriel como atleta-zero:

1. Os dados chegam sozinhos, sem intervenção manual
2. O semáforo é calculado todo dia às 5h, sem falha
3. O treino do dia é gerado e entregue antes das 7h
4. O Gabriel consegue dizer, olhando para trás, se a decisão do sistema foi melhor,
   igual ou pior do que a que ele teria tomado — e "melhor ou igual" ganha na maioria dos dias

O item 4 é o único que importa. Os três primeiros são pré-requisito.
