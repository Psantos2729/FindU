// Gesto de arrastre de la carta y animación de salida. No sabe nada de universidades.

const UMBRAL_PX = 110;      // distancia para que el voto cuente al soltar
const ROTACION_MAX = 12;    // grados
const NO_ARRASTRA = 'button, a, summary, input, .galeria, .carta__detalle';
const SALIDA = { gusta: ['130vw', '0px', 18], neutral: ['0px', '110vh', 0], no: ['-130vw', '0px', -18] };

/** Traduce un desplazamiento en un voto candidato (o null si es muy corto). */
export function votoPorDesplazamiento(dx, dy) {
  if (dy > Math.abs(dx) && dy > 24) return 'neutral';
  if (Math.abs(dx) > 24) return dx > 0 ? 'gusta' : 'no';
  return null;
}

function pintar(carta, dx, dy) {
  const voto = votoPorDesplazamiento(dx, dy);
  const distancia = voto === 'neutral' ? dy : Math.abs(dx);
  carta.style.setProperty('--dx', `${dx}px`);
  carta.style.setProperty('--dy', `${Math.max(dy, -30)}px`);
  carta.style.setProperty('--rot', `${Math.max(-1, Math.min(1, dx / 320)) * ROTACION_MAX}deg`);
  carta.style.setProperty('--fuerza', voto ? Math.min(1, distancia / UMBRAL_PX).toFixed(2) : '0');
  if (voto) carta.dataset.sello = voto; else delete carta.dataset.sello;
}

function soltar(carta) {
  carta.classList.remove('carta--arrastrando');
  for (const v of ['--dx', '--dy', '--rot', '--fuerza']) carta.style.removeProperty(v);
  delete carta.dataset.sello;
}

/** Activa el arrastre con mouse o dedo. `alVotar(voto)` se llama al soltar pasado el umbral. */
export function activarArrastre(carta, alVotar) {
  let inicio = null;

  carta.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest(NO_ARRASTRA)) return;
    inicio = { x: e.clientX, y: e.clientY, id: e.pointerId };
    carta.setPointerCapture(e.pointerId);
    carta.classList.add('carta--arrastrando');
  });

  carta.addEventListener('pointermove', (e) => {
    if (!inicio || e.pointerId !== inicio.id) return;
    pintar(carta, e.clientX - inicio.x, e.clientY - inicio.y);
  });

  const terminar = (e) => {
    if (!inicio || e.pointerId !== inicio.id) return;
    const dx = e.clientX - inicio.x;
    const dy = e.clientY - inicio.y;
    inicio = null;
    const voto = votoPorDesplazamiento(dx, dy);
    const distancia = voto === 'neutral' ? dy : Math.abs(dx);
    if (e.type === 'pointerup' && voto && distancia >= UMBRAL_PX) alVotar(voto);
    else soltar(carta);
  };
  carta.addEventListener('pointerup', terminar);
  carta.addEventListener('pointercancel', terminar);
}

const esperar = (ms) => new Promise((listo) => setTimeout(listo, ms));

/** Estampa el sello y saca la carta de la pantalla. Igual para gesto, botón y teclado. */
export async function lanzar(carta, voto) {
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  carta.classList.remove('carta--arrastrando');
  carta.dataset.sello = voto;
  carta.style.setProperty('--fuerza', '1');
  carta.classList.add('carta--golpe');
  await esperar(reducido ? 60 : 240);

  const [dx, dy, rot] = SALIDA[voto];
  carta.classList.add('carta--sale');
  if (!reducido) {
    carta.style.setProperty('--dx', dx);
    carta.style.setProperty('--dy', dy);
    carta.style.setProperty('--rot', `${rot}deg`);
  }
  await esperar(reducido ? 60 : 260);
}
