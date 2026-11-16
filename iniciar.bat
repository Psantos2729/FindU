@echo off
REM Levanta un servidor local y abre la app en el navegador.
cd /d "%~dp0"
set PUERTO=8765
where python >nul 2>nul
if errorlevel 1 (
  echo No se encontro Python. Instalalo desde https://www.python.org y vuelve a intentar.
  pause
  exit /b 1
)
REM La primera vez baja las fotos de campus que falten (Wikimedia Commons).
python scripts\descargar_fotos.py
start "" http://localhost:%PUERTO%/
echo.
echo App abierta en http://localhost:%PUERTO%/  -  cierra esta ventana para apagarla.
python -m http.server %PUERTO%
