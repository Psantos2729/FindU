# Esquema de datos

## Archivos

| Archivo | Contenido |
|---|---|
| `data/packs/index.json` | Lista de packs registrados: `{ "packs": [{ "id", "archivo" }] }` |
| `data/packs/<tema>.json` | Un pack: `{ "id", "nombre", "descripcion", "area_foco", "universidades": [...] }` |
| `data/universidades/<id>.json` | Una universidad (un archivo por universidad) |
| `data/tipos_cambio.json` | Unidades de cada moneda por 1 USD, con fuente y fecha |

En `universidades`, cada elemento es un objeto de universidad **o** una ruta relativa a
`data/` (por ejemplo `"universidades/toronto.json"`). Se prefiere la ruta: mantiene cada
archivo por debajo de 250 líneas y permite repetir una universidad en varios packs.

Una universidad puede estar en varios packs. `area_foco` (opcional) es el área que la carta
destaca cuando ese pack está elegido en el mazo.

## Regla de los datos numéricos

Todo dato numérico es `{ "valor", "fuente", "verificado_en" }`.

- Con valor: `fuente` (URL oficial o de ranking) y `verificado_en` (`AAAA-MM-DD`) son obligatorios.
- Sin valor: `valor: null` y una razón en `sin_dato` con la ruta del dato como clave.
  La carta muestra "Sin dato" y esa razón. Nunca se inventa una cifra.
- Cifra de fuente no oficial (portal, Wikipedia): se agrega `"aproximado": true`. La carta
  la muestra con "≈" y la etiqueta "no oficial".

## Universidad

| Campo | Tipo | Notas |
|---|---|---|
| `id` | texto | minúsculas, números y guiones; igual al nombre del archivo |
| `nombre`, `ciudad`, `pais`, `sitio_web` | texto | |
| `carreras[]` | lista | `nombre`, `areas[]`, `idioma`, `duracion_anios`, `url` |
| `costo_anual.matricula` | dato | en la moneda local |
| `costo_anual.vida` | dato | opcional |
| `costo_anual.moneda` | texto | debe existir en `tipos_cambio.json` (o ser `USD`) |
| `costo_anual.anio_academico` | texto | por ejemplo `2026-27` |
| `costo_anual.nota` | texto o null | aclaraciones del costo |
| `aceptacion.tasa_pct` | dato | porcentaje de 0 a 100 |
| `aceptacion.ambito` | texto o null | `la universidad`, `el programa`, `internacionales` |
| `rankings.mundial` | ranking | `sistema`, `anio`, `posicion`, `fuente`, `verificado_en` |
| `rankings.especialidad` | ranking | `posicion` es número o rango (`"201–250"`) |
| `requisitos.sat` | objeto | `requerido`, `minimo`, `p25`, `p75`, `fuente`, `verificado_en` |
| `requisitos.ingles` | objeto | `examen`, `minimo`, `escala` (`"1-6"` para el TOEFL nuevo), `minimo_escala_anterior` |
| `requisitos.gpa_referencia` | dato o null | lleva además `escala` |
| `requisitos.tipo_admision` | texto o null | `numerica`, `holistica`, `prueba-propia`, `abierta` |
| `requisitos.nota` | texto o null | lo que no cabe en números |
| `becas[]` | lista | `nombre`, `cobertura`, `convocatoria`, `via_indesgua`, `url`, `verificado_en` |
| `fotos_busqueda` | texto | consulta para `scripts/descargar_fotos.py` |
| `fotos[]` | lista | `archivo`, `alt`, `autor`, `licencia`, `url_origen`, `url_remota` |
| `fotos_enlace` | texto | opcional; enlace para ver más fotos (por defecto, búsqueda en Commons) |
| `alertas[]` | lista | `nivel` (`riesgo` o `tomar-en-cuenta`) y `texto` |
| `sin_dato` | objeto | razón de cada dato vacío, por ruta |

Áreas válidas en `carreras[].areas`: `computer-science`, `inteligencia-artificial`,
`software-engineering`, `computer-engineering`, `data-science`, `game-design`,
`ciberseguridad`, `cs-business`.

Fotos: `archivo` es la copia local y `url_remota` la de Wikimedia Commons. Si la local no
existe todavía, la carta carga la remota; `scripts/descargar_fotos.py` la guarda en disco.

Alertas: `riesgo` es algo que puede impedir o encarecer mucho la opción (un año extra,
idioma, cupos mínimos); `tomar-en-cuenta` es una condición particular que conviene saber.

Claves usadas en `sin_dato`: `costo_anual`, `costo_anual.vida`, `aceptacion.tasa_pct`,
`rankings.mundial`, `rankings.especialidad`, `becas`.

## Validación

```
python scripts/validate_pack.py
python scripts/check_lines.py
```
