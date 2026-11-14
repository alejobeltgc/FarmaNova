const test = require('node:test');
const assert = require('node:assert');
const { validar } = require('../src/validar');
const taxonomia = require('../src/taxonomia');

const base = {
  urgencia: 'media',
  especialidad_terapeutica: 'cardiovascular',
  tipo_consulta: 'estabilidad',
  posible_evento_adverso: false,
  uso_fuera_de_indicacion: false,
  justificacion: 'Decisión logística en curso.',
};
const con = (cambios) => JSON.stringify({ ...base, ...cambios });

test('acepta un JSON válido', () => {
  const r = validar(JSON.stringify(base));
  assert.strictEqual(r.ok, true);
  assert.deepStrictEqual(r.datos, base);
});

test('acepta un objeto ya parseado', () => {
  assert.strictEqual(validar(base).ok, true);
});

test('rechaza texto que no es JSON', () => {
  assert.strictEqual(validar('hola').ok, false);
});

test('rechaza un campo faltante', () => {
  const { justificacion, ...sin } = base;
  assert.strictEqual(validar(JSON.stringify(sin)).ok, false);
});

test('rechaza un campo extra', () => {
  assert.strictEqual(validar(con({ ticket: 'HD-1' })).ok, false);
});

test('rechaza un valor fuera del catálogo', () => {
  for (const c of [{ urgencia: 'urgente' }, { especialidad_terapeutica: 'x' }, { tipo_consulta: 'y' }]) {
    assert.strictEqual(validar(con(c)).ok, false);
  }
});

test('rechaza una alerta no booleana', () => {
  assert.strictEqual(validar(con({ posible_evento_adverso: 'true' })).ok, false);
  assert.strictEqual(validar(con({ uso_fuera_de_indicacion: 1 })).ok, false);
});

test('alerta true con urgencia baja → alta', () => {
  const r = validar(con({ urgencia: 'baja', posible_evento_adverso: true }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.datos.urgencia, 'alta');
  const r2 = validar(con({ urgencia: 'media', uso_fuera_de_indicacion: true }));
  assert.strictEqual(r2.datos.urgencia, 'alta');
});

test('quita el bloque ```json', () => {
  const r = validar('```json\n' + JSON.stringify(base) + '\n```');
  assert.strictEqual(r.ok, true);
});

test('justificación vacía o de más de 200 caracteres', () => {
  assert.strictEqual(validar(con({ justificacion: '  ' })).ok, false);
  assert.strictEqual(validar(con({ justificacion: 'a'.repeat(201) })).ok, false);
  assert.strictEqual(validar(con({ justificacion: 'a'.repeat(200) })).ok, true);
});

test('taxonomía: versión y valores con etiqueta y descripción', () => {
  assert.strictEqual(taxonomia.VERSION, '1.0');
  assert.ok(taxonomia.REGLAS.length > 0);
  for (const campo of ['urgencia', 'especialidad_terapeutica', 'tipo_consulta']) {
    for (const v of taxonomia.CAMPOS[campo]) {
      assert.ok(v.valor && v.etiqueta && v.descripcion, `${campo}:${v.valor}`);
    }
  }
});
