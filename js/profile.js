// Vista del perfil: dibuja el formulario desde profile.fields.js, valida y guarda.
import { el, aviso } from './ui.js';
import { leerPerfil, guardarPerfil } from './store.js';
import { irA } from './router.js';
import { SECCIONES } from './profile.fields.js';

const CAMPOS = SECCIONES.flatMap((s) => s.campos);

function control(campo, valor) {
  const base = { id: campo.id, name: campo.id, 'aria-describedby': `${campo.id}-ayuda ${campo.id}-error` };
  switch (campo.tipo) {
    case 'numero':
      return el('input', { ...base, type: 'number', inputmode: 'decimal', min: campo.min,
        max: campo.max, step: campo.paso ?? 'any', value: valor ?? '', required: campo.obligatorio });
    case 'area':
      return el('textarea', { ...base, rows: 3, text: valor ?? '' });
    case 'seleccion':
      return el('select', base,
        el('option', { value: '', text: 'Sin examen todavía' }),
        campo.opciones.map((o) => el('option', { value: o, text: o, selected: o === valor })));
    case 'casillas':
      return el('div', { class: 'opciones', role: 'group', 'aria-labelledby': `${campo.id}-etiqueta` },
        campo.opciones.map((o) => el('label', { class: 'opcion' },
          el('input', { type: 'checkbox', name: campo.id, value: o.valor,
            checked: (valor ?? []).includes(o.valor) }),
          el('span', { text: o.texto }))));
    case 'sino':
      return el('div', { class: 'opciones', role: 'radiogroup', 'aria-labelledby': `${campo.id}-etiqueta` },
        [['si', 'Sí'], ['no', 'No']].map(([v, texto]) => el('label', { class: 'opcion' },
          el('input', { type: 'radio', name: campo.id, value: v,
            checked: valor === (v === 'si') }),
          el('span', { text: texto }))));
    default:
      return el('input', { ...base, type: 'text', value: valor ?? '' });
  }
}

function dibujarCampo(campo, perfil) {
  const valor = perfil ? perfil[campo.id] : campo.inicial;
  const esGrupo = campo.tipo === 'casillas' || campo.tipo === 'sino';
  return el('div', { class: 'campo', 'data-campo': campo.id },
    el(esGrupo ? 'span' : 'label', { class: 'campo__etiqueta', id: `${campo.id}-etiqueta`,
      for: esGrupo ? null : campo.id, text: campo.etiqueta }),
    control(campo, valor),
    campo.ayuda && el('span', { class: 'campo__ayuda', id: `${campo.id}-ayuda`, text: campo.ayuda }),
    el('span', { class: 'campo__error', id: `${campo.id}-error`, role: 'alert' }));
}

/** Lee el formulario y devuelve { perfil, errores }. */
function leerFormulario(form) {
  const datos = new FormData(form);
  const perfil = {};
  const errores = {};
  for (const campo of CAMPOS) {
    let valor;
    if (campo.tipo === 'casillas') valor = datos.getAll(campo.id);
    else if (campo.tipo === 'sino') valor = datos.has(campo.id) ? datos.get(campo.id) === 'si' : null;
    else if (campo.tipo === 'numero') {
      const crudo = datos.get(campo.id).trim();
      valor = crudo === '' ? null : Number(crudo);
    } else valor = datos.get(campo.id).trim();

    const vacio = valor === null || valor === '' || (Array.isArray(valor) && !valor.length);
    if (campo.obligatorio && vacio) errores[campo.id] = 'Este dato es obligatorio.';
    else if (campo.tipo === 'numero' && valor !== null) {
      if (Number.isNaN(valor)) errores[campo.id] = 'Escribe un número.';
      else if (campo.min !== undefined && valor < campo.min) errores[campo.id] = `El mínimo es ${campo.min}.`;
      else if (campo.max !== undefined && valor > campo.max) errores[campo.id] = `El máximo es ${campo.max}.`;
    }
    perfil[campo.id] = valor;
  }
  if (!errores.promedio && !errores.escala && perfil.promedio > perfil.escala) {
    errores.promedio = `No puede ser mayor que la escala (${perfil.escala}).`;
  }
  return { perfil, errores };
}

function mostrarErrores(form, errores) {
  for (const campo of CAMPOS) {
    const caja = form.querySelector(`[data-campo="${campo.id}"]`);
    caja.querySelector('.campo__error').textContent = errores[campo.id] ?? '';
    const entrada = caja.querySelector('input:not([type=checkbox]):not([type=radio]), select, textarea');
    if (entrada) entrada.setAttribute('aria-invalid', errores[campo.id] ? 'true' : 'false');
  }
  const primero = CAMPOS.find((c) => errores[c.id]);
  if (primero) form.querySelector(`[data-campo="${primero.id}"] :is(input, select, textarea)`).focus();
}

export function montarPerfil(contenedor) {
  const perfil = leerPerfil();
  const form = el('form', { class: 'perfil', novalidate: true },
    el('h1', { text: perfil ? 'Tu perfil' : 'Empecemos por tu perfil' }),
    el('p', { class: 'perfil__intro',
      text: 'Solo "Lo básico" es obligatorio. Lo demás afina la estimación de admisión y puedes completarlo después.' }),
    SECCIONES.map((seccion) => {
      const campos = seccion.campos.map((c) => dibujarCampo(c, perfil));
      if (!seccion.opcional) return el('fieldset', {}, el('legend', { text: seccion.titulo }), campos);
      return el('details', { open: Boolean(perfil) },
        el('summary', { text: `${seccion.titulo} (opcional)` }),
        el('fieldset', {}, el('legend', { class: 'oculto-visual', text: seccion.titulo }), campos));
    }),
    el('div', { class: 'fila-botones' },
      el('button', { class: 'boton', type: 'submit', text: perfil ? 'Guardar perfil' : 'Guardar y ver universidades' })));

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const { perfil: nuevo, errores } = leerFormulario(form);
    mostrarErrores(form, errores);
    if (Object.keys(errores).length) return;
    guardarPerfil(nuevo);
    aviso('Perfil guardado');
    irA('mazo');
  });

  contenedor.append(form);
}
