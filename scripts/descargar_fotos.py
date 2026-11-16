"""Descarga fotos de campus con licencia abierta desde Wikimedia Commons.

Para cada universidad en data/universidades/:
- si ya tiene fotos elegidas, guarda en assets/campus/<id>/ las que aún no estén en disco;
- si no tiene fotos pero sí `fotos_busqueda`, busca en Commons, guarda hasta 4 imágenes
  y escribe la atribución (autor, licencia, origen) en su JSON.

Uso:  python scripts/descargar_fotos.py            (solo las que faltan)
      python scripts/descargar_fotos.py --rehacer   (vuelve a buscar todas)
Solo usa la biblioteca estándar de Python.
"""
import html
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
API = "https://commons.wikimedia.org/w/api.php"
AGENTE = "AppUniversidadesPersonal/1.0 (uso educativo personal)"
MAX_FOTOS = 4
ANCHO = 1280
LICENCIAS_ABIERTAS = ("cc by", "cc0", "public domain", "pd")


def pedir(url: str) -> bytes:
    solicitud = urllib.request.Request(url, headers={"User-Agent": AGENTE})
    with urllib.request.urlopen(solicitud, timeout=30) as respuesta:
        return respuesta.read()


def limpiar(texto: str) -> str:
    """Quita HTML de los metadatos de Commons."""
    return html.unescape(re.sub(r"<[^>]+>", "", texto or "")).strip()


def buscar(consulta: str) -> list:
    parametros = urllib.parse.urlencode({
        "action": "query", "format": "json", "generator": "search", "gsrnamespace": 6,
        "gsrlimit": 40, "gsrsearch": f"{consulta} filetype:bitmap",
        "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata", "iiurlwidth": ANCHO,
        "iiextmetadatafilter": "LicenseShortName|Artist",
    })
    paginas = json.loads(pedir(f"{API}?{parametros}")).get("query", {}).get("pages", {})
    return sorted(paginas.values(), key=lambda p: p.get("index", 0))


def sirve(info: dict) -> bool:
    """Solo JPEG horizontales, de buen tamaño y con licencia abierta sin NC ni ND."""
    licencia = info.get("extmetadata", {}).get("LicenseShortName", {}).get("value", "").lower()
    abierta = licencia.startswith(LICENCIAS_ABIERTAS) and "nc" not in licencia and "nd" not in licencia
    horizontal = info.get("width", 0) >= 1200 and info.get("width", 0) > info.get("height", 0)
    return abierta and horizontal and info.get("mime") == "image/jpeg"


def procesar(ruta_json: Path, rehacer: bool) -> int:
    uni = json.loads(ruta_json.read_text(encoding="utf-8"))
    # Fotos ya elegidas: solo falta traer a disco las que tengan copia remota.
    if uni.get("fotos") and not rehacer:
        bajadas = 0
        for foto in uni["fotos"]:
            destino = RAIZ / foto["archivo"]
            if not destino.is_file() and foto.get("url_remota"):
                destino.parent.mkdir(parents=True, exist_ok=True)
                destino.write_bytes(pedir(foto["url_remota"]))
                bajadas += 1
        if bajadas:
            print(f"{uni['id']}: {bajadas} fotos guardadas.")
        return bajadas
    if not uni.get("fotos_busqueda"):
        return 0
    carpeta = RAIZ / "assets" / "campus" / uni["id"]
    carpeta.mkdir(parents=True, exist_ok=True)
    fotos = []
    for pagina in buscar(uni["fotos_busqueda"]):
        info = (pagina.get("imageinfo") or [{}])[0]
        if not sirve(info):
            continue
        archivo = carpeta / f"{len(fotos) + 1:02d}.jpg"
        archivo.write_bytes(pedir(info.get("thumburl") or info["url"]))
        meta = info["extmetadata"]
        fotos.append({
            "archivo": archivo.relative_to(RAIZ).as_posix(),
            "alt": f"Campus de {uni['nombre']}",
            "autor": limpiar(meta.get("Artist", {}).get("value")) or "Autor no indicado",
            "licencia": meta["LicenseShortName"]["value"],
            "url_origen": info.get("descriptionurl", ""),
        })
        if len(fotos) == MAX_FOTOS:
            break
    if fotos:
        uni["fotos"] = fotos
        ruta_json.write_text(json.dumps(uni, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{uni['id']}: {len(fotos)} fotos.")
    return len(fotos)


def main() -> int:
    rehacer = "--rehacer" in sys.argv
    for ruta in sorted((RAIZ / "data" / "universidades").glob("*.json")):
        try:
            procesar(ruta, rehacer)
        except Exception as error:  # sin internet o Commons caído: la app sigue con el degradado
            print(f"{ruta.stem}: no se pudieron bajar fotos ({error}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
