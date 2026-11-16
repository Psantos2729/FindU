// Enrutador por hash: #perfil, #mazo, #resultados.

const vistas = new Map();
let limpiarAnterior = null;

/** Registra una vista. `montar(contenedor)` puede devolver una función de limpieza. */
export function registrar(ruta, montar) {
  vistas.set(ruta, montar);
}

export function irA(ruta) {
  if (location.hash === `#${ruta}`) mostrar();
  else location.hash = ruta;
}

async function mostrar() {
  const ruta = location.hash.slice(1) || 'mazo';
  const montar = vistas.get(ruta) ?? vistas.get('mazo');
  const contenedor = document.getElementById('vista');

  if (limpiarAnterior) limpiarAnterior();
  limpiarAnterior = null;
  contenedor.replaceChildren();

  for (const enlace of document.querySelectorAll('[data-ruta]')) {
    if (enlace.dataset.ruta === ruta) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
  }

  limpiarAnterior = (await montar(contenedor)) ?? null;
}

export function iniciar() {
  window.addEventListener('hashchange', mostrar);
  mostrar();
}
