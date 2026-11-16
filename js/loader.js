// Carga el índice de packs, las universidades y el tipo de cambio. Guarda en memoria.

let cache = null;

async function leerJSON(ruta) {
  const respuesta = await fetch(ruta, { cache: 'no-cache' });
  if (!respuesta.ok) throw new Error(`No se pudo leer ${ruta} (${respuesta.status}).`);
  return respuesta.json();
}

/**
 * @returns {Promise<{packs:object[], universidades:object[], cambio:object|null}>}
 * Un pack lista sus universidades como objetos o como rutas a archivos dentro de data/.
 */
export async function cargarDatos() {
  if (cache) return cache;
  const indice = await leerJSON('data/packs/index.json');
  const universidades = [];
  const packs = [];

  for (const entrada of indice.packs) {
    const pack = await leerJSON(`data/packs/${entrada.archivo}`);
    packs.push({ id: pack.id, nombre: pack.nombre, descripcion: pack.descripcion ?? '',
      foco: pack.area_foco ?? null, ids: [] });
    for (const item of pack.universidades) {
      const uni = typeof item === 'string' ? await leerJSON(`data/${item}`) : item;
      packs.at(-1).ids.push(uni.id);
      const existente = universidades.find((u) => u.id === uni.id);
      if (existente) existente.packs.push(pack.id); // la misma universidad en varios packs
      else universidades.push({ ...uni, packs: [pack.id] });
    }
  }

  const cambio = await leerJSON('data/tipos_cambio.json').catch(() => null);
  cache = { packs, universidades, cambio };
  return cache;
}
