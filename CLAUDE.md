# Universidades

App local y personal de Paolo para descubrir y filtrar universidades, estilo Tinder.
HTML, CSS y JavaScript vanilla con módulos ES. Sin frameworks, sin build, sin dependencias.

## Reglas del proyecto

- Ningún archivo pasa de 250 líneas; si se acerca a 200, se divide. Una responsabilidad por archivo.
- Interfaz y comentarios en español.
- Nunca inventar cifras: dato sin verificar = `null` más su razón en `sin_dato`.
- Preguntar antes de borrar archivos o agregar dependencias.
- Al terminar cualquier cambio: `python scripts/check_lines.py` y `python scripts/validate_pack.py`.

## Mapa rápido

- `js/main.js` registra vistas; `router.js` cambia entre `#perfil`, `#mazo`, `#resultados`.
- `store.js` es lo único que toca localStorage. `loader.js` lee `data/`.
- `deck.js` (mazo) usa `card.js`, `card.detail.js`, `gallery.js` y `swipe.js`.
- `admission.js` es una función pura; sus pesos viven en `config/admission.config.js`.
- `results.js` y `export.js` hacen la lista final y los archivos JSON y CSV.
- Diseño: tokens en `css/tokens.css` (dirección "Expediente sellado").

## Procedimiento: "crea un pack de universidades sobre <tema>"

1. **Definir**: lista de universidades y el programa exacto de cada una. Si Paolo no la dio, proponerla y esperar su visto bueno.
2. **Investigar** cada universidad en fuentes oficiales o de ranking: matrícula internacional y costo de vida (con año), tasa de aceptación, QS/THE/ARWU mundial y por especialidad, requisitos (SAT, inglés, promedio, tipo de admisión), becas y convocatorias (revisar si INDESGUA las coordina). Dos intentos por dato; si no aparece, `null` y razón.
3. **Escribir** un archivo por universidad en `data/universidades/<id>.json` según `data/schema.md`, con `fuente` y `verificado_en` en cada cifra. Si la universidad ya existe, reutilizar su archivo.
4. **Crear el pack** `data/packs/<tema>.json` con `id`, `nombre`, `descripcion`, `area_foco` y las rutas de sus universidades.
5. **Registrar** el pack en `data/packs/index.json`.
6. **Fotos**: elegir de 1 a 4 fotos de Wikimedia Commons con licencia abierta y anotarlas en `fotos` con autor, licencia, `url_origen` y `url_remota`; poner también `fotos_busqueda`. `python scripts/descargar_fotos.py` las guarda en disco. Si no se pudo elegir ninguna, la carta muestra un enlace para verlas.
7. **Alertas**: si una universidad tiene un problema específico, agregarlo en `alertas` como `riesgo` o `tomar-en-cuenta`. Las cifras no oficiales llevan `"aproximado": true`.
8. **Monedas**: si aparece una moneda nueva, agregarla a `data/tipos_cambio.json` con fuente y fecha.
9. **Validar**: `python scripts/validate_pack.py <tema>` y `python scripts/check_lines.py`.
10. **Reportar** a Paolo qué quedó verificado y qué quedó como "Sin dato".
