# Universidades

App personal para descubrir universidades una carta a la vez y quedarte con una lista final.

## Cómo abrirla

1. Doble clic en `iniciar.bat`.
2. Con internet, guarda en disco las fotos de campus que falten y luego abre el navegador.
3. Llena "Lo básico" de tu perfil y guarda. Ya estás viendo la primera carta.

Para apagarla, cierra la ventana negra. Necesita Python instalado; nada más.

## Cómo votar

| Voto | Arrastrar | Teclado |
|---|---|---|
| 👍 Me gusta | derecha | → |
| 😐 Neutral | abajo | ↓ |
| 👎 No me gustó | izquierda | ← |
| Deshacer | botón | Z |

Arriba del mazo eliges qué grupo de universidades ver. Las cartas pueden traer avisos de
"Riesgo" o "Tomar en cuenta", y las cifras con "≈" vienen de fuentes no oficiales.

## Tus datos

El perfil y los votos se guardan en el navegador. En "Lista final" puedes exportar la
lista a CSV o JSON, y guardar o importar un respaldo para llevarlo a otro dispositivo.

## Agregar universidades

Un tema nuevo es un archivo en `data/packs/` registrado en `data/packs/index.json`.
El esquema está en `data/schema.md` y el procedimiento completo en `CLAUDE.md`.

## Ajustar la estimación de admisión

Los pesos y umbrales están en `config/admission.config.js`. La estimación es orientativa:
compara tu perfil con datos públicos y siempre muestra un rango, nunca un número exacto.

## Revisiones

```
python scripts/check_lines.py
python scripts/validate_pack.py
```

## Créditos

Tipografías Bricolage Grotesque y Atkinson Hyperlegible (licencia SIL OFL, en `assets/fonts/`).
Fotos de Wikimedia Commons con su autor y licencia en cada carta.
