// Panel de detalle de la carta: por qué de la admisión, becas, programas y fuentes.
import { el, fmtFecha } from './ui.js';
import { fuentesDe } from './datos.js';

function enlace(url, texto) {
  return el('a', { href: url, target: '_blank', rel: 'noopener', text: texto });
}

const TEXTO_ALERTA = { riesgo: 'Riesgo', 'tomar-en-cuenta': 'Tomar en cuenta' };

/** Avisos específicos de la universidad: riesgos y cosas a tomar en cuenta. */
export function crearAlertas(uni) {
  const alertas = uni.alertas ?? [];
  if (!alertas.length) return null;
  return el('ul', { class: 'alertas' }, alertas.map((a) =>
    el('li', { class: `alerta alerta--${a.nivel}` },
      el('strong', { text: `${TEXTO_ALERTA[a.nivel] ?? 'Aviso'}: ` }), a.texto)));
}

function bloqueMotivos(est) {
  return el('section', {},
    el('h3', { text: 'Por qué esta estimación' }),
    el('ul', { class: 'motivos' }, est.motivos.map((m) =>
      el('li', { 'data-signo': m.signo },
        el('span', { class: 'motivos__signo', 'aria-hidden': 'true', text: m.signo }),
        el('span', { text: m.texto })))),
    el('p', { class: 'nota',
      text: 'Es una guía calculada con tu perfil y datos públicos, no una predicción. La decisión real depende de cada universidad.' }));
}

function bloqueBecas(uni) {
  const becas = uni.becas ?? [];
  return el('section', {},
    el('h3', { text: 'Becas' }),
    becas.length
      ? el('ul', { class: 'lista-simple' }, becas.map((b) => el('li', {},
        el('strong', { text: b.nombre }),
        b.via_indesgua && el('span', { class: 'marca', text: 'INDESGUA' }),
        b.cobertura && el('p', { text: b.cobertura }),
        b.convocatoria && el('p', { class: 'nota', text: `Convocatoria: ${b.convocatoria}` }),
        b.url && el('p', {}, enlace(b.url, 'Ver convocatoria')))))
      : el('p', { class: 'nota', text: uni.sin_dato?.becas ?? 'Sin dato de becas.' }));
}

function bloqueProgramas(uni) {
  return el('section', {},
    el('h3', { text: 'Programas' }),
    el('ul', { class: 'lista-simple' }, (uni.carreras ?? []).map((c) => el('li', {},
      c.url ? enlace(c.url, c.nombre) : c.nombre,
      el('span', { class: 'nota',
        text: ` ${[c.idioma, c.duracion_anios && `${c.duracion_anios} años`].filter(Boolean).join(', ')}` })))),
    uni.requisitos?.nota && el('p', { class: 'nota', text: uni.requisitos.nota }));
}

function bloqueFuentes(uni) {
  const fuentes = fuentesDe(uni);
  if (!fuentes.length) return null;
  return el('details', { class: 'fuentes' },
    el('summary', { text: 'Fuentes de los datos' }),
    el('ul', { class: 'lista-simple' }, fuentes.map((f) => el('li', {},
      /^https?:/.test(f.fuente) ? enlace(f.fuente, f.etiqueta) : `${f.etiqueta}: ${f.fuente}`,
      f.verificado_en && el('span', { class: 'nota', text: ` (verificado el ${fmtFecha(f.verificado_en)})` })))));
}

export function crearDetalle(uni, est) {
  return el('div', { class: 'carta__detalle' },
    bloqueMotivos(est),
    bloqueBecas(uni),
    bloqueProgramas(uni),
    bloqueFuentes(uni));
}
