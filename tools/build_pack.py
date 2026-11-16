"""Arma el pack 'catalogo-qs' desde data/shortlist.json y data/costs/*.json.
Escribe data/universidades/<id>.json (nuevas; reutiliza las que ya existen por dominio),
data/packs/catalogo-qs.json y lo registra en data/packs/index.json. Sin inventar cifras."""
import json
import re
import urllib.parse
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
HOY = "2026-11-16"
QS_URL = "https://www.topuniversities.com/university-subject-rankings"
AREAS = {
    "computer-science": ("Computer Science", ["computer-science"], "QS 2026 Computer Science"),
    "data-science-ia": ("Data Science e IA", ["data-science", "inteligencia-artificial"],
                        "QS 2026 Data Science & AI"),
    "computer-engineering": ("Ingeniería eléctrica y electrónica (QS EEE)", ["computer-engineering"],
                             "QS 2026 Electrical & Electronic Engineering"),
}
PEND = "Sin dato: pendiente de barrido; no verificado en fuente oficial"


def leer(ruta):
    return json.loads(Path(ruta).read_text(encoding="utf-8"))


def escribir(ruta, obj):
    Path(ruta).write_text(json.dumps(obj, ensure_ascii=False, indent=1), encoding="utf-8")


def host(url):
    return urllib.parse.urlparse(url or "").netloc.lower().removeprefix("www.")


def slug(nombre):
    s = re.sub(r"[^a-z0-9]+", "-", nombre.lower().encode("ascii", "ignore").decode()).strip("-")
    return s[:40].strip("-") or "uni"


def posicion(txt):
    t = txt.replace("=", "").strip()
    if re.fullmatch(r"\d+", t):
        return int(t)
    return t.replace("-", "–")


def existentes():
    """host de sitio_web -> ruta relativa de universidades ya escritas por Paolo."""
    res = {}
    for f in (DATA / "universidades").glob("*.json"):
        res[host(leer(f).get("sitio_web"))] = f"universidades/{f.name}"
    return res


def costo(c):
    """Bloque costo_anual y sin_dato a partir de data/costs/<ror>.json (o vacío)."""
    sin = {}
    if not c:
        sin["costo_anual"] = PEND
        return {"matricula": {"valor": None}, "moneda": None, "anio_academico": None, "nota": None}, sin
    ca = c["costo_anual"]
    m = ca["matricula"]
    bloque = {"matricula": {k: m[k] for k in ("valor", "fuente", "verificado_en", "usd", "aproximado") if k in m},
              "moneda": ca.get("moneda"), "anio_academico": ca.get("anio_academico") or "Sin dato",
              "nota": ca.get("nota")}
    if ca.get("aproximado") and m.get("valor") is not None:
        bloque["matricula"]["aproximado"] = True
    if ca.get("matricula_rango"):
        bloque["matricula_rango"] = ca["matricula_rango"]
    if m.get("valor") is None:
        r = ca.get("matricula_rango")
        extra = f" Rango en la fuente: {r['min']}–{r['max']} {ca.get('moneda')}." if r else ""
        sin["costo_anual"] = (c.get("sin_dato", {}).get("costo_anual") or PEND) + extra
        if not r:
            bloque["moneda"], bloque["anio_academico"] = None, None
    return bloque, sin


def universidad(u, uid, c):
    costo_b, sin = costo(c)
    mejor = min(u["areas"], key=lambda a: u["areas"][a])
    carreras = [{"nombre": f"{AREAS[a][0]} (programa exacto por confirmar)", "areas": AREAS[a][1],
                 "idioma": None, "duracion_anios": None, "url": u["sitio_web"]} for a in u["areas"]
                if a in AREAS]
    becas = [{"nombre": b["nombre"], "cobertura": b.get("cobertura"), "convocatoria": None,
              "via_indesgua": None, "url": b["url"], "verificado_en": HOY} for b in (c or {}).get("becas", [])]
    if not becas:
        sin["becas"] = (c or {}).get("sin_dato", {}).get("becas") or PEND
    sin.update({"aceptacion.tasa_pct": PEND, "rankings.mundial": PEND})
    return {
        "id": uid, "nombre": u["nombre"], "ciudad": u["ciudad"] or "Sin dato", "pais": u["pais"],
        "sitio_web": u["sitio_web"], "carreras": carreras, "costo_anual": costo_b,
        "aceptacion": {"tasa_pct": {"valor": None}, "ambito": None},
        "rankings": {"mundial": {"posicion": None},
                     "especialidad": {"sistema": AREAS[mejor][2], "anio": 2026,
                                      "posicion": posicion(u["pos_texto"][mejor]), "fuente": QS_URL,
                                      "verificado_en": HOY}},
        "requisitos": {"sat": {}, "ingles": {}, "gpa_referencia": None, "tipo_admision": None,
                       "nota": "Requisitos pendientes de barrido."},
        "becas": becas, "fotos_busqueda": f"{u['nombre']} campus", "fotos": [],
        "fotos_enlace": u["foto"],
        "alertas": [{"nivel": "tomar-en-cuenta",
                     "texto": "Ficha base: ranking QS tomado del CSV; costos, aceptación y requisitos sin verificar."}],
        "sin_dato": sin,
    }


def main():
    short = leer(DATA / "shortlist.json")
    ya, usados, rutas, nuevas = existentes(), set(), [], 0
    for u in short:
        h = host(u["sitio_web"])
        if h in ya:
            rutas.append(ya[h])
            continue
        uid = slug(u["nombre"])
        if uid in usados:
            uid = f"{uid}-{u['pais_codigo'].lower()}"
        while uid in usados or (DATA / "universidades" / f"{uid}.json").exists():
            uid += "-2"
        usados.add(uid)
        cf = DATA / "costs" / f"{u['ror_id']}.json"
        escribir(DATA / "universidades" / f"{uid}.json", universidad(u, uid, leer(cf) if cf.exists() else None))
        rutas.append(f"universidades/{uid}.json")
        nuevas += 1
    pack = {"id": "catalogo-qs", "nombre": "Catálogo QS (CS, Data Science e IA, Ingeniería)",
            "descripcion": "Universidades fuera de EE. UU. mejor ubicadas en QS 2026 por materia. Ficha base: costos y requisitos en verificación.",
            "area_foco": None, "universidades": list(dict.fromkeys(rutas))}
    lista = pack.pop("universidades")
    cuerpo = json.dumps(pack, ensure_ascii=False, indent=1)[:-2]  # sin el cierre final
    filas = [", ".join(json.dumps(r) for r in lista[i:i + 4]) for i in range(0, len(lista), 4)]
    nl = chr(10)
    texto = (cuerpo + "," + nl + ' "universidades": [' + nl + "  " + ("," + nl + "  ").join(filas)
             + nl + " ]" + nl + "}" + nl)
    (DATA / "packs" / "catalogo-qs.json").write_text(texto, encoding="utf-8")
    pack["universidades"] = lista
    idx = leer(DATA / "packs" / "index.json")
    if not any(p["id"] == "catalogo-qs" for p in idx["packs"]):
        idx["packs"].append({"id": "catalogo-qs", "archivo": "catalogo-qs.json"})
        escribir(DATA / "packs" / "index.json", idx)
    print(f"pack: {len(pack['universidades'])} universidades ({nuevas} nuevas, {len(rutas) - nuevas} reutilizadas)")


if __name__ == "__main__":
    main()
