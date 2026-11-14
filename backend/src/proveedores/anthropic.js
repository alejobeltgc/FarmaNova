// Messages API: https://platform.claude.com/docs/en/api/overview
const URL = 'https://api.anthropic.com/v1/messages';
const VERSION_API = '2026-10-21';

async function completar(sistema, texto, { clave, modelo, signal }) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': clave, 'anthropic-version': VERSION_API },
    body: JSON.stringify({
      model: modelo,
      max_tokens: 500,
      temperature: 0,
      system: sistema,
      messages: [{ role: 'user', content: `Consulta:\n${texto}` }],
    }),
    signal,
  });
  if (!res.ok) throw new Error(`Anthropic respondió ${res.status}`);
  const datos = await res.json();
  return { texto: datos.content?.find((b) => b.type === 'text')?.text ?? '', modelo: datos.model || modelo };
}

module.exports = { completar, MODELO_POR_DEFECTO: 'claude-haiku-5-5' };
