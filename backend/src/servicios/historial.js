const almacen = require('../almacen');
const { valores, VERSION } = require('../taxonomia');
const { ErrorApi } = require('../errores');
const { calcular } = require('./escalamiento');

const ESTADOS = ['sugerida', 'aceptada', 'corregida'];
const MAXIMO = 100;
const publica = ({ consulta_id, ...resto }) => resto;

// Sugerida y final de una consulta. El estado de la consulta es el de la sugerida (sugerida/aceptada/corregida).
function clasificacionesDe(consultaId) {
  const todas = almacen.clasificacionesDe(consultaId);
  const sugerida = todas.find((k) => k.estado !== 'final');
  const final = todas.find((k) => k.estado === 'final') || null;
  return { sugerida, final, vigente: final || sugerida, estado: sugerida.estado };
}

const alertasDe = (k) => ['posible_evento_adverso', 'uso_fuera_de_indicacion'].filter((a) => k[a]);

function listar({ urgencia, estado, alertas, ticket } = {}) {
  const items = almacen.listarConsultas().reverse().map((consulta) => {
    const { vigente, estado: est } = clasificacionesDe(consulta.id);
    return {
      consulta_id: consulta.id,
      ticket: consulta.ticket,
      extracto: consulta.texto.length > 60 ? `${consulta.texto.slice(0, 60)}…` : consulta.texto,
      urgencia: vigente.urgencia,
      especialidad_terapeutica: vigente.especialidad_terapeutica,
      tipo_consulta: vigente.tipo_consulta,
      alertas: alertasDe(vigente),
      estado: est,
      modo: consulta.modo,
      fecha: consulta.fecha,
    };
  });
  // Un filtro con valor inválido se ignora.
  const buscado = typeof ticket === 'string' ? ticket.trim().toLowerCase() : '';
  const filtrados = items.filter(
    (i) =>
      (!valores('urgencia').includes(urgencia) || i.urgencia === urgencia) &&
      (!ESTADOS.includes(estado) || i.estado === estado) &&
      (alertas !== 'true' || i.alertas.length > 0) &&
      (!buscado || i.ticket.toLowerCase().includes(buscado)),
  );
  return { total: filtrados.length, items: filtrados.slice(0, MAXIMO) };
}

function detalle(id) {
  const consulta = almacen.obtenerConsulta(id);
  if (!consulta) throw new ErrorApi(404, 'NO_ENCONTRADA', 'No encontramos la consulta');
  const { sugerida, final, vigente, estado } = clasificacionesDe(id);
  const { modo, modelo, ...consultaPublica } = consulta;
  return {
    consulta: consultaPublica,
    clasificaciones: { sugerida: publica(sugerida), final: final && publica(final) },
    estado,
    escalamiento: calcular(vigente),
    modo,
    modelo,
    version_taxonomia: VERSION,
  };
}

module.exports = { listar, detalle };
