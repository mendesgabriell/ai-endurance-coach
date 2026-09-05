export type SessionKind = "corrida" | "perna" | "superiores" | "recovery" | "nutricao" | "chave";

export interface PlannedSession {
  /** id estável — sobrevive a mudanças de data */
  id: string;
  /** ISO YYYY-MM-DD */
  date: string;
  kind: SessionKind;
  text: string;
  /** lista de exercícios ou blocos, um por linha, quando a sessão tem */
  exercises?: string[];
  /** o porquê, quando existe. Renderizado logo abaixo da própria sessão */
  why?: string;
}

export interface Block {
  /** segunda-feira da semana, ISO */
  start: string;
  title: string;
  detail: string;
}
