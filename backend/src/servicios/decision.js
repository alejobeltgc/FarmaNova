const almacen = require('../almacen');
const { validar } = require('../validar');
const { valores } = require('../taxonomia');
const { ErrorApi } = require('../errores');
const { calcular } = require('./escalamiento');

// Campos que el analista puede corregir (la justificación la escribe el modelo).
const CORREGIBLES = ['urgencia', 'especialidad_terapeutica', 'tipo_consulta', 'posible_evento_adverso', 'uso_fuera_de_indicacion'];
const ALERTAS = ['posible_evento_adverso', 'uso_fuera_de_indicacion'];
const MOTIVO_MIN = 10;

const valorInvalido = (campo) => new ErrorApi(400, 'VALOR_INVALIDO', `Valor no permitido en ${campo}`);
const publica = ({ consulta_id, ...resto }) => resto;

function decidir(id, { accion, analista, cambios, motivo }) {
  const sugerida = almacen.obtenerClasificacion(id);
  if (!sugerida) throw new ErrorApi(404, 'NO_ENCONTRADA', 'No encontramos la clasificación');
  if (sugerida.estado !== 'sugerida') throw new ErrorApi(409, 'YA_DECIDIDA', 'Esta clasificación ya fue revisada');
  if (typeof analista !== 'string' || analista.trim() === '') {
    throw new ErrorApi(400, 'ANALISTA_REQUERIDO', 'Selecciona tu nombre');
  }
  if (accion !== 'aceptar' && accion !== 'corregir') throw valorInvalido('accion');

  const valoresFinal = {};
  for (const c of [...CORREGIBLES, 'justificacion']) valoresFinal[c] = sugerida[c];
  let corregidos = [];
  let motivoFinal = null;

  if (accion === 'corregir') {
    const pedidos = cambios && typeof cambios === 'object' && !Array.isArray(cambios) ? cambios : {};
    for (const [campo, valor] of Object.entries(pedidos)) {
      if (!CORREGIBLES.includes(campo)) throw valorInvalido(campo);
      const permitido = ALERTAS.includes(campo) ? typeof valor === 'boolean' : valores(campo).includes(valor);
      if (!permitido) throw valorInvalido(campo);
      valoresFinal[campo] = valor;
    }
    // validar() aplica la regla de alertas: si alguna queda en sí, la urgencia es alta.
    valoresFinal.urgencia = validar(valoresFinal).datos.urgencia;
    corregidos = CORREGIBLES.filter((c) => valoresFinal[c] !== sugerida[c]);
    if (corregidos.length === 0) throw new ErrorApi(400, 'SIN_CAMBIOS', 'No cambiaste ningún campo');
    motivoFinal = typeof motivo === 'string' ? motivo.trim() : '';
    if (motivoFinal.length < MOTIVO_MIN) throw new ErrorApi(400, 'MOTIVO_REQUERIDO', 'Escribe el motivo de la corrección');
  }

  almacen.cambiarEstado(id, accion === 'aceptar' ? 'aceptada' : 'corregida');
  const final = almacen.guardarClasificacion({
    consulta_id: sugerida.consulta_id,
    sugerida_id: sugerida.id,
    origen: accion === 'aceptar' ? sugerida.origen : 'analista',
    estado: 'final',
    ...valoresFinal,
    analista: analista.trim(),
    motivo: motivoFinal,
    campos_corregidos: corregidos,
    fecha: new Date().toISOString(),
  });
  return { final: publica(final), campos_corregidos: corregidos, escalamiento: calcular(final) };
}

module.exports = { decidir };
