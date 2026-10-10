#!/usr/bin/env python3
"""
Atualiza o retrato do COROS e do Strava em src/prumo/estatico.json.

Quem chama é a rotina diária (tarefa agendada no app Claude): ela lê os
conectores e grava os arquivos de entrada em .prumo-refresh/. Este script é
determinístico: valida, mescla e recalcula o fitness (modelo do Strava,
esforço relativo com médias exponenciais de 42 e 7 dias). O modelo não calcula
nada; ele só transcreve.

Entradas (todas opcionais; o que faltar é mantido como está):
  .prumo-refresh/coros-sono.json   [[dia, nota, min_dormindo, min_na_cama, profundo%, leve%, rem%, acordado%, deitou "HH:MM", levantou "HH:MM", soneca_min], ...]
  .prumo-refresh/coros-hrv.json    [[dia, hrv, faixa_min, faixa_max, base, "acima"|"normal"|"abaixo"], ...]
  .prumo-refresh/coros-fit.json    {"vo2": 53, "nivel": 81, "limiar": "4:42", "prev": {"5k": 1352, "10k": 2811, "21k": 6314, "42k": 13365}}
  .prumo-refresh/strava-atividades.json  [{"d": "2026-10-10", "id": "123", "tipo": "Run", "nome": "...", "re": 112, "km": 14.3, "dplus": 116, "gear": "33501910", "trainer": false}, ...]
  .prumo-refresh/strava-tenis.json [{"id": "33501910", "km": 61.9}, ...]   (só os pares que mudaram)
  .prumo-refresh/strava-forca.json [{"d": "2026-10-08", "id": "123", "sets": [["Puxada", 70, 9], ...]}, ...]

Uso: python3 scripts/prumo-refresh.py [--hoje YYYY-MM-DD] [--check]
"""
import io, json, math, os, sys, datetime as dt

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EST = os.path.join(REPO, "src", "prumo", "estatico.json")
IN = os.path.join(REPO, ".prumo-refresh")

def carregar(nome):
    p = os.path.join(IN, nome)
    if not os.path.exists(p):
        return None
    with io.open(p, encoding="utf-8") as f:
        return json.load(f)

def dia_ok(s):
    try:
        dt.date.fromisoformat(s); return True
    except Exception:
        return False

def falha(msg):
    print("FALHA:", msg); sys.exit(2)

