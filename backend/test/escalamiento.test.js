const test = require('node:test');
const assert = require('node:assert');
const { calcular } = require('../src/servicios/escalamiento');

const c = (a, b) => ({ posible_evento_adverso: a, uso_fuera_de_indicacion: b });

test('sin alertas', () => {
  assert.deepStrictEqual(calcular(c(false, false)), { requerido: false, motivos: [] });
});
test('una alerta', () => {
  assert.deepStrictEqual(calcular(c(false, true)), { requerido: true, motivos: ['uso_fuera_de_indicacion'] });
});
test('dos alertas, evento adverso primero', () => {
  assert.deepStrictEqual(calcular(c(true, true)), {
    requerido: true,
    motivos: ['posible_evento_adverso', 'uso_fuera_de_indicacion'],
  });
});
