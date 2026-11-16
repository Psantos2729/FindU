"""Añade foto (P18 de Wikidata, enlace Commons) a data/catalog.json.
Sin imagen: enlace al sitio oficial. Nunca queda vacío. Reanudable."""
import json
import os
import time
import urllib.parse
import urllib.request

CAT = os.path.join(os.path.dirname(__file__), "..", "data", "catalog.json")
SPARQL = "https://query.wikidata.org/sparql"
UA = {"User-Agent": "uni-catalog/1.0 (uso personal)",
      "Accept": "application/sparql-results+json"}
LOTE = 50


def consultar(ids):
    valores = " ".join(f"wd:{i}" for i in ids)
    q = f"SELECT ?i ?img WHERE {{ VALUES ?i {{ {valores} }} ?i wdt:P18 ?img }}"
    datos = urllib.parse.urlencode({"query": q}).encode()
    for intento in range(3):
        try:
            req = urllib.request.Request(SPARQL, data=datos, headers=UA)
            with urllib.request.urlopen(req, timeout=90) as r:
                filas = json.load(r)["results"]["bindings"]
            res = {}
            for f in filas:  # una imagen por entidad (la primera)
                res.setdefault(f["i"]["value"].rsplit("/", 1)[-1], f["img"]["value"])
            return res
        except Exception as e:
            if intento == 2:
                raise
            time.sleep(5 * (intento + 1))


def asignar(u, imagenes):
    img = imagenes.get(u["wikidata_id"])
    if img:
        u["foto"], u["foto_tipo"] = img.replace("http://", "https://"), "commons"
    elif u.get("sitio_web"):
        u["foto"], u["foto_tipo"] = u["sitio_web"], "sitio_oficial"
    else:
        u["foto"], u["foto_tipo"] = f"https://ror.org/{u['ror_id']}", "ror"


def main():
    cat = json.load(open(CAT, encoding="utf-8"))
    pend = [u["wikidata_id"] for u in cat if u["wikidata_id"] and "foto" not in u]
    imagenes = {}
    for i in range(0, len(pend), LOTE):
        imagenes.update(consultar(pend[i:i + LOTE]))
        time.sleep(1)
    for u in cat:
        if "foto" not in u:
            asignar(u, imagenes)
    json.dump(cat, open(CAT, "w", encoding="utf-8"), ensure_ascii=False)
    tipos = {}
    for u in cat:
        tipos[u["foto_tipo"]] = tipos.get(u["foto_tipo"], 0) + 1
    print(tipos)


if __name__ == "__main__":
    main()
