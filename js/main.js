// Arranque: registra las vistas y enciende el enrutador.
import { registrar, iniciar, irA } from './router.js';
import { leerPerfil } from './store.js';
import { montarPerfil } from './profile.js';
import { montarMazo } from './deck.js';
import { montarResultados } from './results.js';

/** Las vistas que dependen del perfil mandan al formulario si aún no existe. */
function conPerfil(montar) {
  return (contenedor) => {
    if (!leerPerfil()) return irA('perfil');
    return montar(contenedor);
  };
}

registrar('perfil', montarPerfil);
registrar('mazo', conPerfil(montarMazo));
registrar('resultados', conPerfil(montarResultados));
iniciar();
