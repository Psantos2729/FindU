// Utilidades pequeñas de DOM, avisos y formato.

/** Crea un elemento. attrs acepta atributos, `class`, `text` y eventos `onX`. */
export function el(tag, attrs = {}, ...hijos) {
  const nodo = document.createElement(tag);
  for (const [clave, valor] of Object.entries(attrs)) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (clave === 'text') nodo.textContent = valor;
    else if (clave.startsWith('on')) nodo.addEventListener(clave.slice(2).toLowerCase(), valor);
    else nodo.setAttribute(clave, valor === true ? '' : valor);
  }
  for (const hijo of hijos.flat()) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    nodo.append(hijo.nodeType ? hijo : document.createTextNode(String(hijo)));
  }
  return nodo;
}

let temporizadorAviso;
/** Muestra un mensaje breve que los lectores de pantalla también anuncian. */
export function aviso(mensaje, ms = 2600) {
  const caja = document.getElementById('aviso');
  caja.textContent = mensaje;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => { caja.textContent = ''; }, ms);
}

/** Descarga un texto como archivo. */
export function descargar(nombre, contenido, tipo) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const enlace = el('a', { href: url, download: nombre });
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 12345.6 → "12,346" */
export function fmtNumero(n) {
  return Math.round(n).toLocaleString('es-GT');
}

/** Fecha ISO (2026-11-14) → "14 nov 2026" */
export function fmtFecha(iso) {
  if (!iso) return '';
  const fecha = new Date(`${iso}T12:00:00`);
  return fecha.toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const hoyISO = () => new Date().toISOString().slice(0, 10);
