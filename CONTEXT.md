# CONTEXT.md — Para quien se une al proyecto

Resumen de qué es la app, qué ya está hecho y qué falta. Las reglas de código y el procedimiento para crear packs están en `CLAUDE.md`; el esquema de datos en `data/schema.md`; el uso en `README.md`. Este archivo no los reemplaza: da el panorama y el estado.

Estado medido sobre el repo el 2026-11-16 (commit `b9ac368`).

## 1. Qué es

App web **local y personal** de Paolo Santos (estudiante del Colegio Suizo Americano, Guatemala) para elegir universidades en el extranjero. Muestra una universidad a la vez; él vota me gusta / neutral / no me gustó y al final exporta una lista. HTML + CSS + JavaScript vanilla con módulos ES, sin build ni dependencias. Se abre con `iniciar.bat` (Windows, requiere Python).

Perfil que alimenta la app: promedio sobre 100, interés en Computer Science, IA, Software/Computer Engineering, Data Science y Game Design. Postula a becas coordinadas por **INDESGUA**; ingreso objetivo ~2028/2029.

## 2. Reglas que no se negocian

- Ningún archivo pasa de 250 líneas (dividir cerca de 200). Una responsabilidad por archivo.
- Nunca inventar cifras: dato sin verificar = `null` + razón en `sin_dato`. Cada cifra lleva `fuente` y `verificado_en`.
- Cifras no oficiales (matrícula de portales, tasas de aceptación) se marcan `"aproximado": true` (se muestran con "≈").
- Costos en moneda original **y** USD (`data/tipos_cambio.json`).
- **Sin universidades de Estados Unidos**, aunque las alternativas estén peor rankeadas.
- Preguntar a Paolo antes de borrar archivos o agregar dependencias.
- Fotos: Wikimedia Commons con licencia abierta, o al menos un enlace para verlas.
- Problemas específicos de una universidad van en `alertas` como `riesgo` o `tomar-en-cuenta`.
- Antes de cerrar cualquier cambio: `python scripts/check_lines.py` y `python scripts/validate_pack.py` (hoy ambos pasan).

## 3. Ya hecho

**App (`js/`, `css/`, `config/`)**: vistas Perfil, Mazo y Resultados (router por hash); votos por arrastre o teclado con deshacer; carta con detalle y galería; estimación de admisión orientativa (`admission.js` + pesos en `config/admission.config.js`); lista final con exportación CSV/JSON y respaldo/importación; datos del usuario en localStorage (`store.js`); diseño "Expediente sellado" con tipografías locales (sin descargas).

**Datos (`data/`)**: 233 fichas de universidades en 4 packs registrados en `data/packs/index.json`:

| Pack | Universidades |
|---|---|
| `computacion-ia` | 6 (Toronto, Monash, Alberta, Padova, Milano, UCD) |
| `ciberseguridad` | 20 (sin EE. UU.) |
| `cs-business` | 20 (sin EE. UU.) |
| `catalogo-qs` | 200 (base armada desde ranking QS 2026) |

**Herramientas**: `scripts/` (validadores, descarga de fotos) y `tools/` (armado del catálogo desde ROR/QS/shortlist, costos, fotos).

## 4. Qué falta (el trabajo real)

Las 200 fichas de `catalogo-qs` son una **base**: traen ranking QS, pero casi todo lo demás está vacío. Conteo de fichas con dato real, sobre 233:

| Dato | Fichas con dato |
|---|---|
| Matrícula (`costo_anual`) | 27 |
| Tasa de aceptación | 21 |
| Requisitos (admisión / GPA) | 48 |
| Becas | 26 |
| Fotos descargadas | 58 (175 tienen al menos un enlace) |

Prioridades sugeridas:

