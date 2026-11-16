// Definición declarativa del formulario de perfil. Agregar un campo = agregar un objeto.

export const AREAS = [
  { valor: 'computer-science', texto: 'Computer Science' },
  { valor: 'inteligencia-artificial', texto: 'Inteligencia Artificial' },
  { valor: 'software-engineering', texto: 'Software Engineering' },
  { valor: 'computer-engineering', texto: 'Computer Engineering' },
  { valor: 'data-science', texto: 'Data Science' },
  { valor: 'game-design', texto: 'Game Design' },
  { valor: 'ciberseguridad', texto: 'Ciberseguridad' },
  { valor: 'cs-business', texto: 'CS + Business' },
];

export const EXAMENES_INGLES = ['TOEFL iBT', 'IELTS', 'Duolingo English Test', 'Cambridge'];

export const SECCIONES = [
  {
    titulo: 'Lo básico',
    campos: [
      { id: 'promedio', tipo: 'numero', etiqueta: 'Promedio general', obligatorio: true,
        min: 0, paso: 0.01, ayuda: 'Tu promedio acumulado de bachillerato.' },
      { id: 'escala', tipo: 'numero', etiqueta: 'Escala del promedio', obligatorio: true,
        min: 1, paso: 0.1, inicial: 100, ayuda: 'Nota máxima posible: 100, 10, 6 o 4.' },
      { id: 'areas', tipo: 'casillas', etiqueta: 'Carreras que te interesan', obligatorio: true,
        opciones: AREAS, inicial: AREAS.map((a) => a.valor) },
      { id: 'necesita_beca', tipo: 'sino', etiqueta: '¿Necesitas beca?', obligatorio: true },
    ],
  },
  {
    titulo: 'Exámenes',
    opcional: true,
    campos: [
      { id: 'sat', tipo: 'numero', etiqueta: 'SAT (total)', min: 400, max: 1600, paso: 10,
        ayuda: 'Déjalo vacío si aún no lo tomas.' },
      { id: 'ingles_examen', tipo: 'seleccion', etiqueta: 'Examen de inglés',
        opciones: EXAMENES_INGLES },
      { id: 'ingles_puntaje', tipo: 'numero', etiqueta: 'Puntaje de inglés', min: 0, paso: 0.5,
        ayuda: 'TOEFL iBT: sirve la escala nueva (1 a 6) o la anterior (0 a 120).' },
      { id: 'idiomas', tipo: 'texto', etiqueta: 'Idiomas',
        ayuda: 'Ejemplo: español nativo, inglés C1, alemán B1.' },
    ],
  },
  {
    titulo: 'Trayectoria',
    opcional: true,
    campos: [
      { id: 'logros', tipo: 'area', etiqueta: 'Logros y premios', ayuda: 'Uno por línea.' },
      { id: 'horas_sociales', tipo: 'numero', etiqueta: 'Horas de ayuda social', min: 0, paso: 1 },
      { id: 'extracurriculares', tipo: 'area', etiqueta: 'Actividades extracurriculares',
        ayuda: 'Una por línea.' },
      { id: 'proyectos', tipo: 'area', etiqueta: 'Proyectos', ayuda: 'Uno por línea.' },
    ],
  },
  {
    titulo: 'Destino y presupuesto',
    opcional: true,
    campos: [
      { id: 'paises', tipo: 'texto', etiqueta: 'Países objetivo',
        ayuda: 'Separados por coma. Ejemplo: Canadá, Italia, Irlanda.' },
      { id: 'presupuesto_usd', tipo: 'numero', etiqueta: 'Presupuesto anual (USD)', min: 0,
        paso: 500, ayuda: 'Lo que tu familia puede cubrir al año, sin contar becas.' },
    ],
  },
];
