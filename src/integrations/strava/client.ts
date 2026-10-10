/**
 * Cliente mínimo da API do Strava: OAuth e leitura.
 *
 * O Strava entra como fonte de leitura (ADR-0006): esforço relativo, tênis e
 * links. Os tokens moram na tabela `integrations`; o id e o segredo do app
 * moram nas variáveis de ambiente. Nada disso passa pelo modelo.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { integrations } from "@/db/schema";

const BASE = "https://www.strava.com";

export interface StravaTokens { access_token: string; refresh_token: string; expires_at: number; athlete?: { id: number } }

export interface StravaActivity {
  id: number;
  name: string;
  sport_type: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  suffer_score?: number | null;
  gear_id?: string | null;
  trainer?: boolean;
}

export interface StravaGear { id: string; name: string; distance: number; brand_name?: string; model_name?: string }

export function appConfigurado(): boolean {
  return !!(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET);
}

export function authorizeUrl(redirectUri: string): string {
  const q = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID ?? "",
    response_type: "code",
    redirect_uri: redirectUri,
    approval_prompt: "auto",
    scope: "read,activity:read_all,profile:read_all",
  });
  return `${BASE}/oauth/authorize?${q.toString()}`;
}

async function tokenRequest(body: Record<string, string>): Promise<StravaTokens> {
  const res = await fetch(`${BASE}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_id: process.env.STRAVA_CLIENT_ID, client_secret: process.env.STRAVA_CLIENT_SECRET, ...body }),
  });
  if (!res.ok) throw new Error(`strava oauth ${res.status}`);
  return (await res.json()) as StravaTokens;
}

async function guardar(t: StravaTokens): Promise<void> {
  if (!db) return;
  const row = {
    provider: "strava",
    athleteId: t.athlete ? String(t.athlete.id) : undefined,
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    expiresAt: new Date(t.expires_at * 1000),
    updatedAt: new Date(),
  };
  await db
    .insert(integrations)
    .values(row)
    .onConflictDoUpdate({ target: integrations.provider, set: { ...row, athleteId: row.athleteId ?? undefined } });
}

/** Troca o código do OAuth por tokens e guarda. */
export async function conectar(code: string): Promise<string | null> {
  const t = await tokenRequest({ code, grant_type: "authorization_code" });
  await guardar(t);
  return t.athlete ? String(t.athlete.id) : null;
}

/** Token válido, renovando quando faltar menos de um minuto. null = conta não ligada. */
export async function tokenValido(): Promise<string | null> {
  if (!db) return null;
  const [row] = await db.select().from(integrations).where(eq(integrations.provider, "strava"));
  if (!row?.refreshToken) return null;
  if (row.accessToken && row.expiresAt && row.expiresAt.getTime() > Date.now() + 60_000) return row.accessToken;
  const t = await tokenRequest({ refresh_token: row.refreshToken, grant_type: "refresh_token" });
  await guardar(t);
  return t.access_token;
}

async function get<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${BASE}/api/v3${path}`, { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`strava ${res.status} em ${path.split("?")[0]}`);
  return (await res.json()) as T;
}

/** Atividades depois de um instante (epoch em segundos), todas as páginas. */
export async function listarAtividades(token: string, afterEpoch: number): Promise<StravaActivity[]> {
  const out: StravaActivity[] = [];
  for (let page = 1; page <= 5; page++) {
    const lote = await get<StravaActivity[]>(token, `/athlete/activities?after=${afterEpoch}&per_page=100&page=${page}`);
    out.push(...lote);
    if (lote.length < 100) break;
  }
  return out;
}

export async function lerGear(token: string, id: string): Promise<StravaGear> {
  return get<StravaGear>(token, `/gear/${id}`);
}
