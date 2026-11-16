// Vista de la lista final: agrupa por decisión, ordena por admisión, filtra y exporta.
import { el, aviso, fmtNumero } from './ui.js';
import { cargarDatos } from './loader.js';
import { leerPerfil, leerDecisiones } from './store.js';
import { estimarAdmision } from './admission.js';
import { costoAnual, aUSD } from './datos.js';
import { SELLOS } from './card.js';
import { aFila, exportarJSON, exportarCSV, exportarRespaldo, importarRespaldo } from './export.js';

const ORDEN_VOTO = SELLOS.map((s) => s.voto); // me gusta, neutral, no me gustó

/** Lista final: primero lo que más gustó y, dentro de cada grupo, mejor admisión primero. */
export function construirLista(universidades, decisiones, perfil) {
  return universidades
    .filter((uni) => decisiones[uni.id])
    .map((uni) => ({ uni, voto: decisiones[uni.id].voto, est: estimarAdmision(perfil, uni) }))
    .sort((a, b) => ORDEN_VOTO.indexOf(a.voto) - ORDEN_VOTO.indexOf(b.voto) || b.est.centro - a.est.centro);
}

function pasaFiltros(item, filtros) {
  if (filtros.mazo && !item.uni.packs.includes(filtros.mazo)) return false;
  if (filtros.pais && item.uni.pais !== filtros.pais) return false;
  if (filtros.admision && item.est.etiqueta !== filtros.admision) return false;
  if (filtros.beca && !(item.uni.becas ?? []).length) return false;
  return true;
}

function fila(item, cambio) {
  const { uni, est } = item;
  const costo = costoAnual(uni);
  const base = costo.total ?? costo.matricula;
  const usd = aUSD(base, costo.moneda, cambio);
  const enUSD = usd !== null && costo.moneda !== 'USD' ? ` (≈ USD ${fmtNumero(usd)})` : '';
  const mundial = uni.rankings?.mundial;
  return el('li', { class: 'resultado' },
    el('div', {},
      el('h3', {}, uni.sitio_web
        ? el('a', { href: uni.sitio_web, target: '_blank', rel: 'noopener', text: uni.nombre })
        : uni.nombre),
      el('p', { class: 'nota', text: `${uni.ciudad}, ${uni.pais}` }),
      (uni.alertas ?? []).some((a) => a.nivel === 'riesgo')
        && el('p', { class: 'resultado__riesgo', text: 'Tiene un riesgo marcado' })),
    el('p', { class: 'resultado__admision' },
      el('strong', { text: est.etiqueta }), ` ${est.rango[0]}–${est.rango[1]} %`),
    el('p', { text: base === null ? 'Costo: sin dato' : `${costo.moneda} ${fmtNumero(base)}${enUSD} al año` }),
    el('p', { text: mundial?.posicion ? `#${mundial.posicion} ${mundial.sistema} ${mundial.anio}` : 'Ranking: sin dato' }));
}

/** `opciones` son textos o pares [valor, texto]. */
function selector(etiqueta, opciones, alCambiar) {
  return el('label', { class: 'filtro' }, el('span', { text: etiqueta }),
    el('select', { onChange: (e) => alCambiar(e.target.value) },
      el('option', { value: '', text: 'Todos' }),
      opciones.map((o) => [o].flat()).map(([v, t = v]) => el('option', { value: v, text: t }))));
}

export async function montarResultados(contenedor) {
  const { universidades, cambio, packs } = await cargarDatos();
  const perfil = leerPerfil();
  const lista = construirLista(universidades, leerDecisiones(), perfil);
  const faltan = universidades.length - lista.length;
  const filtros = { mazo: '', pais: '', admision: '', beca: false };
  const grupos = el('div', { class: 'resultados__grupos' });
  const visibles = () => lista.filter((item) => pasaFiltros(item, filtros));
  const filas = () => visibles().map((item) => aFila(item, perfil, cambio));
  const cambiar = (clave) => (v) => { filtros[clave] = v; pintar(); };

  function pintar() {
    const items = visibles();
    grupos.replaceChildren(...SELLOS.map((sello) => {
      const delGrupo = items.filter((item) => item.voto === sello.voto);
      return el('section', { class: `grupo grupo--${sello.voto}` },
        el('h2', { text: `${sello.icono} ${sello.texto} (${delGrupo.length})` }),
        delGrupo.length
          ? el('ol', { class: 'grupo__lista' }, delGrupo.map((item) => fila(item, cambio)))
          : el('p', { class: 'nota', text: 'Ninguna aquí.' }));
    }));
  }

  async function alImportar(evento) {
    try {
      await importarRespaldo(evento.target.files[0]);
      aviso('Respaldo importado');
      contenedor.replaceChildren();
      montarResultados(contenedor);
    } catch (error) {
      aviso(error.message, 5000);
    }
  }

  contenedor.append(
    el('h1', { text: 'Tu lista final' }),
    faltan > 0 && el('p', { class: 'resultados__faltan' }, `Te faltan ${faltan} por votar. `,
      el('a', { href: '#mazo', text: 'Seguir votando' })),
    el('div', { class: 'filtros' },
      selector('Mazo', packs.map((p) => [p.id, p.nombre]), cambiar('mazo')),
      selector('País', [...new Set(lista.map((i) => i.uni.pais))].sort(), cambiar('pais')),
      selector('Admisión', ['Seguro', 'Probable', 'Alcance'], cambiar('admision')),
      el('label', { class: 'filtro filtro--casilla' },
        el('input', { type: 'checkbox', onChange: (e) => cambiar('beca')(e.target.checked) }),
        el('span', { text: 'Solo con beca' }))),
    grupos,
    el('div', { class: 'fila-botones resultados__exportar' },
      el('button', { type: 'button', class: 'boton', disabled: !lista.length,
        onClick: () => { exportarCSV(filas()); aviso('CSV exportado'); } }, 'Exportar CSV'),
      el('button', { type: 'button', class: 'boton', disabled: !lista.length,
        onClick: () => { exportarJSON(filas()); aviso('JSON exportado'); } }, 'Exportar JSON'),
      el('button', { type: 'button', class: 'boton boton--secundario',
        onClick: () => { exportarRespaldo(); aviso('Respaldo guardado'); } }, 'Guardar respaldo'),
      el('label', { class: 'boton boton--secundario', for: 'respaldo', text: 'Importar respaldo' }),
      el('input', { type: 'file', accept: 'application/json', class: 'oculto-visual', id: 'respaldo',
        onChange: alImportar })),
    el('p', { class: 'nota',
      text: 'El respaldo incluye tu perfil y tus votos. Guárdalo para pasar la app a otro dispositivo.' }));
  pintar();
  return null;
}
