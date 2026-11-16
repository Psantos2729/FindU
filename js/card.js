// Dibuja la carta de una universidad: fotos, datos clave y sellos de decisión.
import { el, fmtNumero } from './ui.js';
import { crearGaleria } from './gallery.js';
import { estimarAdmision } from './admission.js';
import { crearDetalle, crearAlertas } from './card.detail.js';
import { valor, razonSinDato, costoAnual, aUSD, carrerasDeInteres, esAproximado, enlaceFotos } from './datos.js';

export const SELLOS = [
  { voto: 'gusta', texto: 'Me gusta', icono: '👍' },
  { voto: 'neutral', texto: 'Neutral', icono: '😐' },
  { voto: 'no', texto: 'No me gustó', icono: '👎' },
];

/** Un dato de la ficha. Si no hay valor muestra "Sin dato" y su razón. */
function dato(titulo, texto, pie, razon) {
  return el('div', { class: 'dato' },
    el('dt', { text: titulo }),
    el('dd', {},
      el('span', { class: texto ? 'dato__valor' : 'dato__valor dato__valor--vacio', text: texto ?? 'Sin dato' }),
      (texto ? pie : razon) && el('span', { class: 'dato__pie', text: texto ? pie : razon })));
}

function datoCosto(uni, cambio) {
  const c = costoAnual(uni);
  const base = c.total ?? c.matricula;
  if (base === null) return dato('Costo anual', null, null, razonSinDato(uni, 'costo_anual'));
  const usd = aUSD(base, c.moneda, cambio);
  const partes = c.total !== null
    ? `Matrícula ${fmtNumero(c.matricula)} + vida ${fmtNumero(c.vida)}`
    : 'Solo matrícula; sin dato de costo de vida';
  const enUSD = usd !== null && c.moneda !== 'USD' ? ` (≈ USD ${fmtNumero(usd)})` : '';
  const aprox = esAproximado(uni.costo_anual.matricula);
  return dato('Costo anual', `${aprox ? '≈ ' : ''}${c.moneda} ${fmtNumero(base)}${enUSD}`,
    `${partes}, ${c.anio}${aprox ? '. Matrícula no oficial, sin confirmar' : ''}`);
}

function datoRanking(titulo, r, razon) {
  if (!r || r.posicion === null || r.posicion === undefined) return dato(titulo, null, null, razon);
  return dato(titulo, `#${r.posicion}`, `${r.sistema} ${r.anio}`);
}

function resumenAdmision(est) {
  const [bajo, alto] = est.rango;
  return el('div', { class: 'admision' },
    el('p', { class: 'admision__titulo' },
      el('span', { text: 'Tu admisión: ' }),
      el('strong', { text: `${est.etiqueta}, ${bajo}–${alto} %` })),
    el('div', { class: 'admision__barra', 'aria-hidden': 'true' },
      el('span', { style: `left:${bajo}%;width:${alto - bajo}%` })),
    el('p', { class: 'admision__pie', text: `Estimación orientativa, confianza ${est.confianza}.` }));
}

/** @returns {HTMLElement} artículo .carta listo para insertar en el mazo */
export function crearCarta(uni, { perfil, cambio, foco = null }) {
  const est = estimarAdmision(perfil, uni);
  const carreras = carrerasDeInteres(uni, perfil, foco);
  const tasa = valor(uni.aceptacion?.tasa_pct);
  const tasaAprox = esAproximado(uni.aceptacion?.tasa_pct);
  const ambito = uni.aceptacion?.ambito ? `De ${uni.aceptacion.ambito}` : null;
  const beca = (uni.becas ?? [])[0];

  return el('article', { class: 'carta', 'aria-label': uni.nombre },
    el('div', { class: 'carta__principal' },
      crearGaleria(uni.fotos, uni.nombre, enlaceFotos(uni)),
      el('div', { class: 'carta__cuerpo' },
        el('h2', { class: 'carta__nombre', text: uni.nombre }),
        el('p', { class: 'carta__lugar', text: `${uni.ciudad}, ${uni.pais}` }),
        crearAlertas(uni),
        resumenAdmision(est),
        el('dl', { class: 'datos' },
          datoCosto(uni, cambio),
          dato('Aceptación', tasa === null ? null : `${tasaAprox ? '≈ ' : ''}${tasa} %`,
            tasaAprox ? [ambito, 'cifra no oficial'].filter(Boolean).join(', ') : ambito,
            razonSinDato(uni, 'aceptacion.tasa_pct')),
          datoRanking('Ranking mundial', uni.rankings?.mundial, razonSinDato(uni, 'rankings.mundial')),
          datoRanking('Ranking en computación', uni.rankings?.especialidad,
            razonSinDato(uni, 'rankings.especialidad')),
          dato('Beca', beca?.nombre ?? null, beca?.cobertura ?? null,
            razonSinDato(uni, 'becas') ?? 'No se encontró una beca aplicable')),
        el('div', { class: 'carta__carreras' },
          el('h3', { text: 'Carreras para ti' }),
          carreras.length
            ? el('ul', {}, carreras.map((c) => el('li', { text: c.nombre })))
            : el('p', { class: 'nota', text: 'Ninguna carrera coincide con tus intereses.' }))),
      SELLOS.map((s) => el('div', { class: `sello sello--${s.voto}`, 'aria-hidden': 'true', text: s.texto }))),
    crearDetalle(uni, est));
}
