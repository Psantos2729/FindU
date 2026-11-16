// Vista del mazo: una carta a la vez, progreso, votos por gesto, botón o teclado, y deshacer.
import { el, aviso } from './ui.js';
import { cargarDatos } from './loader.js';
import { leerPerfil, leerDecisiones, guardarDecision, borrarDecision, leerMazo, guardarMazo } from './store.js';
import { crearCarta, SELLOS } from './card.js';
import { activarArrastre, lanzar } from './swipe.js';

const TECLAS = { ArrowRight: 'gusta', ArrowDown: 'neutral', ArrowLeft: 'no' };
const ESCRIBIENDO = 'input, textarea, select';

/** Id de la decisión más reciente, o null. */
function ultimaDecision(decisiones) {
  const pares = Object.entries(decisiones).sort((a, b) => b[1].fecha.localeCompare(a[1].fecha));
  return pares.length ? pares[0][0] : null;
}

export async function montarMazo(contenedor) {
  let datos;
  try {
    datos = await cargarDatos();
  } catch (error) {
    contenedor.append(el('h1', { text: 'No se pudieron cargar las universidades' }),
      el('p', { text: `${error.message} Abre la app con iniciar.bat, no con doble clic en index.html.` }));
    return null;
  }

  const perfil = leerPerfil();
  const { packs, cambio } = datos;
  // Mazo activo: un pack o todos. Se recuerda entre visitas.
  let mazo = packs.some((p) => p.id === leerMazo()) ? leerMazo() : '';
  let universidades = [];
  let total = 0;
  let foco = null;
  let ocupado = false;   // evita votos dobles durante la animación
  let cartaActual = null;

  const textoProgreso = el('p', { class: 'mazo__conteo' });
  const barra = el('div', { class: 'mazo__barra', role: 'progressbar', 'aria-valuemin': 0,
    'aria-label': 'Universidades votadas' }, el('span'));
  const descripcion = el('p', { class: 'nota' });
  const selector = el('select', { id: 'mazo-activo', onChange: (e) => { guardarMazo(e.target.value); elegirMazo(e.target.value); } },
    el('option', { value: '', text: `Todos (${datos.universidades.length})` }),
    packs.map((p) => el('option', { value: p.id, selected: p.id === mazo,
      text: `${p.nombre} (${datos.universidades.filter((u) => u.packs.includes(p.id)).length})` })));

  function elegirMazo(id) {
    mazo = id;
    const pack = packs.find((p) => p.id === id);
    // Con un pack elegido se respeta el orden del pack (por ejemplo, el del ranking).
    universidades = pack
      ? pack.ids.map((uid) => datos.universidades.find((u) => u.id === uid))
      : datos.universidades;
    total = universidades.length;
    foco = pack?.foco ?? null;
    descripcion.textContent = pack?.descripcion ?? '';
    barra.setAttribute('aria-valuemax', total);
    pintar();
  }
  const escena = el('div', { class: 'mazo__escena' });
  const botonDeshacer = el('button', { type: 'button', class: 'boton boton--secundario',
    'aria-label': 'Deshacer el último voto', onClick: deshacer }, '↶ Deshacer');
  const botones = el('div', { class: 'mazo__acciones' },
    [...SELLOS].reverse().map((s) => el('button', { type: 'button', class: `voto voto--${s.voto}`,
      onClick: () => votar(s.voto) },
    el('span', { class: 'voto__icono', 'aria-hidden': 'true', text: s.icono }),
    el('span', { text: s.texto }))));
  const pista = el('p', { class: 'nota mazo__pista',
    text: 'Arrastra la carta o usa el teclado: → me gusta, ↓ neutral, ← no me gustó, Z deshace.' });

  function pintar() {
    const decisiones = leerDecisiones();
    const votadas = universidades.filter((u) => decisiones[u.id]).length;
    const siguiente = universidades.find((u) => !decisiones[u.id]);

    textoProgreso.textContent = `${votadas} de ${total} votadas`;
    barra.setAttribute('aria-valuenow', votadas);
    barra.firstChild.style.width = `${total ? (votadas / total) * 100 : 0}%`;
    botonDeshacer.disabled = votadas === 0;
    botones.hidden = pista.hidden = !siguiente;

    if (siguiente) {
      cartaActual = crearCarta(siguiente, { perfil, cambio, foco });
      cartaActual.dataset.id = siguiente.id;
      activarArrastre(cartaActual, votar);
      escena.replaceChildren(cartaActual);
    } else {
      cartaActual = null;
      escena.replaceChildren(el('div', { class: 'mazo__fin' },
        el('h1', { text: total ? 'Ya votaste todas las de este mazo' : 'Aún no hay universidades' }),
        el('p', { text: total
          ? 'Tu lista final está lista, ordenada por lo que te gustó y tu probabilidad de admisión.'
          : 'Agrega un pack en data/packs/ y regístralo en index.json.' }),
        total > 0 && el('a', { class: 'boton', href: '#resultados', text: 'Ver lista final' })));
    }
  }

  async function votar(voto) {
    if (ocupado || !cartaActual) return;
    ocupado = true;
    const carta = cartaActual;
    guardarDecision(carta.dataset.id, voto);
    await lanzar(carta, voto);
    aviso(`${SELLOS.find((s) => s.voto === voto).texto}: ${carta.getAttribute('aria-label')}`);
    ocupado = false;
    pintar();
  }

  function deshacer() {
    if (ocupado) return;
    const id = ultimaDecision(leerDecisiones());
    if (!id) return;
    borrarDecision(id);
    aviso('Voto deshecho');
    pintar();
  }

  function alTeclear(evento) {
    if (evento.target.closest(ESCRIBIENDO) || evento.ctrlKey || evento.metaKey || evento.altKey) return;
    if (TECLAS[evento.key]) {
      evento.preventDefault();
      votar(TECLAS[evento.key]);
    } else if (evento.key.toLowerCase() === 'z' || evento.key === 'Backspace') {
      evento.preventDefault();
      deshacer();
    }
  }

  contenedor.append(
    el('div', { class: 'mazo' },
      el('div', { class: 'mazo__cabecera' },
        el('label', { class: 'filtro', for: 'mazo-activo' }, el('span', { text: 'Mazo' }), selector),
        descripcion),
      el('div', { class: 'mazo__progreso' }, textoProgreso, barra),
      escena,
      el('div', { class: 'mazo__controles' }, botones, botonDeshacer),
      pista));
  window.addEventListener('keydown', alTeclear);
  elegirMazo(mazo);
  return () => window.removeEventListener('keydown', alTeclear);
}
