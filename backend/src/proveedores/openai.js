// Chat Completions: https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create
const URL = 'https://api.openai.com/v1/chat/completions';

// Solo estado y código del error: el mensaje de OpenAI puede incluir parte de la llave.
const falla = async (estado, detalle) =>
  new Error(`OpenAI respondió ${estado} (${detalle?.error?.code || detalle?.error?.type || 'sin código'})`);

async function completar(sistema, texto, { clave, modelo, signal }) {
  const cuerpo = {
    model: modelo,
    messages: [
      { role: 'system', content: sistema },
      { role: 'user', content: `Consulta:\n${texto}` },
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
  };
  const llamar = (c) =>
    fetch(URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${clave}` },
      body: JSON.stringify(c),
      signal,
    });

  let res = await llamar(cuerpo);
  if (res.status === 400) {
    // Algunos modelos (razonamiento) no aceptan temperature=0: se reintenta una vez sin ella.
    const detalle = await res.json().catch(() => ({}));
    if (/temperature/i.test(detalle?.error?.message || '')) {
      delete cuerpo.temperature;
      res = await llamar(cuerpo);
    } else {
      throw await falla(res.status, detalle);
    }
  }
  if (!res.ok) throw await falla(res.status, await res.json().catch(() => ({})));
  const datos = await res.json();
  return { texto: datos.choices?.[0]?.message?.content ?? '', modelo: datos.model || modelo };
}

module.exports = { completar, MODELO_POR_DEFECTO: 'gpt-5.6-luna' };
