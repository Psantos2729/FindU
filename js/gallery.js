// Galería de fotos de una carta: flechas, puntos y deslizamiento horizontal propio.
import { el } from './ui.js';

const UMBRAL_PX = 40;

/** Devuelve el elemento de la galería. Sin fotos, muestra un degradado de respaldo. */
export function crearGaleria(fotos = [], nombre = '', enlace = null) {
  const verMas = (texto) => enlace && el('a', { class: 'galeria__enlace', href: enlace, target: '_blank',
    rel: 'noopener', text: texto });
  if (!fotos.length) {
    return el('div', { class: 'galeria galeria--vacia' },
      el('span', { text: 'Sin fotos todavía' }), verMas('Ver fotos del campus'));
  }

  let actual = 0;
  const imagen = el('img', { class: 'galeria__foto', draggable: 'false' });
  const credito = el('span', { class: 'galeria__credito' });
  const puntos = fotos.map((_, i) => el('button', { type: 'button', class: 'galeria__punto',
    'aria-label': `Foto ${i + 1} de ${fotos.length}`, onClick: () => mostrar(i) }));

  function mostrar(indice) {
    actual = (indice + fotos.length) % fotos.length;
    const foto = fotos[actual];
    imagen.dataset.respaldo = foto.url_remota ?? '';
    imagen.src = foto.archivo;
    imagen.alt = foto.alt ?? `Campus de ${nombre}`;
    credito.textContent = `Foto: ${foto.autor ?? 'autor desconocido'}, ${foto.licencia ?? ''}`;
    puntos.forEach((p, i) => p.setAttribute('aria-current', i === actual ? 'true' : 'false'));
  }

  const galeria = el('div', { class: 'galeria' },
    imagen,
    credito,
    fotos.length > 1 && el('button', { type: 'button', class: 'galeria__flecha galeria__flecha--antes',
      'aria-label': 'Foto anterior', text: '‹', onClick: () => mostrar(actual - 1) }),
    fotos.length > 1 && el('button', { type: 'button', class: 'galeria__flecha galeria__flecha--despues',
      'aria-label': 'Foto siguiente', text: '›', onClick: () => mostrar(actual + 1) }),
    fotos.length > 1 && el('div', { class: 'galeria__puntos' }, puntos),
    verMas('Más fotos'));

  // Si el archivo local aún no se descargó, usa la copia de Wikimedia Commons;
  // si tampoco carga, la galería cae al degradado sin romper la carta.
  imagen.addEventListener('error', () => {
    const respaldo = imagen.dataset.respaldo;
    if (respaldo && imagen.src !== respaldo) {
      imagen.dataset.respaldo = '';
      imagen.src = respaldo;
      return;
    }
    galeria.classList.add('galeria--sin-imagen');
  });
  imagen.addEventListener('load', () => galeria.classList.remove('galeria--sin-imagen'));

  // Deslizamiento interno: no se propaga para que la carta no se arrastre.
  let inicioX = null;
  galeria.addEventListener('pointerdown', (e) => { inicioX = e.clientX; e.stopPropagation(); });
  galeria.addEventListener('pointerup', (e) => {
    if (inicioX === null) return;
    const dx = e.clientX - inicioX;
    inicioX = null;
    if (Math.abs(dx) >= UMBRAL_PX) mostrar(actual + (dx < 0 ? 1 : -1));
  });
  galeria.addEventListener('pointercancel', () => { inicioX = null; });

  mostrar(0);
  return galeria;
}
