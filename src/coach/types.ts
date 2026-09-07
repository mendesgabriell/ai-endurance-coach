/** Um turno da conversa, como fica guardado em `messages`. */
export interface Turn {
  role: "user" | "assistant";
  content: string;
}
