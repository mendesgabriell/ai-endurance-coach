export type SessionKind = "corrida" | "perna" | "superiores" | "recovery" | "nutricao" | "chave";

export interface PlannedSession {
  /** id estável — sobrevive a mudanças de data */
  id: string;
  /** ISO YYYY-MM-DD */
  date: string;
  kind: SessionKind;
  text: string;
  /** o porquê, quando existe. Vai no rodapé da mensagem, não no corpo */
  why?: string;
}

export interface Block {
  /** segunda-feira da semana, ISO */
  start: string;
  title: string;
  detail: string;
}
