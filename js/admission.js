// Estimación orientativa de admisión. Función pura: mismos datos → mismo resultado.
import CONFIG from '../config/admission.config.js';
import { normalizarGPA, mismoExamen, contarLineas } from './normalize.js';

const NIVELES = ['alta', 'media', 'baja'];
const logit = (p) => Math.log(p / (1 - p));
const sigmoide = (x) => 1 / (1 + Math.exp(-x));
const acotar = (n, [min, max]) => Math.min(max, Math.max(min, n));
const valor = (dato) => (dato && dato.valor !== undefined ? dato.valor : null);

/**
 * @returns {{etiqueta:string, rango:[number,number], centro:number,
 *            confianza:'alta'|'media'|'baja', motivos:{signo:string,texto:string}[]}}
 */
export function estimarAdmision(perfil, uni, config = CONFIG) {
  const motivos = [];
  let bajadas = 0; // cada bajada reduce un nivel de confianza
  const nota = (signo, texto) => motivos.push({ signo, texto });
  const req = uni.requisitos ?? {};
  const pesos = config.pesos;

  // 1. Línea base: tasa de aceptación
  const tasa = valor(uni.aceptacion?.tasa_pct);
  let puntos;
  if (tasa === null) {
    puntos = logit(config.base_sin_dato);
    bajadas += 1;
    nota('±', 'Sin tasa de aceptación publicada: se parte de una base neutra.');
  } else {
    puntos = logit(acotar(tasa / 100, config.limites_base));
    const aprox = uni.aceptacion.tasa_pct.aproximado ? ' (cifra no oficial)' : '';
    nota('±', `Tasa de aceptación de ${tasa} %${aprox} como punto de partida.`);
  }

  // 2. Promedio
  const gpa = normalizarGPA(perfil.promedio, perfil.escala);
  const refDato = req.gpa_referencia;
  const ref = refDato ? normalizarGPA(valor(refDato), refDato.escala) : null;
  if (gpa !== null) {
    const contra = ref ?? config.gpa_referencia_por_defecto;
    const diferencia = gpa - contra;
    puntos += diferencia * pesos.gpa;
    const origen = ref === null ? 'una referencia general' : 'la referencia de la universidad';
    if (ref === null) bajadas += 1;
    const signo = Math.abs(diferencia) < 0.01 ? '±' : diferencia > 0 ? '+' : '−';
    const relacion = signo === '±' ? 'al nivel de' : signo === '+' ? 'sobre' : 'bajo';
    nota(signo, `Tu promedio (${perfil.promedio}/${perfil.escala}) está ${relacion} ${origen}.`);
  }

  // 3. SAT frente al rango medio 50 %
  const { p25, p75 } = req.sat ?? {};
  if (typeof p25 === 'number' && typeof p75 === 'number' && p75 > p25) {
    if (typeof perfil.sat === 'number') {
      const posicion = acotar((perfil.sat - (p25 + p75) / 2) / (p75 - p25), [-1.5, 1.5]);
      puntos += posicion * pesos.sat;
      const signo = perfil.sat > p75 ? '+' : perfil.sat < p25 ? '−' : '±';
      const donde = signo === '+' ? 'sobre' : signo === '−' ? 'bajo' : 'dentro de';
      nota(signo, `Tu SAT (${perfil.sat}) está ${donde} el rango medio (${p25}–${p75}).`);
    } else if (req.sat.requerido) {
      puntos += pesos.sat_requerido_sin_nota;
      nota('−', 'Pide SAT y aún no tienes puntaje en tu perfil.');
    }
  } else if (typeof req.sat?.minimo === 'number') {
    // Sin rango medio publicado: solo se sabe el puntaje mínimo para competir.
    if (typeof perfil.sat !== 'number') {
      puntos += pesos.sat_requerido_sin_nota;
      nota('−', `Pide SAT (mínimo ${req.sat.minimo}) y aún no tienes puntaje en tu perfil.`);
    } else if (perfil.sat < req.sat.minimo) {
      puntos += pesos.bajo_minimo;
      nota('−', `Tu SAT (${perfil.sat}) no llega al mínimo de ${req.sat.minimo}.`);
    } else {
      const margen = acotar((perfil.sat - req.sat.minimo) / 400, [0, 1.5]);
      puntos += margen * pesos.sat;
      nota('+', `Tu SAT (${perfil.sat}) supera el mínimo de ${req.sat.minimo}; los cupos se asignan por puntaje.`);
    }
  } else if (req.sat?.requerido === false) {
    nota('±', 'No exige SAT: tu puntaje no entra en el cálculo.');
  }

  // 4. Inglés frente al mínimo
  let minimo = req.ingles?.minimo;
  // TOEFL cambió de escala en 2026 (de 0–120 a 1–6): se compara con la que use el perfil.
  const escalaVieja = req.ingles?.escala === '1-6' && perfil.ingles_puntaje > 6;
  if (escalaVieja) minimo = req.ingles.minimo_escala_anterior ?? minimo;
  if (escalaVieja && !req.ingles.minimo_escala_anterior) {
    bajadas += 1;
    nota('±', `Pide ${req.ingles.examen} ${minimo} en la escala nueva (1–6); tu puntaje es de la anterior.`);
  } else if (typeof minimo === 'number') {
    if (typeof perfil.ingles_puntaje !== 'number') {
      nota('±', `Pide ${req.ingles.examen} ${minimo} y aún no tienes puntaje en tu perfil.`);
    } else if (!mismoExamen(perfil.ingles_examen, req.ingles.examen)) {
      bajadas += 1;
      nota('±', `Pide ${req.ingles.examen} ${minimo}; tu examen es otro y no se puede comparar.`);
    } else if (perfil.ingles_puntaje < minimo) {
      puntos += pesos.bajo_minimo;
      nota('−', `Tu ${req.ingles.examen} (${perfil.ingles_puntaje}) no llega al mínimo de ${minimo}.`);
    } else {
      nota('+', `Cumples el mínimo de ${req.ingles.examen} (${minimo}).`);
    }
  }

  // 5. Modificadores pequeños
  const logros = Math.min(contarLineas(perfil.logros), config.tope_logros);
  const horas = Math.min(perfil.horas_sociales ?? 0, config.tope_horas);
  const actividades = Math.min(
    contarLineas(perfil.extracurriculares) + contarLineas(perfil.proyectos), config.tope_actividades);
  const extra = logros * pesos.logro + (horas / 100) * pesos.cien_horas_sociales
    + actividades * pesos.extracurricular;
  if (extra > 0) {
    puntos += extra;
    nota('+', 'Logros, ayuda social y actividades suman un poco.');
  }

  // 6. Tipo de admisión: baja la confianza cuando los números no deciden solos
  const avisos = {
    holistica: 'Admisión holística: ensayos y perfil pesan tanto como las notas.',
    'prueba-propia': 'Se entra por una prueba propia de la universidad, que aquí no se puede medir.',
    abierta: 'Acceso abierto o por cupo: cumplir los requisitos pesa más que competir.',
  };
  if (avisos[req.tipo_admision]) {
    if (req.tipo_admision !== 'abierta') bajadas += 1;
    nota('±', avisos[req.tipo_admision]);
  }

  const centro = sigmoide(puntos);
  const confianza = NIVELES[Math.min(bajadas, NIVELES.length - 1)];
  const mitad = config.amplitud[confianza];
  const redondear = (pct) => Math.round(acotar(pct, config.limites_pct) / 5) * 5;
  let bajo = redondear(centro * 100 - mitad);
  let alto = Math.max(redondear(centro * 100 + mitad), bajo + 5);
  if (alto > config.limites_pct[1]) {
    alto = config.limites_pct[1];
    bajo = Math.min(bajo, alto - 5);
  }

  const { seguro, probable } = config.umbrales;
  // Con confianza baja nunca se promete "Seguro".
  const esSeguro = centro >= seguro && confianza !== 'baja';
  const etiqueta = esSeguro ? 'Seguro' : centro >= probable ? 'Probable' : 'Alcance';
  return { etiqueta, rango: [bajo, alto], centro, confianza, motivos };
}
