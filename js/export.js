// Exporta la lista final a JSON y CSV, y guarda o restaura el respaldo completo.
import { descargar, hoyISO } from './ui.js';
import { crearRespaldo, restaurarRespaldo } from './store.js';
import { valor, costoAnual, aUSD, carrerasDeInteres } from './datos.js';

const TEXTO_VOTO = { gusta: 'Me gusta', neutral: 'Neutral', no: 'No me gustó' };

/** Aplana un elemento de la lista final { uni, voto, est } a una fila simple. */
export function aFila({ uni, voto, est }, perfil, cambio) {
  const costo = costoAnual(uni);
  const base = costo.total ?? costo.matricula;
  const usd = aUSD(base, costo.moneda, cambio);
  return {
    decision: TEXTO_VOTO[voto],
    universidad: uni.nombre,
    ciudad: uni.ciudad,
    pais: uni.pais,
    admision: est.etiqueta,
    admision_min_pct: est.rango[0],
    admision_max_pct: est.rango[1],
    confianza: est.confianza,
    carreras: carrerasDeInteres(uni, perfil).map((c) => c.nombre).join(' | '),
    costo_anual: base,
    moneda: costo.moneda,
    costo_anual_usd: usd === null ? null : Math.round(usd),
    anio_costo: costo.anio,
    aceptacion_pct: valor(uni.aceptacion?.tasa_pct),
    ranking_mundial: uni.rankings?.mundial?.posicion ?? null,
    sistema_ranking_mundial: uni.rankings?.mundial?.sistema ?? null,
    ranking_especialidad: uni.rankings?.especialidad?.posicion ?? null,
    sistema_ranking_especialidad: uni.rankings?.especialidad?.sistema ?? null,
    becas: (uni.becas ?? []).map((b) => b.nombre).join(' | '),
    alertas: (uni.alertas ?? []).map((a) => `${a.nivel}: ${a.texto}`).join(' | '),
    sitio_web: uni.sitio_web ?? null,
  };
}

function celdaCSV(dato) {
  if (dato === null || dato === undefined) return '';
  const texto = String(dato);
  return /[",\n;]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

export function aCSV(filas) {
  if (!filas.length) return '';
  const columnas = Object.keys(filas[0]);
  const lineas = [columnas.join(','), ...filas.map((f) => columnas.map((c) => celdaCSV(f[c])).join(','))];
  return `﻿${lineas.join('\r\n')}`; // BOM: Excel abre los acentos bien
}

export function exportarJSON(filas) {
  const contenido = JSON.stringify({ exportado_en: new Date().toISOString(), universidades: filas }, null, 2);
  descargar(`universidades-${hoyISO()}.json`, contenido, 'application/json');
}

export function exportarCSV(filas) {
  descargar(`universidades-${hoyISO()}.csv`, aCSV(filas), 'text/csv;charset=utf-8');
}

export function exportarRespaldo() {
  descargar(`respaldo-universidades-${hoyISO()}.json`, JSON.stringify(crearRespaldo(), null, 2), 'application/json');
}

/** Lee un archivo de respaldo y lo restaura. Lanza Error si no sirve. */
export async function importarRespaldo(archivo) {
  let datos;
  try {
    datos = JSON.parse(await archivo.text());
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  restaurarRespaldo(datos);
}
