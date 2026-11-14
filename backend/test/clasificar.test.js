const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const almacen = require('../src/almacen');

let servidor, base;
test.before(async () => {
  delete process.env.LLM_API_KEY; // modo simulado
  servidor = app.listen(0);
  base = `http://localhost:${servidor.address().port}`;
});
test.after(() => servidor.close());
test.beforeEach(() => {
  delete process.env.LLM_API_KEY;
  almacen.reiniciar();
});

const post = (cuerpo) =>
  fetch(`${base}/api/clasificar`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });

test('201 con una consulta válida (modo simulado)', async () => {
  const r = await post({ ticket: 'HD-1024', canal: 'correo', solicitante: 'medico', texto: 'Paciente con angioedema tras iniciar Cardiolex. ¿Hay reportes de casos?' });
  assert.strictEqual(r.status, 201);
  const j = await r.json();
  assert.strictEqual(j.consulta.ticket, 'HD-1024');
  assert.strictEqual(j.clasificacion.origen, 'modelo');
  assert.strictEqual(j.clasificacion.estado, 'sugerida');
  assert.strictEqual(j.clasificacion.urgencia, 'alta');
  assert.deepStrictEqual(j.escalamiento, { requerido: true, motivos: ['posible_evento_adverso'] });
  assert.strictEqual(j.modo, 'simulado');
  assert.strictEqual(j.version_taxonomia, '1.0');
  assert.strictEqual(typeof j.duracion_ms, 'number');
});

test('genera ticket HD-5001, HD-5002… si falta', async () => {
  const a = await (await post({ texto: 'hola' })).json();
  const b = await (await post({ texto: 'hola' })).json();
  assert.strictEqual(a.consulta.ticket, 'HD-5001');
  assert.strictEqual(b.consulta.ticket, 'HD-5002');
});

test('400 TEXTO_VACIO', async () => {
  const r = await post({ texto: '   ' });
  assert.strictEqual(r.status, 400);
  assert.deepStrictEqual(await r.json(), { error: { codigo: 'TEXTO_VACIO', mensaje: 'Escribe la consulta' } });
});

test('400 TEXTO_LARGO', async () => {
  const r = await post({ texto: 'a'.repeat(4001) });
  assert.strictEqual(r.status, 400);
  assert.strictEqual((await r.json()).error.codigo, 'TEXTO_LARGO');
});

test('400 TICKET_INVALIDO', async () => {
  const r = await post({ ticket: 'XX-12', texto: 'hola' });
  assert.strictEqual(r.status, 400);
  const e = (await r.json()).error;
  assert.strictEqual(e.codigo, 'TICKET_INVALIDO');
  assert.strictEqual(e.mensaje, 'El ticket debe tener el formato HD-1234');
});

// --- Errores del proveedor, con fetch simulado ---
const conProveedor = async (fetchFalso, fn) => {
  const original = global.fetch;
  process.env.LLM_API_KEY = 'clave-falsa-de-prueba';
  process.env.LLM_PROVIDER = 'openai';
  global.fetch = (url, ...resto) => (String(url).startsWith(base) ? original(url, ...resto) : fetchFalso(url, ...resto));
  try {
    await fn();
  } finally {
    global.fetch = original;
    delete process.env.LLM_API_KEY;
    delete process.env.LLM_PROVIDER;
  }
};
const respuestaOpenAI = (contenido) =>
  new Response(JSON.stringify({ model: 'modelo-falso', choices: [{ message: { content: contenido } }] }), { status: 200 });

test('502 SALIDA_INVALIDA si el modelo devuelve basura', async () => {
  await conProveedor(async () => respuestaOpenAI('no soy json'), async () => {
    const r = await post({ texto: 'hola' });
    assert.strictEqual(r.status, 502);
    assert.strictEqual((await r.json()).error.codigo, 'SALIDA_INVALIDA');
  });
});

test('502 PROVEEDOR_ERROR si el proveedor responde 401', async () => {
  await conProveedor(async () => new Response('{}', { status: 401 }), async () => {
    const r = await post({ texto: 'hola' });
    assert.strictEqual(r.status, 502);
    assert.strictEqual((await r.json()).error.codigo, 'PROVEEDOR_ERROR');
  });
});

test('504 TIEMPO_AGOTADO si el modelo tarda', async () => {
  const lento = async () => {
    throw new DOMException('timeout', 'TimeoutError');
  };
  await conProveedor(lento, async () => {
    const r = await post({ texto: 'hola' });
    assert.strictEqual(r.status, 504);
    assert.strictEqual((await r.json()).error.codigo, 'TIEMPO_AGOTADO');
  });
});

test('con proveedor: modo "modelo", valida y fuerza urgencia alta', async () => {
  const salida = JSON.stringify({
    urgencia: 'media', especialidad_terapeutica: 'otra', tipo_consulta: 'otro',
    posible_evento_adverso: true, uso_fuera_de_indicacion: false, justificacion: 'Prueba.',
  });
  await conProveedor(async () => respuestaOpenAI(salida), async () => {
    const j = await (await post({ texto: 'hola' })).json();
    assert.strictEqual(j.modo, 'modelo');
    assert.strictEqual(j.modelo, 'modelo-falso');
    assert.strictEqual(j.clasificacion.urgencia, 'alta');
  });
});

test('reintenta sin temperature si el modelo no la acepta', async () => {
  const cuerpos = [];
  const salida = JSON.stringify({
    urgencia: 'baja', especialidad_terapeutica: 'otra', tipo_consulta: 'otro',
    posible_evento_adverso: false, uso_fuera_de_indicacion: false, justificacion: 'Prueba.',
  });
  await conProveedor(async (url, op) => {
    cuerpos.push(JSON.parse(op.body));
    return cuerpos.length === 1
      ? new Response(JSON.stringify({ error: { message: "Unsupported value: 'temperature' does not support 0" } }), { status: 400 })
      : respuestaOpenAI(salida);
  }, async () => {
    const r = await post({ texto: 'hola' });
    assert.strictEqual(r.status, 201);
    assert.strictEqual(cuerpos[0].temperature, 0);
    assert.strictEqual('temperature' in cuerpos[1], false);
  });
});