def main():
    args = sys.argv[1:]
    hoje = dt.date.today().isoformat()
    if "--hoje" in args: hoje = args[args.index("--hoje") + 1]
    check = "--check" in args
    E = json.load(io.open(EST, encoding="utf-8"))
    mudou = []

    # ---- COROS: sono ----
    sono = carregar("coros-sono.json")
    if sono:
        for r in sono:
            if not (isinstance(r, list) and len(r) >= 10 and dia_ok(r[0])): falha("coros-sono: linha inválida " + str(r)[:80])
            if not (0 <= r[1] <= 100 and 0 <= r[2] <= 900 and 0 <= r[3] <= 1000): falha("coros-sono: valores fora da faixa em " + r[0])
        atual = {r[0]: r for r in E["coros"]["sono"]}
        for r in sono: atual[r[0]] = r + ([0] if len(r) == 10 else [])
        E["coros"]["sono"] = [atual[k] for k in sorted(atual)][-14:]
        mudou.append("sono até " + E["coros"]["sono"][-1][0])

    # ---- COROS: HRV ----
    hrv = carregar("coros-hrv.json")
    if hrv:
        for r in hrv:
            if not (isinstance(r, list) and len(r) == 6 and dia_ok(r[0]) and 20 <= r[1] <= 200 and r[5] in ("acima", "normal", "abaixo")): falha("coros-hrv: linha inválida " + str(r)[:80])
        atual = {r[0]: r for r in E["coros"]["hrv"]}
        for r in hrv: atual[r[0]] = r
        E["coros"]["hrv"] = [atual[k] for k in sorted(atual)][-7:]
        mudou.append("hrv até " + E["coros"]["hrv"][-1][0])

    # ---- COROS: condicionamento e previsões ----
    fit = carregar("coros-fit.json")
    if fit:
        if not (30 <= fit.get("vo2", 0) <= 90 and isinstance(fit.get("prev"), dict)): falha("coros-fit inválido")
        for k, v in fit["prev"].items():
            if not (600 <= v <= 40000): falha("coros-fit: previsão fora da faixa " + k)
        E["coros"]["fit"] = {"vo2": fit["vo2"], "nivel": fit.get("nivel", E["coros"]["fit"].get("nivel")), "limiar": fit.get("limiar", E["coros"]["fit"].get("limiar")), "prev": fit["prev"]}
        E["coros"]["lido"] = hoje
        prev = {p["d"]: p for p in E.get("previsoes", [])}
        prev[hoje] = dict({"d": hoje}, **fit["prev"])
        E["previsoes"] = [prev[k] for k in sorted(prev)]
        mudou.append("previsões de " + hoje)

    # ---- Strava: atividades (esforço relativo, tênis em uso, links) ----
    acts = carregar("strava-atividades.json")
    if acts:
        re_dia = {}
        for a in acts:
            if not (dia_ok(a.get("d", "")) and 0 <= float(a.get("re") or 0) <= 1500): falha("strava-atividades: linha inválida " + str(a)[:80])
            re_dia[a["d"]] = re_dia.get(a["d"], 0) + int(round(float(a.get("re") or 0)))
        st = E["strava"]
        st.setdefault("re", {})
        for d, v in re_dia.items(): st["re"][d] = v
        # dias dentro da janela sem atividade = 0 (a janela é o intervalo das atividades enviadas até hoje)
        d0 = min(re_dia) if re_dia else hoje
        cur = dt.date.fromisoformat(d0)
        while cur.isoformat() <= hoje:
            st["re"].setdefault(cur.isoformat(), 0); cur += dt.timedelta(days=1)
        for a in acts:
            if a.get("gear"): st.setdefault("usoTenis", {})[a["d"]] = str(a["gear"])
            if a.get("id") and str(a.get("tipo", "")).lower() in ("run", "trailrun"): st.setdefault("corridasStrava", {})[a["d"]] = str(a["id"])
        mudou.append("esforço relativo de %d dias" % len(re_dia))

    # ---- Strava: km dos tênis ----
    tenis = carregar("strava-tenis.json")
    if tenis:
        por_id = {t["id"]: t for t in E["strava"]["tenis"]}
        for t in tenis:
            if str(t["id"]) in por_id and 0 <= float(t["km"]) <= 5000: por_id[str(t["id"])]["km"] = round(float(t["km"]), 1)
            else: print("aviso: tênis desconhecido ou km fora da faixa:", t)
        mudou.append("km de %d pares" % len(tenis))

    # ---- Strava: séries de força ----
    forca = carregar("strava-forca.json")
    if forca:
        por_dia = {f["d"]: f for f in E["strava"]["forca"]}
        for f in forca:
            if not (dia_ok(f.get("d", "")) and isinstance(f.get("sets"), list)): falha("strava-forca inválido " + str(f)[:80])
            for s_ in f["sets"]:
                if not (isinstance(s_, list) and len(s_) == 3 and isinstance(s_[0], str)): falha("strava-forca: série inválida " + str(s_))
            por_dia[f["d"]] = {"d": f["d"], "id": str(f.get("id", "")), "sets": f["sets"]}
        E["strava"]["forca"] = [por_dia[k] for k in sorted(por_dia)]
        mudou.append("força de %d sessões" % len(forca))

    # ---- fitness: recalculado inteiro a partir do esforço relativo ----
    RE = E["strava"].get("re", {})
    if RE:
        k42, k7 = 1 - math.exp(-1 / 42), 1 - math.exp(-1 / 7)
        f = a = 0.0; serie = []
        cur = dt.date.fromisoformat(min(RE)); fim = dt.date.fromisoformat(hoje)
        while cur <= fim:
            v = RE.get(cur.isoformat(), 0); f += (v - f) * k42; a += (v - a) * k7
            serie.append([cur.isoformat(), round(f, 1), round(a, 1)]); cur += dt.timedelta(days=1)
        E["strava"]["fitness"] = serie
        E["strava"]["lido"] = hoje

    resumo = "; ".join(mudou) if mudou else "nada para atualizar"
    if check:
        print("ok (sem gravar):", resumo); return
    io.open(EST, "w", encoding="utf-8").write(json.dumps(E, ensure_ascii=False, separators=(",", ":")))
    print("estatico.json atualizado:", resumo, "· fitness hoje", E["strava"]["fitness"][-1] if RE else "—")

if __name__ == "__main__":
    main()
