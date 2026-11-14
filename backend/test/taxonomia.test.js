const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const { validar } = require('../src/validar');

let servidor, base;
test.before(() => {
  servidor = app.listen(0);
  base = `http://localhost:${servidor.address().port}`;
});
test.after(() => servidor.close());

test('GET /api/taxonomia devuelve los mismos valores que usa validar.js', async () => {
  const j = await (await fetch(`${base}/api/taxonomia`)).json();
  assert.strictEqual(j.version, '1.0');
  assert.ok(j.reglas.length > 0);
  const salida = (campo, valor) => ({
    urgencia: 'baja', especialidad_terapeutica: 'otra', tipo_consulta: 'otro',
    posible_evento_adverso: false, uso_fuera_de_indicacion: false, justificacion: 'x',
    [campo]: valor,
  });
  for (const campo of ['urgencia', 'especialidad_terapeutica', 'tipo_consulta']) {
    assert.ok(j.campos[campo].length > 0);
    for (const v of j.campos[campo]) {
      assert.ok(v.etiqueta && v.descripcion);
      assert.strictEqual(validar(salida(campo, v.valor)).ok, true, `${campo}=${v.valor}`);
    }
    assert.strictEqual(validar(salida(campo, 'no_existe')).ok, false);
  }
});

test('GET /api/analistas devuelve 3 analistas fijos', async () => {
  const j = await (await fetch(`${base}/api/analistas`)).json();
  assert.strictEqual(j.analistas.length, 3);
  assert.ok(j.analistas.includes('Ana Ruiz'));
});
