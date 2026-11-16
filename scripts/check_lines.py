"""Falla si algún archivo de texto del proyecto pasa de 250 líneas.

Uso:  python scripts/check_lines.py
"""
import sys
from pathlib import Path

LIMITE = 250
AVISO = 200
EXTENSIONES = {".html", ".css", ".js", ".json", ".md", ".py", ".bat"}
CARPETAS_EXCLUIDAS = {"assets", ".git", "node_modules", "__pycache__"}


def archivos(raiz: Path):
    for ruta in sorted(raiz.rglob("*")):
        if not ruta.is_file() or ruta.suffix.lower() not in EXTENSIONES:
            continue
        if CARPETAS_EXCLUIDAS & set(ruta.relative_to(raiz).parts):
            continue
        yield ruta


def main() -> int:
    raiz = Path(__file__).resolve().parent.parent
    pasados, cerca, total = [], [], 0
    for ruta in archivos(raiz):
        total += 1
        lineas = len(ruta.read_text(encoding="utf-8").splitlines())
        relativa = ruta.relative_to(raiz).as_posix()
        if lineas > LIMITE:
            pasados.append((relativa, lineas))
        elif lineas >= AVISO:
            cerca.append((relativa, lineas))

    for relativa, lineas in cerca:
        print(f"AVISO  {relativa}: {lineas} lineas (conviene dividirlo)")
    for relativa, lineas in pasados:
        print(f"ERROR  {relativa}: {lineas} lineas (limite {LIMITE})")
    if pasados:
        return 1
    print(f"OK  {total} archivos revisados, ninguno pasa de {LIMITE} lineas.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
