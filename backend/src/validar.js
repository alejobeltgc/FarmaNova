const { valores } = require('./taxonomia');

const CAMPOS_MODELO = [
  'urgencia',
  'especialidad_terapeutica',
  'tipo_consulta',
  'posible_evento_adverso',
  'uso_fuera_de_indicacion',
  'justificacion',
];
const ENUMS = ['urgencia', 'especialidad_terapeutica', 'tipo_consulta'];
const ALERTAS = ['posible_evento_adverso', 'uso_fuera_de_indicacion'];

const fallo = (error) => ({ ok: false, error });

// Acepta texto (con o sin bloque ```json) u objeto. Devuelve { ok, datos } o { ok, error }.
function validar(entrada) {
  let datos = entrada;
  if (typeof entrada === 'string') {
    const sinBloque = entrada.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    try {
      datos = JSON.parse(sinBloque);
    } catch {
      return fallo('La respuesta no es JSON');
    }
  }
  if (datos === null || typeof datos !== 'object' || Array.isArray(datos)) {
    return fallo('La respuesta no es un objeto JSON');
  }

  for (const c of CAMPOS_MODELO) if (!(c in datos)) return fallo(`Falta el campo ${c}`);
  for (const c of Object.keys(datos)) if (!CAMPOS_MODELO.includes(c)) return fallo(`Campo no permitido: ${c}`);

  for (const c of ENUMS) {
    if (!valores(c).includes(datos[c])) return fallo(`Valor fuera del catálogo en ${c}`);
  }
  for (const c of ALERTAS) {
    if (typeof datos[c] !== 'boolean') return fallo(`${c} debe ser booleano`);
  }
  const just = datos.justificacion;
  if (typeof just !== 'string' || just.trim() === '') return fallo('Justificación vacía');
  if (just.length > 200) return fallo('Justificación de más de 200 caracteres');

  const resultado = { ...datos };
  if (resultado.posible_evento_adverso || resultado.uso_fuera_de_indicacion) resultado.urgencia = 'alta';
  return { ok: true, datos: resultado };
}

module.exports = { validar, CAMPOS_MODELO };
