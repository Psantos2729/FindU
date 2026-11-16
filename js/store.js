// Persistencia en localStorage: perfil y decisiones. Nada más toca localStorage.

const CLAVE_PERFIL = 'universidades.perfil.v1';
const CLAVE_DECISIONES = 'universidades.decisiones.v1';
const CLAVE_MAZO = 'universidades.mazo.v1';
export const VOTOS = ['gusta', 'neutral', 'no'];

function leer(clave, respaldo) {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? JSON.parse(crudo) : respaldo;
  } catch {
    return respaldo; // dato corrupto o almacenamiento bloqueado
  }
}

function escribir(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor));
}

export const leerPerfil = () => leer(CLAVE_PERFIL, null);
export const guardarPerfil = (perfil) => escribir(CLAVE_PERFIL, perfil);

/** Id del pack elegido en el mazo ('' = todos). */
export const leerMazo = () => leer(CLAVE_MAZO, '');
export const guardarMazo = (id) => escribir(CLAVE_MAZO, id);

/** Devuelve { [idUniversidad]: { voto, fecha } } */
export const leerDecisiones = () => leer(CLAVE_DECISIONES, {});

export function guardarDecision(id, voto) {
  if (!VOTOS.includes(voto)) throw new Error(`Voto desconocido: ${voto}`);
  const decisiones = leerDecisiones();
  decisiones[id] = { voto, fecha: new Date().toISOString() };
  escribir(CLAVE_DECISIONES, decisiones);
}

export function borrarDecision(id) {
  const decisiones = leerDecisiones();
  delete decisiones[id];
  escribir(CLAVE_DECISIONES, decisiones);
}

export const borrarDecisiones = () => escribir(CLAVE_DECISIONES, {});

/** Respaldo completo para exportar. */
export function crearRespaldo() {
  return {
    app: 'universidades',
    version: 1,
    exportado_en: new Date().toISOString(),
    perfil: leerPerfil(),
    decisiones: leerDecisiones(),
  };
}

/** Restaura un respaldo. Lanza Error con mensaje claro si no es válido. */
export function restaurarRespaldo(datos) {
  if (!datos || datos.app !== 'universidades' || typeof datos.decisiones !== 'object') {
    throw new Error('El archivo no es un respaldo de esta app.');
  }
  for (const [id, d] of Object.entries(datos.decisiones)) {
    if (!d || !VOTOS.includes(d.voto)) throw new Error(`Decisión no válida para "${id}".`);
  }
  if (datos.perfil) guardarPerfil(datos.perfil);
  escribir(CLAVE_DECISIONES, datos.decisiones);
}
