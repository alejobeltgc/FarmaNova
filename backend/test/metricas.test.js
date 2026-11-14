const test = require('node:test');
const assert = require('node:assert');
const { calcular } = require('../src/servicios/metricas');
const app = require('../src/app');
const almacen = require('../src/almacen');

const sug = (estado, extra = {}) => ({ estado, posible_evento_adverso: false, uso_fuera_de_indicacion: false, ...extra });

test('3 aceptadas y 1 corregida → 75 % y el campo corregido', () => {
  const m = calcular([
    { sugerida: sug('aceptada'), final: sug('final', { campos_corregidos: [] }) },
    { sugerida: sug('aceptada'), final: sug('final', { campos_corregidos: [] }) },
    { sugerida: sug('aceptada'), final: sug('final', { campos_corregidos: [] }) },
    { sugerida: sug('corregida'), final: sug('final', { campos_corregidos: ['tipo_consulta', 'urgencia'] }) },
    { sugerida: sug('sugerida'), final: null },
  ]);
  assert.strictEqual(m.total, 5);
  assert.strictEqual(m.decididas, 4);
  assert.strictEqual(m.aceptadas_sin_cambio, 3);
  assert.strictEqual(m.porcentaje_aceptadas, 75);
  assert.strictEqual(m.correcciones_por_campo.tipo_consulta, 1);
  assert.strictEqual(m.correcciones_por_campo.urgencia, 1);
  assert.strictEqual(m.correcciones_por_campo.especialidad_terapeutica, 0);
});

test('con_alerta cuenta la clasificación vigente (la final si existe)', () => {
  const m = calcular([
    { sugerida: sug('sugerida', { posible_evento_adverso: true }), final: null },
    { sugerida: sug('corregida', { uso_fuera_de_indicacion: true }), final: sug('final', { campos_corregidos: ['uso_fuera_de_indicacion'] }) },
    { sugerida: sug('aceptada', { posible_evento_adverso: true }), final: sug('final', { posible_evento_adverso: true, campos_corregidos: [] }) },
  ]);
  assert.strictEqual(m.con_alerta, 2);
});

test('sin datos: todo en cero, sin dividir por cero', () => {
  const m = calcular([]);
  assert.strictEqual(m.total, 0);
  assert.strictEqual(m.porcentaje_aceptadas, 0);
  assert.strictEqual(m.con_alerta, 0);
});

test('GET /api/metricas lee el almacén', async () => {
  delete process.env.LLM_API_KEY;
  almacen.reiniciar();
  const s = app.listen(0);
  const base = `http://localhost:${s.address().port}`;
  try {
    const post = (u, c) => fetch(base + u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(c) });
    const k = (await (await post('/api/clasificar', { texto: 'Una paciente reporta sangrado y mareo con Femivia.' })).json()).clasificacion;
    await post(`/api/clasificaciones/${k.id}/decision`, { accion: 'aceptar', analista: 'Ana Ruiz' });
    const m = await (await fetch(`${base}/api/metricas`)).json();
    assert.deepStrictEqual(
      [m.total, m.decididas, m.aceptadas_sin_cambio, m.porcentaje_aceptadas, m.con_alerta],
      [1, 1, 1, 100, 1],
    );
  } finally {
    s.close();
  }
});
