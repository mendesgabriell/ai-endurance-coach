/**
 * Cliente mínimo da API do intervals.icu.
 *
 * Auth é HTTP Basic com usuário literal "API_KEY" e senha = a chave gerada em
 * Settings > Developer. Não é OAuth, não tem fluxo de consentimento: é chave
 * pessoal do atleta. Ver docs/adr/0006.
 */
const BASE = "https://intervals.icu/api/v1";

export interface IntervalsEvent {
  /** ISO local, tem que terminar em T00:00:00 */
  start_date_local: string;
  category: "WORKOUT" | "NOTE";
  /** tipo de atividade: Run, Ride, WeightTraining, ... */
  type?: string;
  name: string;
  description?: string;
  moving_time?: number;
  /** nosso id do plano — a âncora de idempotência */
  external_id?: string;
}

export interface StoredEvent extends IntervalsEvent {
  id: number;
}

function auth(key: string): string {
  return `Basic ${Buffer.from(`API_KEY:${key}`).toString("base64")}`;
}

export class IntervalsClient {
  constructor(
    private readonly athleteId: string,
    private readonly apiKey: string,
  ) {}

  private async call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE}/athlete/${this.athleteId}${path}`, {
      ...init,
      headers: {
        Authorization: auth(this.apiKey),
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
    if (!res.ok) {
      throw new Error(`intervals.icu ${init.method ?? "GET"} ${path} → ${res.status} ${await res.text()}`);
    }
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  }

  listEvents(oldest: string, newest: string): Promise<StoredEvent[]> {
    return this.call<StoredEvent[]>(`/events?oldest=${oldest}&newest=${newest}`);
  }

  createEvent(event: IntervalsEvent): Promise<StoredEvent> {
    return this.call<StoredEvent>("/events", { method: "POST", body: JSON.stringify(event) });
  }

  deleteEvent(id: number): Promise<void> {
    return this.call<void>(`/events/${id}`, { method: "DELETE" });
  }
}
