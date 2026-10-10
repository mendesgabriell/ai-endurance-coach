/**
 * Previsto × realizado, por semana e por tipo de treino.
 *
 * O previsto vem de src/plan/previsto-congelado.json — a semana como estava
 * publicada na segunda em que começou. O realizado vem do intervals.icu. O
 * resultado é gravado em public/dash.html como `var PXR`, um instantâneo: ele
 * só muda quando este script roda de novo.
 *
 *   node --env-file=.env scripts/previsto-realizado.mjs
 *
 * Isto é o embrião da rotina R9 (conformidade) da infra. Quando ela existir,
 * o Prumo calcula o mesmo ao vivo e este script deixa de ser necessário.
 */
import fs from "node:fs";

const INICIO = new Date(Date.UTC(2026, 8, 28));
const DIA = 864e5;
const iso = (d) => d.toISOString().slice(0, 10);
const DOW = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

// teto do fácil e piso do forte; o meio é zona cinza (Seiler)
const FACIL_ATE = 142, FORTE_DESDE = 152;
// caminhada não é treino (revisão do Prumo, 07/10): < 4 km e ritmo de 10:00/km ou mais lento
const ehCaminhada = (km, seg) => km < 4 && seg / km >= 600;

const CAT_DO_DIA = { seg: "rodagem", ter: "subida", qua: "qualidade", qui: "subida", sex: "rodagem", "sáb": "trilha", dom: "rodagem" };
const CAT_DO_TEMPLATE = { seg: "rodagem", sex: "rodagem", dom: "rodagem", teste: "qualidade", ter: "subida", qui: "subida", "sáb": "trilha", qua: "qualidade" };
const CATS = ["rodagem", "qualidade", "subida", "trilha"];

const congelado = JSON.parse(fs.readFileSync("src/plan/previsto-congelado.json", "utf8")).semanas;
const htmlPath = "public/dash.html";
let html = fs.readFileSync(htmlPath, "utf8");
const D = JSON.parse(/var D=(\[.*?\]);\n/s.exec(html)[1]);

const semanas = Object.keys(congelado).map(Number).sort((a, b) => a - b);
const primeiro = new Date(INICIO.getTime() + (semanas[0] - 1) * 7 * DIA);
const ultimo = new Date(INICIO.getTime() + (semanas.at(-1) * 7 - 1) * DIA);

const key = process.env.INTERVALS_API_KEY, atleta = process.env.INTERVALS_ATHLETE_ID;
if (!key || !atleta) throw new Error("faltam INTERVALS_API_KEY / INTERVALS_ATHLETE_ID no ambiente");
const auth = { Authorization: "Basic " + Buffer.from("API_KEY:" + key).toString("base64") };
const resp = await fetch(`https://intervals.icu/api/v1/athlete/${atleta}/activities?oldest=${iso(primeiro)}&newest=${iso(ultimo)}`, { headers: auth });
if (!resp.ok) throw new Error(`intervals respondeu ${resp.status}`);
const atividades = (await resp.json()).filter((a) => /^(Run|TrailRun)$/.test(a.type || ""));

const hojeSP = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const vazio = () => Object.fromEntries(CATS.map((c) => [c, { km: 0, n: 0, dp: 0 }]));
const r1 = (x) => Math.round(x * 10) / 10;

const saida = semanas.map((w) => {
  const prev = congelado[w];
  const ini = new Date(INICIO.getTime() + (w - 1) * 7 * DIA);
  const datas = DOW.map((_, j) => iso(new Date(ini.getTime() + j * DIA)));

  const P = vazio();
  for (const d of prev.dias) { if (!d.km) continue; P[d.cat].km += d.km; P[d.cat].n += 1; P[d.cat].dp += d.dp; }

  const R = vazio(), zonas = { facil: 0, cinza: 0, forte: 0 }, detalhe = [];
  const cam = { n: 0, dp: 0 };
  let fora = 0;
  for (const a of atividades) {
    const data = (a.start_date_local || "").slice(0, 10);
    const j = datas.indexOf(data);
    if (j < 0) continue;
    const km = (a.distance || 0) / 1000, seg = a.moving_time || 0, fc = Math.round(a.average_heartrate || 0);
    if (ehCaminhada(km, seg)) {
      // na esteira o relógio erra a inclinação: o D+ sai da prescrição (10%)
      const dp = Math.round(km * 1000 * 0.10);
      cam.n += 1; cam.dp += dp;
      detalhe.push({ data, cat: "caminhada", km: r1(km), dp, fc });
      continue;
    }
    let cat;
    if (a.type === "TrailRun") cat = "trilha";
    else if (a.trainer) cat = CAT_DO_DIA[DOW[j]] === "subida" ? "subida" : "rodagem";
    else cat = fc >= FORTE_DESDE ? "qualidade" : "rodagem";
    const dp = a.trainer ? (cat === "subida" ? prev.dias[j].dp : 0) : Math.round(a.total_elevation_gain || 0);
    R[cat].km += km; R[cat].n += 1; R[cat].dp += dp;
    if (fc) { if (fc <= FACIL_ATE) zonas.facil += km; else if (fc < FORTE_DESDE) zonas.cinza += km; else zonas.forte += km; }
    if (cat === "rodagem" && fc > FACIL_ATE) fora += 1;
    detalhe.push({ data, cat, km: r1(km), dp, fc });
  }

  // o que ainda está por fazer, na semana corrente, segundo o plano replanejado
  let fazer = null;
  const semanaD = D[w - 1];
  if (hojeSP >= datas[0] && hojeSP <= datas[6] && semanaD) {
    fazer = vazio();
    semanaD.dias.forEach((d, j) => {
      if (d.f || datas[j] < hojeSP) return;
      if (detalhe.some((x) => x.data === datas[j] && x.cat !== "caminhada")) return;
      const cat = d.t === "trilha" ? "trilha" : (d.s ? CAT_DO_TEMPLATE[d.s] : CAT_DO_DIA[d.d]) || "rodagem";
      fazer[cat].km += d.km; fazer[cat].n += 1; fazer[cat].dp += d.dp || 0;
    });
  }

  const soma = (o, k) => CATS.reduce((t, c) => t + o[c][k], 0);
  const arred = (o) => { for (const c of CATS) { o[c].km = r1(o[c].km); } return o; };
  return {
    sem: w, dt: prev.dt,
    prev: { ...arred(P), km: r1(soma(P, "km")), dp: soma(P, "dp"), cam: prev.caminhada },
    real: { ...arred(R), km: r1(soma(R, "km")), dp: soma(R, "dp"), cam },
    fazer: fazer && { ...arred(fazer), km: r1(soma(fazer, "km")), dp: soma(fazer, "dp") },
    zonas: { facil: r1(zonas.facil), cinza: r1(zonas.cinza), forte: r1(zonas.forte) },
    fora, detalhe,
  };
});

const agora = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(new Date());
const linha = "var PXR=" + JSON.stringify({ atualizado: agora, semanas: saida }) + ";\n";
if (/var PXR=.*;\n/.test(html)) html = html.replace(/var PXR=.*;\n/, () => linha);
else html = html.replace(/(var TIPO=[^\n]*\n)/, (m) => m + linha);
fs.writeFileSync(htmlPath, html);

for (const s of saida) {
  const f = s.fazer ? ` · a fazer ${s.fazer.km} km` : "";
  console.log(`Sem ${s.sem}: previsto ${s.prev.km} km / ${s.prev.dp} m · realizado ${s.real.km} km / ${s.real.dp} m${f} · caminhadas ${s.real.cam.n}/${s.prev.cam.sessoes} · rodagens fora da faixa ${s.fora}`);
}
