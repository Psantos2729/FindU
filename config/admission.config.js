// Pesos y umbrales de la estimación de admisión. Edita aquí, no en js/admission.js.
// Los pesos se suman en "log-odds": +0.4 sube una base de 50 % a ~60 %.

export default {
  // Tasa base cuando la universidad no publica su tasa de aceptación.
  base_sin_dato: 0.5,
  // La tasa base nunca se toma por debajo ni por encima de estos valores.
  limites_base: [0.03, 0.92],

  // Promedio normalizado (0 a 1) contra el que se compara si la universidad no da referencia.
  gpa_referencia_por_defecto: 0.85,

  pesos: {
    gpa: 6,                  // por cada 1.0 de diferencia normalizada (0.05 de diferencia → 0.3)
    sat: 0.9,                // por cada "ancho de rango medio" sobre o bajo el centro (o 400 puntos sobre el mínimo)
    sat_requerido_sin_nota: -0.6,
    bajo_minimo: -2.5,       // no llegar al mínimo de inglés o de SAT
    logro: 0.08,             // por cada logro, hasta `tope_logros`
    cien_horas_sociales: 0.1, // por cada 100 horas, hasta `tope_horas`
    extracurricular: 0.05,   // por cada actividad o proyecto, hasta `tope_actividades`
  },
  tope_logros: 4,
  tope_horas: 300,
  tope_actividades: 6,

  // Centro de la estimación (0 a 1) desde el cual aplica cada etiqueta.
  umbrales: { seguro: 0.7, probable: 0.35 },

  // Mitad del ancho del rango mostrado, en puntos porcentuales, según la confianza.
  amplitud: { alta: 7, media: 12, baja: 18 },
  // El rango mostrado nunca baja de 5 % ni sube de 95 %: ninguna admisión es imposible ni segura.
  limites_pct: [5, 95],
};
