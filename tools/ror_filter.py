"""Filtra el volcado ROR: type=education, sin EE. UU. -> data/catalog.json."""
import glob
import json
import os
import zipfile

RAIZ = os.path.join(os.path.dirname(__file__), "..", "data")


def campo(r, tipo, clave="value"):
    return next((x[clave] for x in r.get("links", []) if x["type"] == tipo), None)


def wikidata(r):
    for e in r.get("external_ids", []):
        if e["type"] == "wikidata":
            return e.get("preferred") or (e["all"][0] if e["all"] else None)
    return None


def convertir(r):
    loc = (r.get("locations") or [{}])[0].get("geonames_details", {})
    nombre = next((n["value"] for n in r["names"] if "ror_display" in n["types"]),
                  r["names"][0]["value"])
    return {
        "ror_id": r["id"].rsplit("/", 1)[-1],
        "nombre": nombre,
        "pais": loc.get("country_name"),
        "pais_codigo": loc.get("country_code"),
        "ciudad": loc.get("name"),
        "lat": loc.get("lat"),
        "lng": loc.get("lng"),
        "sitio_web": campo(r, "website"),
        "wikidata_id": wikidata(r),
    }


def main():
    z = zipfile.ZipFile(glob.glob(os.path.join(RAIZ, "raw", "*.zip"))[0])
    nombre = next(n for n in z.namelist() if n.endswith(".json"))
    datos = json.load(z.open(nombre))
    salida = []
    for r in datos:
        if "education" not in r["types"] or r.get("status") != "active":
            continue
        u = convertir(r)
        if u["pais_codigo"] != "US":
            salida.append(u)
    with open(os.path.join(RAIZ, "catalog.json"), "w", encoding="utf-8") as f:
        json.dump(salida, f, ensure_ascii=False)
    print(len(salida))


if __name__ == "__main__":
    main()
