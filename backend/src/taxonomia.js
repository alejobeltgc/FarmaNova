// Fuente única de la taxonomía (docs/taxonomia.md). La usan el validador y GET /api/taxonomia.
const VERSION = '1.0';

const CAMPOS = {
  urgencia: [
    { valor: 'alta', etiqueta: 'Alta', descripcion: 'Posible evento adverso, uso fuera de indicación o paciente en riesgo inmediato' },
    { valor: 'media', etiqueta: 'Media', descripcion: 'Decisión clínica o logística en curso, sin paciente afectado' },
    { valor: 'baja', etiqueta: 'Baja', descripcion: 'Información general sin decisión inmediata' },
  ],
  especialidad_terapeutica: [
    { valor: 'cardiovascular', etiqueta: 'Cardiovascular', descripcion: 'Hipertensión, insuficiencia cardíaca, anticoagulación y similares' },
    { valor: 'respiratoria', etiqueta: 'Respiratoria', descripcion: 'Asma, EPOC, inhaladores y similares' },
    { valor: 'salud_femenina', etiqueta: 'Salud femenina', descripcion: 'Anticoncepción, embarazo, lactancia, menopausia' },
    { valor: 'dolor_cronico', etiqueta: 'Dolor crónico', descripcion: 'Analgésicos y manejo del dolor persistente' },
    { valor: 'oncologia', etiqueta: 'Oncología', descripcion: 'Tratamientos contra el cáncer' },
    { valor: 'autoinmune', etiqueta: 'Autoinmune', descripcion: 'Artritis, psoriasis, enfermedades inmunomediadas, biológicos' },
    { valor: 'antiinfecciosos', etiqueta: 'Antiinfecciosos', descripcion: 'Antibióticos, antivirales, antifúngicos' },
    { valor: 'metabolica', etiqueta: 'Metabólica', descripcion: 'Diabetes, lípidos, obesidad' },
    { valor: 'otra', etiqueta: 'Otra', descripcion: 'No se puede determinar la especialidad' },
  ],
  tipo_consulta: [
    { valor: 'composicion', etiqueta: 'Composición', descripcion: 'Principio activo, excipientes, formulación' },
    { valor: 'estudios_clinicos', etiqueta: 'Estudios clínicos', descripcion: 'Reportes de casos, evidencia o estudios' },
    { valor: 'estabilidad', etiqueta: 'Estabilidad', descripcion: 'Vigencia y conservación del producto' },
    { valor: 'cadena_de_frio', etiqueta: 'Cadena de frío', descripcion: 'Temperatura de transporte y almacenamiento' },
    { valor: 'precios_institucionales', etiqueta: 'Precios institucionales', descripcion: 'Precios y condiciones para instituciones' },
    { valor: 'otro', etiqueta: 'Otro', descripcion: 'Dosis, manejo del paciente, suspender el producto o cualquier otro tema' },
  ],
};

const REGLAS = [
  'alta: hay posible evento adverso, uso fuera de indicación o un paciente en riesgo inmediato.',
  'media: hay una decisión clínica o logística en curso (un tratamiento que empieza, un lote por despachar) sin paciente afectado.',
  'baja: información general sin decisión inmediata (composición para un registro, precios, estudios de referencia).',
  'Si posible_evento_adverso o uso_fuera_de_indicacion es true, la urgencia es siempre alta.',
  'Reportes de casos, evidencia o estudios → estudios_clinicos.',
  'Dosis, manejo del paciente o si suspender → otro.',
];

const valores = (campo) => CAMPOS[campo].map((v) => v.valor);

module.exports = { VERSION, CAMPOS, REGLAS, valores };
