// Modo simulado: reglas por palabras clave. Devuelve el mismo formato que el modelo (texto JSON).
// Los nombres de producto son los del catálogo ficticio de FarmaNova.
const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const ESPECIALIDADES = [
  ['cardiovascular', /cardiolex|cardi|hipertens|anticoagul|corazon/],
  ['respiratoria', /respiral|inhalador|asma|epoc|respirator/],
  ['salud_femenina', /femivia|anticonceptiv|embarazo|lactancia|menopausia|ginecolog/],
  ['dolor_cronico', /dolonova|analgesic|dolor/],
  ['oncologia', /oncatin|cancer|oncolog|quimioterapia/],
  ['autoinmune', /inmunar|artritis|psoriasis|reumat|autoinmune/],
  ['antiinfecciosos', /bactrion|antibiotic|antiviral|antifung|infeccion|otitis/],
  ['metabolica', /glucenta|diabetes|glucosa|colesterol|obesidad/],
];
const TIPOS = [
  ['precios_institucionales', /precio|licitacion|institucional/],
  ['cadena_de_frio', /termometro|temperatura|refriger|cadena de frio|\d\s?°\s?c\b/],
  ['estabilidad', /estable|estabilidad|vigencia|caduc|conservaci/],
  ['composicion', /excipiente|composicion|principio activo|formulacion/],
  ['estudios_clinicos', /estudio|reportes? de casos|evidencia|ensayo/],
];
const EVENTO_ADVERSO = /presento|\breporta\b|sangrado|mareo|angioedema|reaccion|efecto adverso|nauseas|erupcion|hospitaliz|vomito/;
const FUERA_INDICACION = /aprobado solo|solo esta aprobado|no esta aprobado|fuera de indicacion|off.?label|no aprobad/;
const DECISION_EN_CURSO = /\bhoy\b|manana|empieza|iniciar|despach|distribuir|lote|urgente/;

const primero = (reglas, t, defecto) => (reglas.find(([, re]) => re.test(t)) || [defecto])[0];

async function completar(_sistema, texto) {
  const t = norm(texto);
  const evento = EVENTO_ADVERSO.test(t);
  const fuera = FUERA_INDICACION.test(t);
  const urgencia = evento || fuera ? 'alta' : DECISION_EN_CURSO.test(t) ? 'media' : 'baja';
  const salida = {
    urgencia,
    especialidad_terapeutica: primero(ESPECIALIDADES, t, 'otra'),
    tipo_consulta: primero(TIPOS, t, 'otro'),
    posible_evento_adverso: evento,
    uso_fuera_de_indicacion: fuera,
    justificacion: 'Clasificación simulada por palabras clave.',
  };
  return { texto: JSON.stringify(salida), modelo: null };
}

module.exports = { completar };
