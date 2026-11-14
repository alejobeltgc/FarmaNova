const fs = require('node:fs');
const path = require('node:path');
const { validar } = require('../validar');
const { VERSION } = require('../taxonomia');
const { ErrorApi } = require('../errores');
const almacen = require('../almacen');
const { calcular } = require('./escalamiento');
const simulado = require('../proveedores/simulado');
const openai = require('../proveedores/openai');
const anthropic = require('../proveedores/anthropic');

const TIEMPO_MAX_MS = 15000;
const PROMPT = fs.readFileSync(path.join(__dirname, '../../prompts/clasificador.md'), 'utf8');
const PROVEEDORES = { openai, anthropic };

// Lee el entorno en cada llamada (así las pruebas pueden cambiarlo).
function elegirProveedor() {
  const clave = process.env.LLM_API_KEY;
  if (!clave) return { modo: 'simulado', proveedor: simulado, opciones: {} };
  const nombre = (process.env.LLM_PROVIDER || 'openai').toLowerCase();
  const proveedor = PROVEEDORES[nombre];
  if (!proveedor) throw new ErrorApi(502, 'PROVEEDOR_ERROR', 'No se pudo clasificar, intenta de nuevo');
  return { modo: 'modelo', proveedor, opciones: { clave, modelo: process.env.LLM_MODEL || proveedor.MODELO_POR_DEFECTO } };
}

async function clasificar({ ticket, canal, solicitante, texto }) {
  const inicio = Date.now();
  const { modo, proveedor, opciones } = elegirProveedor();

  let crudo;
  try {
    crudo = await proveedor.completar(PROMPT, texto, { ...opciones, signal: AbortSignal.timeout(TIEMPO_MAX_MS) });
  } catch (e) {
    if (e.name === 'TimeoutError' || e.name === 'AbortError') {
      throw new ErrorApi(504, 'TIEMPO_AGOTADO', 'El modelo tardó demasiado, intenta de nuevo');
    }
    console.error(`Proveedor: ${e.message}`);
    throw new ErrorApi(502, 'PROVEEDOR_ERROR', 'No se pudo clasificar, intenta de nuevo');
  }

  const v = validar(crudo.texto);
  if (!v.ok) throw new ErrorApi(502, 'SALIDA_INVALIDA', 'No se pudo clasificar, intenta de nuevo');

  const consulta = almacen.guardarConsulta({
    ticket: ticket || almacen.siguienteTicket(),
    canal,
    solicitante,
    texto,
    modo,
    modelo: crudo.modelo,
  });
  const clasificacion = almacen.guardarClasificacion({
    consulta_id: consulta.id,
    origen: 'modelo',
    estado: 'sugerida',
    ...v.datos,
  });
  const { consulta_id, ...clasificacionPublica } = clasificacion;
  const { modo: _m, modelo: _mo, ...consultaPublica } = consulta;

  return {
    consulta: consultaPublica,
    clasificacion: clasificacionPublica,
    escalamiento: calcular(clasificacion),
    modo,
    modelo: crudo.modelo,
    version_taxonomia: VERSION,
    duracion_ms: Date.now() - inicio,
  };
}

module.exports = { clasificar };