1. **Costos primero** (el dato más importante para Paolo): matrícula y costo de vida con año y fuente, en moneda original y USD. Hay insumos en `data/costs/` (gitignore excluye `data/raw/` y `data/cache/`); revisar cuánto falta volcar a las fichas.
2. **Programas exactos**: muchas carreras dicen "(programa exacto por confirmar)" con la URL del sitio general; poner el programa real, idioma, duración y URL.
3. **Becas y convocatorias INDESGUA** por universidad (ver sección 5), con periodo y monto.
4. **Requisitos** (SAT, inglés, promedio, tipo de admisión) y tasas de aceptación.
5. **Fotos**: elegir 1–4 de Commons con autor y licencia y correr `scripts/descargar_fotos.py`.
6. **Alertas** de riesgo reales: hoy 221 fichas tienen una alerta genérica de "ficha base"; sustituirla al completar cada una.
7. Revisión de usabilidad con 200+ cartas (filtros por país/costo/beca, orden por afinidad).

Trabajar por lotes pequeños (un pack o un país) y reportar a Paolo qué quedó verificado y qué quedó "Sin dato". Paolo tiene uso limitado de tokens: delegar a un agente Opus las tareas de investigación que no exijan mucho razonamiento.

## 5. Becas INDESGUA ya investigadas (punto de partida, verificar antes de usar)

| País | Beca / universidad | Programas de interés | Periodo | Beneficio |
|---|---|---|---|---|
| Canadá | Lester B. Pearson, U. of Toronto | CompEng, CS, Data Science, AI Eng | ago–ene | Completa, sin pasaje |
| Canadá | U. of Alberta | BSc Computer Engineering (+ Co-op) | oct–ene | Hasta CAD 120,000 (30k×4) |
| Canadá | York University | CompEng, CS, Security, IT, Software Eng | solicitud 1 dic–1 feb | Hasta CAD 180,000 (45k×4) |
| Australia | Monash Intl Leadership | Bachelor of Computer Science y variantes | permanente, 6 rondas | 100% académica |
| Australia | Deakin VC Intl | Software Eng, IT, Data Science, Cyber, CS | 3 inicios/año | 100% y 50% |
| Australia | UTS VC Intl Undergrad | Computing, IS, IT, Games, AI, Cyber | 2 periodos/año | 100% |
| Italia | DSU Milano | BSc Artificial Intelligence | jul–sep | Completa con pasaje |
| Italia | EDISU Piemonte | Politecnico Torino (CompEng); UniTo (Econ & Finance + Data Science) | jul–sep | Completa sin pasaje y parciales |
| Italia | Regione Veneto | Padova (Info Eng); Ca' Foscari (CS) | ago–sep | Completas y parciales |
| Irlanda | UCD Global Excellence / IFY | BSc Computer Science | nov–mar | IFY hasta €20,000 |
| Suecia | Uppsala | Game Design (3 variantes) | oct–feb | 100% académica |
| Finlandia | UEF | BSc Information Technology | oct–ene | 50% y 70% |
| Dinamarca | Gobierno Danés (SDU) | BSc Software Engineering | dic–mar | ⚠️ SDU dice no ofrecer becas de pregrado: puede no aplicar |
| Hungría | Gobierno de Hungría (BME, ELTE) | CS Engineering; CS | nov–ene | Completa |
| Brunéi | Gobierno de Brunéi (UBD) | BEng ICS; BSc CS | dic–ene | Completa |
| EAU | NYU Abu Dhabi | BS CS, BS CompEng | sep–ene | Completa y parciales |
| Uruguay | UDELAR | Ing. en Computación | — | — |
| Brasil | PEC-G (UFRJ, UFMG) | tech-negocios | — | — |

Las convocatorias están en indesgua.org.gt. Los rankings citados en las investigaciones previas hay que reconfirmarlos con fuente y fecha antes de volcarlos a las fichas.

## 6. Primeros pasos

```
git clone https://github.com/Psantos2729/FindU
cd FindU
python scripts/check_lines.py && python scripts/validate_pack.py
# abrir iniciar.bat (Windows) o servir la carpeta con: python -m http.server
```
