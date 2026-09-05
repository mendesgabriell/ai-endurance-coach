# 06 · LGPD e dado sensível

> Não é capítulo de compliance para o fim. É requisito de arquitetura, e vários itens
> aqui são **pré-requisito de submissão** das APIs de wearable (Garmin, COROS e Meta
> exigem política de privacidade publicada antes de aprovar).

⚠️ Este documento é orientação de engenharia, não parecer jurídico. Antes do lançamento
público (Fase 2 do go-to-market), a política de privacidade e as bases legais precisam de
revisão de um advogado com prática em proteção de dados.

## O ponto central

Dado de saúde é **dado pessoal sensível** pelo art. 11 da LGPD. Isso muda três coisas:

1. **Base legal.** Não vale "legítimo interesse". Para dado sensível, o caminho prático é
   **consentimento específico e destacado para finalidades específicas** (art. 11, I).
   "Específico e destacado" significa que não pode estar embutido no aceite dos Termos de
   Uso — precisa ser um ato próprio, separado, com finalidade explicada.
2. **Granularidade.** Consentir em receber treino não é consentir em ter exames médicos
   lidos, nem em ter os dados usados para melhorar o produto. São finalidades distintas,
   consentimentos distintos.
3. **Revogação.** O titular pode revogar a qualquer tempo, com a mesma facilidade com que
   consentiu. Se dar consentimento é um clique, tirar também precisa ser.

## O que isso exige do produto

### Consentimento auditável
Uma tabela `consent_record` append-only, nunca atualizada em lugar:

```
athlete_id · purpose · granted (bool) · consent_text_version
timestamp · ip · user_agent
```

Guardar a **versão do texto** consentido, não só o "sim". Quando a política mudar, é preciso
saber exatamente com o que cada pessoa concordou. Um booleano `consented: true` não prova nada.

Finalidades separadas, no mínimo:
- Processar dados biométricos para gerar recomendação de treino *(essencial ao serviço)*
- Receber mensagens no WhatsApp
- Usar dados de forma agregada para melhorar o produto *(opcional — e o padrão deve ser não)*

### Direitos do titular — implementados, não prometidos
| Direito | O que precisa existir |
|---|---|
| Acesso | Exportar tudo que o sistema tem sobre o atleta, em formato legível |
| Eliminação | Apagar de verdade, incluindo `raw_payloads` e backups, em prazo definido |
| Portabilidade | Export em formato aberto |
| Revogação | Desconectar wearable e revogar consentimento sem falar com suporte |

O botão de exclusão precisa existir desde o MVP. Retrofit de exclusão em um sistema com
dados espalhados é caro e costuma ficar incompleto.

### Arquitetura
- **Residência de dados no Brasil.** Supabase região São Paulo. Não elimina a discussão de
  transferência internacional (a Claude API processa fora), mas reduz a superfície e
  simplifica a comunicação com o titular.
- **RLS no Postgres.** Isolamento por atleta imposto no banco, não confiado à aplicação.
  Um bug de `WHERE` não pode vazar o histórico de saúde de outra pessoa.
- **Tokens de OAuth criptografados** em repouso, com chave fora do banco.
- **Minimização.** Não puxar o que não se usa. Cada campo ingerido precisa de uma razão.
- **Retenção definida.** Quanto tempo se guarda dado de atleta inativo. Definir e aplicar
  automaticamente.
- **Log de acesso** a dado sensível.

### Transferência internacional — item a resolver
A camada de coach envia contexto do atleta para a Claude API, que processa fora do Brasil.
Isso é transferência internacional de dado sensível e precisa de:
- Menção explícita na política de privacidade e no consentimento
- **Minimização do payload:** enviar ao modelo apenas o necessário para a decisão do dia.
  Não há razão para enviar nome, e-mail, CPF ou dados de contato para gerar um treino.
  **Pseudonimizar antes de enviar** — o modelo recebe métricas e um identificador opaco.

Essa é uma boa prática independentemente da LGPD, e é barata se feita desde o começo.

### Fronteira médica
O produto prescreve treino, não trata doença. Manter essa fronteira nítida:
- Não diagnosticar. Não afirmar que o atleta tem alguma condição.
- Diante de sinal de alerta (dor persistente, sintoma sistêmico, HRV cronicamente deprimido),
  o comportamento é **reduzir carga e recomendar avaliação profissional**.
- Leitura de exames (H2) e "marketplace de clínicas" (H2) entram em território regulado.
  Não tocar sem orientação jurídica específica.
- Disclaimer visível: não substitui acompanhamento médico.

## Checklist antes do primeiro usuário que não seja o fundador

- [ ] Política de privacidade publicada — descreve finalidades, bases legais, retenção,
      transferência internacional e direitos do titular
- [ ] Termos de uso publicados, **separados** do consentimento de dado sensível
- [ ] Fluxo de consentimento granular no onboarding, com registro versionado
- [ ] Exportação de dados funcionando
- [ ] Exclusão de conta funcionando de ponta a ponta
- [ ] RLS ativa e testada em todas as tabelas com dado de atleta
- [ ] Payload enviado à Claude API pseudonimizado e minimizado
- [ ] Canal de contato do encarregado (DPO) publicado
