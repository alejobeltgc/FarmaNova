const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const almacen = require('../src/almacen');

let servidor, base;
test.before(() => {
  delete process.env.LLM_API_KEY;
  servidor = app.listen(0);
  base = `http://localhost:${servidor.address().port}`;
});
test.after(() => servidor.close());
test.beforeEach(() => {
  delete process.env.LLM_API_KEY;
  almacen.reiniciar();
});

const post = (url, cuerpo) =>
  fetch(`${base}${url}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) });
const clasificar = async (texto, ticket) => (await (await post('/api/clasificar', { texto, ticket })).json());
const historial = async (query = '') => (await fetch(`${base}/api/historial${query}`)).json();

const SIN_ALERTA = '¿Cuánto tiempo es estable el inhalador Respiral una vez abierto?';
const EVENTO = 'Una paciente que toma Femivia reporta sangrado abundante y mareo desde ayer.';
const FUERA = 'Un reumatólogo quiere prescribir Inmunar, pero solo está aprobado para artritis reumatoide.';

async function tresConsultas() {
  const a = await clasificar(SIN_ALERTA, 'HD-7001');
  const b = await clasificar(EVENTO, 'HD-7002');
  const c = await clasificar(FUERA, 'HD-7003');
  return { a, b, c };
}

test('vacío: total 0 y sin items', async () => {
  assert.deepStrictEqual(await historial(), { total: 0, items: [] });
});

test('orden: la más reciente primero, con los campos del contrato', async () => {
  await tresConsultas();
  const h = await historial();
  assert.strictEqual(h.total, 3);
  assert.deepStrictEqual(h.items.map((i) => i.ticket), ['HD-7003', 'HD-7002', 'HD-7001']);
  const i = h.items[1];
  assert.deepStrictEqual(Object.keys(i).sort(), [
    'alertas', 'consulta_id', 'especialidad_terapeutica', 'estado', 'extracto', 'fecha', 'modo', 'ticket', 'tipo_consulta', 'urgencia',
  ]);
  assert.deepStrictEqual(i.alertas, ['posible_evento_adverso']);
  assert.strictEqual(i.estado, 'sugerida');
  assert.ok(i.extracto.length <= 63); // 60 + «...»
});

test('filtros: urgencia, estado, alertas y ticket', async () => {
  const { a, b } = await tresConsultas();
  await post(`/api/clasificaciones/${a.clasificacion.id}/decision`, { accion: 'aceptar', analista: 'Ana Ruiz' });
  assert.strictEqual((await historial('?urgencia=alta')).total, 2);
  assert.strictEqual((await historial('?urgencia=baja')).items[0].ticket, 'HD-7001');
  assert.strictEqual((await historial('?estado=aceptada')).total, 1);
  assert.strictEqual((await historial('?estado=sugerida')).total, 2);
  assert.strictEqual((await historial('?alertas=true')).total, 2);
  assert.strictEqual((await historial('?ticket=7002')).items[0].consulta_id, b.consulta.id);
  assert.strictEqual((await historial('?ticket=hd-7002')).total, 1);
});

test('filtro inválido se ignora', async () => {
  await tresConsultas();
  assert.strictEqual((await historial('?urgencia=rarisima&estado=otra&alertas=quizas')).total, 3);
});

test('el estado y los valores son los de la clasificación final si existe', async () => {
  const { a } = await tresConsultas();
  await post(`/api/clasificaciones/${a.clasificacion.id}/decision`, {
    accion: 'corregir', analista: 'Ana Ruiz', cambios: { posible_evento_adverso: true }, motivo: 'Describe un efecto adverso',
  });
  const item = (await historial('?ticket=HD-7001')).items[0];
  assert.strictEqual(item.estado, 'corregida');
  assert.strictEqual(item.urgencia, 'alta');
  assert.deepStrictEqual(item.alertas, ['posible_evento_adverso']);
  assert.strictEqual((await historial('?urgencia=baja')).total, 0);
});

test('detalle de una consulta corregida: sugerida y final', async () => {
  const { a } = await tresConsultas();
  await post(`/api/clasificaciones/${a.clasificacion.id}/decision`, {
    accion: 'corregir', analista: 'Ana Ruiz', cambios: { tipo_consulta: 'otro' }, motivo: 'Es una pregunta de manejo',
  });
  const j = await (await fetch(`${base}/api/consultas/${a.consulta.id}`)).json();
  assert.strictEqual(j.consulta.texto, SIN_ALERTA);
  assert.strictEqual(j.estado, 'corregida');
  assert.strictEqual(j.clasificaciones.sugerida.tipo_consulta, 'estabilidad');
  assert.strictEqual(j.clasificaciones.sugerida.estado, 'corregida');
  assert.strictEqual(j.clasificaciones.final.tipo_consulta, 'otro');
  assert.deepStrictEqual(j.clasificaciones.final.campos_corregidos, ['tipo_consulta']);
  assert.deepStrictEqual(j.escalamiento, { requerido: false, motivos: [] });
});

test('detalle de una consulta sugerida: final null', async () => {
  const { b } = await tresConsultas();
  const j = await (await fetch(`${base}/api/consultas/${b.consulta.id}`)).json();
  assert.strictEqual(j.estado, 'sugerida');
  assert.strictEqual(j.clasificaciones.final, null);
  assert.strictEqual(j.escalamiento.requerido, true);
});

test('detalle inexistente → 404', async () => {
  const r = await fetch(`${base}/api/consultas/c_999`);
  assert.strictEqual(r.status, 404);
  assert.deepStrictEqual(await r.json(), { error: { codigo: 'NO_ENCONTRADA', mensaje: 'No encontramos la consulta' } });
});
