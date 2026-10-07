import {
  ABDOMINAL,
  CORRIDA,
  DIAS,
  FORCA,
  FORCA_DO_DIA,
  INICIO,
  SEMANAS,
} from "./ciclo-bau";
import type { PlannedSession } from "./types";

/**
 * Expande o modelo do ciclo em sessões datadas.
 *
 * O modelo é template — 25 semanas × 7 dias da semana. Aqui ele vira o que o
 * bot manda de manhã e o que sobe no relógio. É uma função pura: mesmo
 * modelo, mesmas sessões, sempre.
 */

const DIAMS = 86_400_000;

function somaDias(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * O modelo guarda os passos com <b> e <em> porque o dash renderiza HTML.
 * A sessão expandida vai para o Telegram, onde o formatador escapa tudo — e
 * a tag apareceria literal como &lt;b&gt;. Aqui o texto sai limpo.
 */
function semTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** "esteira ↗" vira só o terreno; o resto do rótulo é ruído na mensagem. */
const TERRENO: Record<string, string> = {
  rua: "rua",
  esteira: "esteira",
  trilha: "trilha",
  leve: "leve",
};

const ehPerna = (cod: string) => cod.startsWith("P");

/**
 * `diasDeProva` são as datas em que a prova é a sessão do dia. O modelo é um
 * template de 25 × 7 e não sabe de prova nenhuma: sem isto, 20/03/2027 sai com
 * a prova, mais 7,8 km de trilha, mais academia de braço — três sessões no dia
 * mais importante do ciclo. A prova substitui o dia inteiro, corrida e força.
 */
export function expandirCiclo(
  diasDeProva: ReadonlySet<string> = new Set<string>(),
): PlannedSession[] {
  const out: PlannedSession[] = [];

  SEMANAS.forEach((sem, w) => {
    const ws = String(w + 1).padStart(2, "0");

    sem.dias.forEach((dia, i) => {
      const date = somaDias(INICIO, w * 7 + i);
      if (diasDeProva.has(date)) return;
      const nomeDia = DIAS[i] ?? dia.d;

      /* ---- corrida ---- */
      const tplKey = dia.s && CORRIDA[dia.s] ? dia.s : nomeDia;
      const tpl = CORRIDA[tplKey];
      if (tpl) {
        const km = dia.km ? `${String(dia.km).replace(".", ",")} km` : null;
        const terreno = TERRENO[dia.t] ?? dia.t;
        const titulo = [tpl.n, km, terreno].filter(Boolean).join(" · ");
        const presc = tpl.presc[sem.b];

        out.push({
          id: `w${ws}-${nomeDia}-c`,
          date,
          kind: tplKey === "teste" ? "chave" : "corrida",
          text: titulo,
          exercises: tpl.passos.map(semTags),
          ...(presc ? { why: presc } : {}),
        });
      }

      /* ---- força ---- */
      const cod = nomeDia ? FORCA_DO_DIA[nomeDia] : undefined;
      const f = cod ? FORCA[cod] : undefined;
      if (cod && f) {
        // o abdominal do dia troca por dia da semana, pelo getDay() (dom = 0)
        const abd = ABDOMINAL[(i + 1) % 7] ?? ABDOMINAL[0]!;
        out.push({
          id: `w${ws}-${nomeDia}-f`,
          date,
          kind: ehPerna(cod) ? "perna" : "superiores",
          text: f.nome,
          exercises: f.ex.map((e) =>
            e.n === "Abdominal do dia" ? `Abdominal do dia: ${abd}` : `${e.n} — ${e.s}`,
          ),
          why: f.tip,
        });
      }
    });
  });

  return out;
}
