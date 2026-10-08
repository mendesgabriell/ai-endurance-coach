/**
 * Ferramentas que o modelo pode chamar pelo script coach-tool.
 *
 * Elas devolvem FATO — o plano, o que foi marcado, o que o atleta escreveu.
 * Métrica fisiológica sai de código determinístico e testado (ADR-0004): o
 * modelo lê o resultado, nunca calcula.
 */
export const TOOLS = [
  { name: "plano_do_dia", desc: "Sessões planejadas de um dia, com o que já foi marcado.", input: '{"dia":"YYYY-MM-DD"}' },
  { name: "plano_da_semana", desc: "Sete dias a partir de uma data.", input: '{"de":"YYYY-MM-DD"}' },
  { name: "marcacoes", desc: "O que já foi marcado como feito num dia.", input: '{"dia":"YYYY-MM-DD"}' },
  { name: "marcar", desc: "Marca uma sessão. status: feito | adaptei | nao_rolou.", input: '{"id":"l1","dia":"YYYY-MM-DD","status":"feito"}' },
  { name: "anotacoes", desc: "As observações que o atleta escreveu num dia.", input: '{"dia":"YYYY-MM-DD"}' },
  { name: "anotar", desc: "Guarda uma observação no dia.", input: '{"dia":"YYYY-MM-DD","texto":"..."}' },
  { name: "suplementacao", desc: "Registra o que entrou num treino: produtos do catálogo (ids) e quantidades.", input: '{"dia":"YYYY-MM-DD","sessao":"Longão trilha","itens":[{"p":"dobro-carbs-maracuja","q":2}],"nota":"..."}' },
  { name: "produtos", desc: "Catálogo de suplementos com os dados do rótulo (id, carboidrato, sódio, cafeína).", input: '{}' },
] as const;
