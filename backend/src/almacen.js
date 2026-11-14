// Almacén en memoria (Map). Funciones simples para poder cambiarlo luego por una base de datos.
const consultas = new Map();
const clasificaciones = new Map();
let contConsulta, contClasificacion, contTicket;

function reiniciar() {
  consultas.clear();
  clasificaciones.clear();
  contConsulta = 0;
  contClasificacion = 0;
  contTicket = 5000;
}
reiniciar();

const siguienteTicket = () => `HD-${++contTicket}`;

function guardarConsulta(datos) {
  const consulta = { id: `c_${++contConsulta}`, ...datos, fecha: new Date().toISOString() };
  consultas.set(consulta.id, consulta);
  return consulta;
}

function guardarClasificacion(datos) {
  const clasificacion = { id: `k_${++contClasificacion}`, ...datos };
  clasificaciones.set(clasificacion.id, clasificacion);
  return clasificacion;
}

const obtenerClasificacion = (id) => clasificaciones.get(id);

// La clasificación sugerida nunca cambia de valores: solo de estado.
function cambiarEstado(id, estado) {
  const k = clasificaciones.get(id);
  k.estado = estado;
  return k;
}

const obtenerConsulta = (id) => consultas.get(id);
const listarConsultas = () => [...consultas.values()]; // orden de creación
const clasificacionesDe = (consultaId) => [...clasificaciones.values()].filter((k) => k.consulta_id === consultaId);

module.exports = { obtenerConsulta, listarConsultas, clasificacionesDe, reiniciar, siguienteTicket, guardarConsulta, guardarClasificacion, obtenerClasificacion, cambiarEstado };
