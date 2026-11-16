"""Valida los packs de universidades contra el esquema de data/schema.md.

Uso:  python scripts/validate_pack.py            (todos los packs registrados)
      python scripts/validate_pack.py <id-pack>  (solo uno)
"""
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DATA = RAIZ / "data"
AREAS = {"computer-science", "inteligencia-artificial", "software-engineering",
         "computer-engineering", "data-science", "game-design", "ciberseguridad", "cs-business"}
NIVELES_ALERTA = {"riesgo", "tomar-en-cuenta"}
TIPOS_ADMISION = {None, "numerica", "holistica", "prueba-propia", "abierta"}
FECHA = re.compile(r"^\d{4}-\d{2}-\d{2}$")
OBLIGATORIOS = ["id", "nombre", "ciudad", "pais", "carreras", "costo_anual", "aceptacion",
                "rankings", "requisitos", "becas", "fotos"]


def leer(ruta: Path):
    return json.loads(ruta.read_text(encoding="utf-8"))


def revisar_dato(dato, ruta, uni, errores, clave_valor="valor", razon=None):
    """Un dato con valor exige fuente y fecha; un dato vacío exige una razón en sin_dato."""
    if not isinstance(dato, dict):
        errores.append(f"{ruta}: debe ser un objeto con fuente y verificado_en")
        return
    if dato.get(clave_valor) is None:
        claves = [ruta, razon] if razon else [ruta]
        if not any(c in uni.get("sin_dato", {}) for c in claves):
            errores.append(f"{ruta}: está vacío y falta su razón en sin_dato")
        return
    if not dato.get("fuente"):
        errores.append(f"{ruta}: tiene valor pero no fuente")
    if not FECHA.match(str(dato.get("verificado_en"))):
        errores.append(f"{ruta}: verificado_en debe ser una fecha AAAA-MM-DD")


def revisar_universidad(uni, monedas):
    errores = []
    for campo in OBLIGATORIOS:
        if campo not in uni:
            errores.append(f"falta el campo {campo}")
    if errores:
        return errores

    if not re.match(r"^[a-z0-9-]+$", uni["id"]):
        errores.append("id: solo minúsculas, números y guiones")
    if not uni["carreras"]:
        errores.append("carreras: debe tener al menos una")
    for i, carrera in enumerate(uni["carreras"]):
        if not carrera.get("nombre"):
            errores.append(f"carreras[{i}]: falta nombre")
        desconocidas = set(carrera.get("areas", [])) - AREAS
        if not carrera.get("areas") or desconocidas:
            errores.append(f"carreras[{i}].areas: vacío o con áreas desconocidas {sorted(desconocidas)}")

    costo = uni["costo_anual"]
    revisar_dato(costo.get("matricula"), "costo_anual.matricula", uni, errores, razon="costo_anual")
    if costo.get("vida", {}).get("valor") is not None:
        revisar_dato(costo["vida"], "costo_anual.vida", uni, errores)
    if costo.get("moneda") not in monedas:
        errores.append(f"costo_anual.moneda: {costo.get('moneda')} no está en data/tipos_cambio.json")
    if not costo.get("anio_academico"):
        errores.append("costo_anual.anio_academico: falta")

    revisar_dato(uni["aceptacion"].get("tasa_pct"), "aceptacion.tasa_pct", uni, errores)
    for nombre in ("mundial", "especialidad"):
        ranking = uni["rankings"].get(nombre)
        revisar_dato(ranking, f"rankings.{nombre}", uni, errores, clave_valor="posicion")
        if isinstance(ranking, dict) and ranking.get("posicion") is not None:
            if not ranking.get("sistema") or not ranking.get("anio"):
                errores.append(f"rankings.{nombre}: falta sistema o anio")

    requisitos = uni["requisitos"]
    if requisitos.get("tipo_admision") not in TIPOS_ADMISION:
        errores.append(f"requisitos.tipo_admision: valor desconocido {requisitos.get('tipo_admision')}")
    for nombre, claves in (("sat", ("minimo", "p25", "p75")), ("ingles", ("minimo",))):
        bloque = requisitos.get(nombre) or {}
        if any(bloque.get(c) is not None for c in claves) and not bloque.get("fuente"):
            errores.append(f"requisitos.{nombre}: tiene cifras pero no fuente")

    for i, beca in enumerate(uni["becas"]):
        for campo in ("nombre", "url", "verificado_en"):
            if not beca.get(campo):
                errores.append(f"becas[{i}]: falta {campo}")
    if not uni["becas"] and "becas" not in uni.get("sin_dato", {}):
        errores.append("becas: lista vacía y falta su razón en sin_dato")

    for i, foto in enumerate(uni["fotos"]):
        for campo in ("archivo", "autor", "licencia", "url_origen"):
            if not foto.get(campo):
                errores.append(f"fotos[{i}]: falta {campo}")
        # Sin archivo local solo vale si hay copia remota: descargar_fotos.py la baja después.
        if foto.get("archivo") and not (RAIZ / foto["archivo"]).is_file() and not foto.get("url_remota"):
            errores.append(f"fotos[{i}]: no existe {foto['archivo']} ni tiene url_remota")
    for i, alerta in enumerate(uni.get("alertas", [])):
        if alerta.get("nivel") not in NIVELES_ALERTA or not alerta.get("texto"):
            errores.append(f"alertas[{i}]: nivel debe ser riesgo o tomar-en-cuenta, con texto")
    return errores


def main() -> int:
    indice = leer(DATA / "packs" / "index.json")
    monedas = set(leer(DATA / "tipos_cambio.json")["por_usd"]) | {"USD"}
    solo = sys.argv[1] if len(sys.argv) > 1 else None
    total_errores, vistos = 0, set()

    for entrada in indice["packs"]:
        if solo and entrada["id"] != solo:
            continue
        vistos.add(entrada["id"])
        pack = leer(DATA / "packs" / entrada["archivo"])
        if pack.get("area_foco") not in AREAS | {None}:
            print(f"ERROR  pack {entrada['id']}: area_foco desconocida")
            total_errores += 1
        if pack.get("id") != entrada["id"] or not pack.get("nombre"):
            print(f"ERROR  pack {entrada['id']}: id distinto al del índice o falta nombre")
            total_errores += 1
        ids = []
        for item in pack.get("universidades", []):
            uni = leer(DATA / item) if isinstance(item, str) else item
            ids.append(uni.get("id"))
            for error in revisar_universidad(uni, monedas):
                print(f"ERROR  {entrada['id']} / {uni.get('id', '?')}: {error}")
                total_errores += 1
        if len(ids) != len(set(ids)):
            print(f"ERROR  pack {entrada['id']}: hay ids de universidad repetidos")
            total_errores += 1
        print(f"Pack {entrada['id']}: {len(ids)} universidades revisadas.")

    if solo and solo not in vistos:
        print(f"ERROR  el pack {solo} no está registrado en data/packs/index.json")
        return 1
    print("OK  sin errores." if not total_errores else f"{total_errores} errores.")
    return 1 if total_errores else 0


if __name__ == "__main__":
    sys.exit(main())
