"""Cruza rankings QS (data/rankings/qs-*.csv) y game-design.txt con catalog.json
y escribe data/shortlist.json (~200 únicas, sin EE. UU.).
CSV: columnas nombre,pais,posicion (posicion texto: "=23", "101-150" -> límite inferior)."""
import csv
import difflib
import json
import os
import re
import sys
import unicodedata

RAIZ = os.path.join(os.path.dirname(__file__), "..", "data")
ARCHIVOS = {"qs-cs.csv": "computer-science", "qs-ds-ai.csv": "data-science-ia",
            "qs-eee.csv": "computer-engineering"}
GAME = os.path.join(RAIZ, "manual", "game-design.txt")
OBJETIVO = 200
ALIAS_PAIS = {"uk": "united kingdom", "usa": "united states", "korea": "south korea",
              "united states of america": "united states", "hong kong sar": "hong kong",
              "china mainland": "china", "russia": "russian federation",
              "republic of korea": "south korea", "hong kong sar china": "hong kong",
              "taiwan china": "taiwan", "turkiye": "turkey", "czechia": "czech republic"}


def clave(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return " ".join(re.sub(r"[^a-z0-9 ]+", " ", s).split())


def pais(s):
    c = clave(s)
    return ALIAS_PAIS.get(c, c)


def simple(nombre):
    """Nombre sin paréntesis ni 'The' inicial."""
    n = re.sub(r"\([^)]*\)", " ", nombre or "")
    return re.sub(r"^the ", "", clave(n))


def buscar(nombre, pais_txt, por_pais):
    """Coincidencia exacta; si no, la más parecida (>=0.9) del mismo país."""
    cands = por_pais.get(pais(pais_txt), {})
    n = simple(nombre)
    if n in cands:
        return cands[n]
    cerca = difflib.get_close_matches(n, list(cands), n=1, cutoff=0.9)
    return cands[cerca[0]] if cerca else None


def posicion(txt):
    m = re.search(r"\d+", txt or "")
    return int(m.group()) if m else 9999


def leer(ruta):
    """Filas con nombre/pais/posicion. Acepta cabeceras 'Nombre/País/Posición'
    o las de QS en inglés ('INSTITUTION', 'COUNTRY/TERRITORY', año en la 1a columna)."""
    with open(ruta, encoding="utf-8-sig", newline="") as f:
        filas = list(csv.reader(f))
    for i, fila in enumerate(filas):
        cab = [clave(c) for c in fila]
        n = next((j for j, c in enumerate(cab) if c in ("nombre", "institution")), None)
        if n is None:
            continue
        pa = next((j for j, c in enumerate(cab) if c in ("pais", "country territory")), None)
        po = cab.index("posicion") if "posicion" in cab else 0
        return [{"nombre": r[n], "pais": r[pa] if pa is not None else "", "posicion": r[po]}
                for r in filas[i + 1:] if len(r) > n and r[n]]
    return None


def main():
    cat = json.load(open(os.path.join(RAIZ, "catalog.json"), encoding="utf-8"))
    por_pais = {}
    for u in cat:
        por_pais.setdefault(pais(u["pais"]), {})[simple(u["nombre"])] = u
    por_n = {}
    for u in cat:
        por_n.setdefault(clave(u["nombre"]), []).append(u)
    cand, falta, sin_match = {}, [], 0

    def agregar(u, area, pos, texto=""):
        e = cand.setdefault(u["ror_id"], {**u, "areas": {}, "pos_texto": {}})
        e["areas"][area] = pos
        e["pos_texto"][area] = texto

    for arch, area in ARCHIVOS.items():
        ruta = os.path.join(RAIZ, "rankings", arch)
        if not os.path.exists(ruta):
            falta.append(arch)
            continue
        filas = leer(ruta)
        if filas is None:
            falta.append(f"{arch} (sin columna nombre)")
            continue
        for fila in filas:
            u = buscar(fila["nombre"], fila.get("pais", ""), por_pais)
            if u:
                agregar(u, area, posicion(fila["posicion"]), fila["posicion"].strip())
            else:
                sin_match += 1
    if os.path.exists(GAME):
        for linea in open(GAME, encoding="utf-8"):
            hit = por_n.get(clave(linea))
            if hit and len(hit) == 1:
                agregar(hit[0], "game-design", 0)
            elif linea.strip():
                sin_match += 1
    else:
        falta.append("manual/game-design.txt")
    corto = [e for e in cand.values() if e["pais_codigo"] != "US"]
    corto.sort(key=lambda e: (min(e["areas"].values()), -len(e["areas"])))
    corto = corto[:OBJETIVO]
    json.dump(corto, open(os.path.join(RAIZ, "shortlist.json"), "w", encoding="utf-8"),
              ensure_ascii=False)
    print(f"shortlist: {len(corto)} | sin match: {sin_match} | faltan: {falta}")


if __name__ == "__main__":
    main()
