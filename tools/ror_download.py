"""Descarga el volcado ROR más reciente desde Zenodo a data/raw/."""
import json
import os
import sys
import urllib.request

RECORD = "6347574"
API = f"https://zenodo.org/api/records/{RECORD}/versions/latest"
DEST = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
UA = {"User-Agent": "uni-catalog/1.0"}


def main():
    req = urllib.request.Request(API, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        rec = json.load(r)
    archivo = next(f for f in rec["files"] if f["key"].endswith(".zip"))
    destino = os.path.join(DEST, archivo["key"])
    if os.path.exists(destino) and os.path.getsize(destino) == archivo["size"]:
        print("ya existe:", archivo["key"])
        return
    if archivo["size"] > 200 * 1024 * 1024:
        sys.exit("más de 200 MB: pedir permiso antes de descargar")
    os.makedirs(DEST, exist_ok=True)
    req = urllib.request.Request(archivo["links"]["self"], headers=UA)
    with urllib.request.urlopen(req, timeout=300) as r, open(destino, "wb") as f:
        while chunk := r.read(1 << 20):
            f.write(chunk)
    print("descargado:", archivo["key"], os.path.getsize(destino), "bytes")


if __name__ == "__main__":
    main()
