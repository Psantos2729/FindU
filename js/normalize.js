// Conversión de notas entre escalas. Sin estado ni DOM.

/**
 * Lleva un promedio a la escala 0–1.
 * Es una regla lineal (92/100 → 0.92; 3.7/4 → 0.925): sirve para comparar a grandes
 * rasgos, no reemplaza la conversión oficial de cada universidad.
 */
export function normalizarGPA(valor, escala) {
  if (typeof valor !== 'number' || typeof escala !== 'number' || escala <= 0) return null;
  return Math.min(1, Math.max(0, valor / escala));
}

/** ¿El examen de inglés del perfil es el mismo que pide la universidad? */
export function mismoExamen(delPerfil, deLaUniversidad) {
  if (!delPerfil || !deLaUniversidad) return false;
  const limpiar = (t) => t.toLowerCase().replace(/[^a-z]/g, '');
  const a = limpiar(delPerfil);
  const b = limpiar(deLaUniversidad);
  return a.startsWith(b) || b.startsWith(a);
}

/** Cuenta líneas no vacías de un texto ("uno por línea"). */
export function contarLineas(texto) {
  return (texto ?? '').split('\n').filter((l) => l.trim()).length;
}
