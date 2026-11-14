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

const enviar = (url, cuerpo) =>
  fetch(`${base}${url}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) });
// "Cuánto tiempo es estable…" → simulado: baja, respiratoria, estabilidad, sin alertas.
const sugerir = async (texto = '¿Cuánto tiempo es estable el inhalador Respiral una vez abierto?') =>
  (await (await enviar('/api/clasificar', { texto })).json()).clasificacion;
const decidir = (id, cuerpo) => enviar(`/api/clasificaciones/${id}/decision`, { analista: 'Ana Ruiz', ...cuerpo });
const codigo = async (r) => (await r.json()).error.codigo;

test('aceptar: la sugerida pasa a aceptada y se crea la final con los mismos valores', async () => {
  const k = await sugerir();
  const r = await decidir(k.id, { accion: 'aceptar' });
  assert.strictEqual(r.status, 200);
  const j = await r.json();
  assert.strictEqual(j.final.estado, 'final');
  assert.strictEqual(j.final.analista, 'Ana Ruiz');
  assert.ok(j.final.fecha);
  assert.strictEqual(j.final.especialidad_terapeutica, k.especialidad_terapeutica);
  assert.deepStrictEqual(j.campos_corregidos, []);
  assert.strictEqual(almacen.obtenerClasificacion(k.id).estado, 'aceptada');
});

test('corregir con cambio y motivo: final del analista, sugerida intacta salvo el estado', async () => {
  const k = await sugerir();
  const r = await decidir(k.id, {
    accion: 'corregir', cambios: { especialidad_terapeutica: 'cardiovascular' }, motivo: 'El producto es otro distinto',
  });
  assert.strictEqual(r.status, 200);
  const j = await r.json();
  assert.strictEqual(j.final.origen, 'analista');
  assert.strictEqual(j.final.especialidad_terapeutica, 'cardiovascular');
  assert.strictEqual(j.final.motivo, 'El producto es otro distinto');
  assert.deepStrictEqual(j.campos_corregidos, ['especialidad_terapeutica']);
  const sug = almacen.obtenerClasificacion(k.id);
  assert.strictEqual(sug.estado, 'corregida');
  assert.strictEqual(sug.especialidad_terapeutica, k.especialidad_terapeutica);
});

test('corregir sin cambios → 400 SIN_CAMBIOS (también si el valor es el mismo)', async () => {
  const k = await sugerir();
  let r = await decidir(k.id, { accion: 'corregir', cambios: {}, motivo: 'Motivo suficientemente largo' });
  assert.strictEqual(r.status, 400);
  assert.strictEqual(await codigo(r), 'SIN_CAMBIOS');
  r = await decidir(k.id, { accion: 'corregir', cambios: { urgencia: k.urgencia }, motivo: 'Motivo suficientemente largo' });
  assert.strictEqual(await codigo(r), 'SIN_CAMBIOS');
});

test('corregir sin motivo (o de menos de 10 caracteres) → 400 MOTIVO_REQUERIDO', async () => {
  const k = await sugerir();
  for (const motivo of [undefined, '', '   ', 'corto']) {
    const r = await decidir(k.id, { accion: 'corregir', cambios: { tipo_consulta: 'otro' }, motivo });
    assert.strictEqual(r.status, 400);
    assert.strictEqual(await codigo(r), 'MOTIVO_REQUERIDO');
  }
});

test('valor fuera de la taxonomía → 400 VALOR_INVALIDO con el campo', async () => {
  const k = await sugerir();
  const r = await decidir(k.id, { accion: 'corregir', cambios: { urgencia: 'urgente' }, motivo: 'Motivo suficientemente largo' });
  assert.strictEqual(r.status, 400);
  const e = (await r.json()).error;
  assert.strictEqual(e.codigo, 'VALOR_INVALIDO');
  assert.strictEqual(e.mensaje, 'Valor no permitido en urgencia');
  const r2 = await decidir(k.id, { accion: 'corregir', cambios: { justificacion: 'otra' }, motivo: 'Motivo suficientemente largo' });
  assert.strictEqual(await codigo(r2), 'VALOR_INVALIDO');
});

test('doble decisión → 409 YA_DECIDIDA', async () => {
  const k = await sugerir();
  assert.strictEqual((await decidir(k.id, { accion: 'aceptar' })).status, 200);
  const r = await decidir(k.id, { accion: 'aceptar' });
  assert.strictEqual(r.status, 409);
  assert.strictEqual((await r.json()).error.mensaje, 'Esta clasificación ya fue revisada');
});

test('alerta corregida a sí fuerza urgencia alta y recalcula el escalamiento', async () => {
  const k = await sugerir();
  assert.strictEqual(k.urgencia, 'baja');
  const j = await (await decidir(k.id, {
    accion: 'corregir', cambios: { posible_evento_adverso: true }, motivo: 'El texto describe un efecto',
  })).json();
  assert.strictEqual(j.final.urgencia, 'alta');
  assert.deepStrictEqual(j.campos_corregidos, ['urgencia', 'posible_evento_adverso']);
  assert.deepStrictEqual(j.escalamiento, { requerido: true, motivos: ['posible_evento_adverso'] });
});

test('alerta corregida de sí a no: el escalamiento desaparece', async () => {
  const k = await sugerir('Una paciente que toma Femivia reporta sangrado abundante y mareo.');
  assert.strictEqual(k.posible_evento_adverso, true);
  const j = await (await decidir(k.id, {
    accion: 'corregir', cambios: { posible_evento_adverso: false, urgencia: 'media' }, motivo: 'No es un evento adverso',
  })).json();
  assert.deepStrictEqual(j.escalamiento, { requerido: false, motivos: [] });
  assert.strictEqual(j.final.urgencia, 'media');
});

test('errores: 404, sin analista, acción inválida', async () => {
  let r = await decidir('k_999', { accion: 'aceptar' });
  assert.strictEqual(r.status, 404);
  assert.strictEqual((await r.json()).error.mensaje, 'No encontramos la clasificación');
  const k = await sugerir();
  r = await enviar(`/api/clasificaciones/${k.id}/decision`, { accion: 'aceptar' });
  assert.strictEqual(r.status, 400);
  assert.strictEqual(await codigo(r), 'ANALISTA_REQUERIDO');
  r = await decidir(k.id, { accion: 'borrar' });
  assert.strictEqual(await codigo(r), 'VALOR_INVALIDO');
});
