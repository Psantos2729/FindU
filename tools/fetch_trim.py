"""Descarga una página oficial, la pasa a texto y conserva solo fragmentos
cercanos a palabras clave (máx. 3000 chars) en data/cache/<ror_id>.txt.
Uso: python tools/fetch_trim.py <ror_id> [url]   (sin url: sitio_web del catálogo)
Nunca vuelve a descargar si el archivo ya existe."""
import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request

RAIZ = os.path.join(os.path.dirname(__file__), "..", "data")
MAX = 3000
VENTANA = 160
CLAVES = ["tuition", "fees", "fee ", "scholarship", "bursar", "financial aid", "cost of living",
          "living cost", "acceptance", "admission rate", "deadline", "international student",
          "matr\u00edcula", "tasas", "becas", "plazo", "retta", "tasse", "borsa", "studiengeb",
          "studienbeitr", "stipendi", "frais de scolarit", "bourse", "collegegeld",
          "\u5b66\u8cbb", "\u5b66\u8d39", "\u5956\u5b66\u91d1", "\ub4f1\ub85d\uae08"]
UA = {"User-Agent": "Mozilla/5.0 (uni-catalog personal use)"}


def a_texto(h):
    h = re.sub(r"(?is)<(script|style|noscript|svg|nav|footer|header)\b.*?</\1>", " ", h)
    h = re.sub(r"(?s)<[^>]+>", " ", h)
    return re.sub(r"\s+", " ", html.unescape(h)).strip()


def recortar(texto):
    bajo = texto.lower()
    rangos = []
    for k in CLAVES:
        for m in re.finditer(re.escape(k), bajo):
            rangos.append((max(0, m.start() - VENTANA), m.end() + VENTANA))
    rangos.sort()
    fund = []
    for a, b in rangos:
        if fund and a <= fund[-1][1]:
            fund[-1][1] = max(fund[-1][1], b)
        else:
            fund.append([a, b])
    salida, total = [], 0
    for a, b in fund:
        t = texto[a:b]
        if total + len(t) > MAX:
            t = t[: MAX - total]
        salida.append(t)
        total += len(t)
        if total >= MAX:
            break
    return " | ".join(salida)


ENLACE = re.compile(r"(?is)<a\b[^>]*?href=[\"']([^\"'#]+)[\"'][^>]*>(.*?)</a>")
PALABRAS = re.compile(r"tuition|fees|international|costs", re.I)
TIENE_CIFRA = re.compile(r"(\$|\u20ac|\u00a3|\b[A-Z]{3})\s?\d[\d,.]{2,}|\d[\d,.]{2,}\s?(\$|\u20ac|\u00a3|[A-Z]{3}\b)")


def descargar(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return r.read(3_000_000).decode(r.headers.get_content_charset() or "utf-8", "replace")


def enlaces_costos(h, base, max_n=2):
    """Hasta 2 enlaces normales del mismo dominio cuyo texto o ruta menciona costos."""
    host = urllib.parse.urlparse(base).netloc
    vistos, res = {base}, []
    for href, txt in ENLACE.findall(h):
        url = urllib.parse.urljoin(base, href.strip())
        if (urllib.parse.urlparse(url).netloc != host or url in vistos
                or not url.startswith("http")):
            continue
        if PALABRAS.search(a_texto(txt)):
            vistos.add(url)
            res.append(url)
        if len(res) == max_n:
            break
    return res


def main():
    ror_id = sys.argv[1]
    destino = os.path.join(RAIZ, "cache", f"{ror_id}.txt")
    if os.path.exists(destino):
        print("cache existe, no se descarga")
        return
    url = sys.argv[2] if len(sys.argv) > 2 else None
    if not url:
        cat = json.load(open(os.path.join(RAIZ, "catalog.json"), encoding="utf-8"))
        url = next(u["sitio_web"] for u in cat if u["ror_id"] == ror_id)
    h = descargar(url)
    usadas, partes = [url], [recortar(a_texto(h))]
    if not TIENE_CIFRA.search(partes[0]):
        for otra in enlaces_costos(h, url):
            try:
                partes.append(recortar(a_texto(descargar(otra))))
                usadas.append(otra)
            except Exception as e:
                print("enlace omitido:", otra, e)
            if TIENE_CIFRA.search(partes[-1]):
                break
    cuerpo = " || ".join(p for p in partes if p)
    texto = "URL: " + " ; ".join(usadas) + "\n" + cuerpo[:MAX]
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    with open(destino, "w", encoding="utf-8") as f:
        f.write(texto)
    with open(os.path.join(RAIZ, "cache", "_chars.csv"), "a", encoding="utf-8") as f:
        f.write(f"{ror_id},{len(texto)},{len(usadas)}\n")
    print(ror_id, len(texto), "chars,", len(usadas), "pagina(s)")


if __name__ == "__main__":
    main()
