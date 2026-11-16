// Lectura segura de los datos de una universidad. Sin DOM.

/** Extrae `valor` de un dato { valor, fuente, verificado_en }; null si falta. */
export const valor = (dato) => (dato && dato.valor !== undefined ? dato.valor : null);

/** Razón escrita en `sin_dato` para una ruta ("aceptacion.tasa_pct"), si existe. */
export const razonSinDato = (uni, ruta) => uni.sin_dato?.[ruta] ?? null;

/** Costo anual: { matricula, vida, total, moneda, anio } con null donde falte. */
export function costoAnual(uni) {
  const c = uni.costo_anual ?? {};
  const matricula = valor(c.matricula);
  const vida = valor(c.vida);
  const total = matricula !== null && vida !== null ? matricula + vida : null;
  return { matricula, vida, total, moneda: c.moneda ?? '', anio: c.anio_academico ?? '', nota: c.nota ?? null };
}

/** Convierte a USD con data/tipos_cambio.json; null si no hay tasa para la moneda. */
export function aUSD(monto, moneda, cambio) {
  if (monto === null || monto === undefined) return null;
  if (moneda === 'USD') return monto;
  const porUSD = cambio?.por_usd?.[moneda];
  return typeof porUSD === 'number' && porUSD > 0 ? monto / porUSD : null;
}

/** ¿El dato viene de una fuente no oficial y está marcado como aproximado? */
export const esAproximado = (dato) => Boolean(dato && dato.aproximado);

/**
 * Carreras a destacar: primero las del foco del mazo activo, si no las que caen en las
 * áreas del perfil y, si tampoco hay, todas.
 */
export function carrerasDeInteres(uni, perfil, foco = null) {
  const carreras = uni.carreras ?? [];
  const con = (areas) => carreras.filter((c) => (c.areas ?? []).some((a) => areas.has(a)));
  const delFoco = foco ? con(new Set([foco])) : [];
  if (delFoco.length) return delFoco;
  const delPerfil = con(new Set(perfil?.areas ?? []));
  return delPerfil.length ? delPerfil : carreras;
}

/** Enlace para ver fotos del campus en Wikimedia Commons. */
export function enlaceFotos(uni) {
  if (uni.fotos_enlace) return uni.fotos_enlace;
  const consulta = encodeURIComponent(uni.fotos_busqueda ?? `${uni.nombre} campus`);
  return `https://commons.wikimedia.org/w/index.php?search=${consulta}&title=Special:MediaSearch&type=image`;
}

/** Todas las fuentes citadas en la universidad: [{ etiqueta, fuente, verificado_en }]. */
export function fuentesDe(uni) {
  const lista = [];
  const agregar = (etiqueta, dato) => {
    if (dato?.fuente) lista.push({ etiqueta, fuente: dato.fuente, verificado_en: dato.verificado_en });
  };
  agregar('Matrícula', uni.costo_anual?.matricula);
  agregar('Costo de vida', uni.costo_anual?.vida);
  agregar('Tasa de aceptación', uni.aceptacion?.tasa_pct);
  agregar('Ranking mundial', uni.rankings?.mundial);
  agregar('Ranking por especialidad', uni.rankings?.especialidad);
  agregar('SAT', uni.requisitos?.sat);
  agregar('Inglés', uni.requisitos?.ingles);
  agregar('Promedio de referencia', uni.requisitos?.gpa_referencia);
  return lista;
}
