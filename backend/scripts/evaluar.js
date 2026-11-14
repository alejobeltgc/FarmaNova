// Envía las consultas de docs/datos-prueba.json a POST /api/clasificar y compara con lo esperado.
// Uso: con el backend encendido, `npm run evaluar`. Escribe docs/evidencia-prueba.md y actualiza entrega/evidencia.json.
const fs = require('node:fs');
const path = require('node:path');

const API = process.env.API_URL || 'http://localhost:3001';
const RAIZ = path.join(__dirname, '../..');
const CASOS = require(path.join(RAIZ, 'docs/datos-prueba.json'));
const CAMPOS = ['urgencia', 'especialidad_terapeutica', 'tipo_consulta'];
const ALERTAS = ['posible_evento_adverso', 'uso_fuera_de_indicacion'];
const METAS = { campo: 9, alertas_en_casos_con_alerta: 4, validas: 10 };

async function clasificar(caso) {
  const res = await fetch(`${API}/api/clasificar`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ticket: caso.ticket, canal: 'correo', solicitante: 'medico', texto: caso.consulta }),
  });
  const cuerpo = await res.json();
  return res.ok ? { ok: true, ...cuerpo } : { ok: false, error: cuerpo.error?.codigo || `HTTP ${res.status}` };
}

const marca = (b) => (b ? '✓' : '✗');

async function main() {
  const filas = [];
  let modo = null;
  let modelo = null;
  for (const caso of CASOS) {
    let r;
    try {
      r = await clasificar(caso);
    } catch {
      console.error(`No se pudo conectar con ${API}. ¿Está encendido el backend (npm start)?`);
      process.exit(1);
    }
    if (r.ok && !modo) ({ modo, modelo } = r);
    const e = caso.esperado;
    const o = r.ok ? r.clasificacion : null;
    filas.push({
      caso, r, o,
      campos: Object.fromEntries(CAMPOS.map((c) => [c, !!o && o[c] === e[c]])),
      alertas: !!o && ALERTAS.every((a) => o[a] === e[a]),
    });
    console.log(`${caso.ticket} ${r.ok ? 'ok' : r.error}`);
  }

  const total = CASOS.length;
  const cuenta = (f) => filas.filter(f).length;
  const aciertos = {
    ...Object.fromEntries(CAMPOS.map((c) => [c, cuenta((f) => f.campos[c])])),
    alertas: cuenta((f) => f.alertas),
  };
  const validas = cuenta((f) => f.r.ok);
  const conAlerta = filas.filter((f) => ALERTAS.some((a) => f.caso.esperado[a]));
  const alertasBien = conAlerta.filter((f) => f.alertas).length;
  const fecha = new Date().toISOString().slice(0, 10);

  const metas = [
    ...CAMPOS.map((c) => [c, aciertos[c], total, METAS.campo]),
    ['alertas (en los casos con alerta)', alertasBien, conAlerta.length, METAS.alertas_en_casos_con_alerta],
    ['salidas válidas', validas, total, METAS.validas],
  ];

  const md = [
    '# Evidencia de la prueba de exactitud',
    '',
    `- Fecha: ${fecha}`,
    `- Modo: ${modo === 'simulado' ? 'simulado (reglas por palabras clave; sin llamadas al modelo)' : `modelo (${modelo})`}`,
    `- Consultas: ${total} (docs/datos-prueba.json) · Taxonomía 1.0`,
    ...(modo === 'simulado'
      ? ['', '> Atención: el modo simulado no es un modelo de lenguaje y sus reglas se escribieron viendo estas mismas consultas. Estas cifras no miden la exactitud del clasificador real.']
      : []),
    '',
    '## Resultado por consulta',
    '',
    '| # | Ticket | Urgencia | Especialidad | Tipo | Alertas | Obtenido (urgencia · especialidad · tipo · evento adverso · fuera de indicación) |',
    '|---|---|---|---|---|---|---|',
    ...filas.map(({ caso, r, o, campos, alertas }) =>
      `| ${caso.id} | ${caso.ticket} | ${marca(campos.urgencia)} | ${marca(campos.especialidad_terapeutica)} | ${marca(campos.tipo_consulta)} | ${marca(alertas)} | ` +
      (o ? `${o.urgencia} · ${o.especialidad_terapeutica} · ${o.tipo_consulta} · ${o.posible_evento_adverso} · ${o.uso_fuera_de_indicacion}` : `Error: ${r.error}`) + ' |'),
    '',
    '## Resumen frente a las metas',
    '',
    '| Medida | Aciertos | Porcentaje | Meta | ¿Cumple? |',
    '|---|---|---|---|---|',
    ...metas.map(([n, a, t, meta]) => `| ${n} | ${a} de ${t} | ${Math.round((100 * a) / t)} % | ${meta} de ${t} | ${a >= meta ? 'Sí' : 'No'} |`),
    '',
    `Acierto en alertas = coinciden las dos alertas: ${aciertos.alertas} de ${total} consultas en total.`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(RAIZ, 'docs/evidencia-prueba.md'), md);

  const rutaEv = path.join(RAIZ, 'entrega/evidencia.json');
  const ev = JSON.parse(fs.readFileSync(rutaEv, 'utf8'));
  Object.assign(ev, { modo, modelo: modelo || '', fecha, total, aciertos, salidas_validas: validas });
  fs.writeFileSync(rutaEv, JSON.stringify(ev, null, 2) + '\n');

  console.log('\nResumen:');
  for (const [n, a, t, meta] of metas) console.log(`  ${n}: ${a}/${t} (meta ${meta}) ${a >= meta ? 'OK' : 'NO CUMPLE'}`);
  console.log('Escrito docs/evidencia-prueba.md y entrega/evidencia.json');
}

main();
