// Cliente de la API. Todas las rutas son relativas: Vite las reenvía al backend (proxy /api).
async function pedir(url, opciones) {
  let res;
  try {
    res = await fetch(url, opciones);
  } catch {
    throw { codigo: 'SIN_CONEXION', mensaje: 'No se pudo conectar con el servidor' };
  }
  const datos = await res.json().catch(() => null);
  if (!res.ok) throw datos?.error || { codigo: 'ERROR', mensaje: 'Ocurrió un error inesperado' };
  return datos;
}

export const clasificar = (cuerpo) =>
  pedir('/api/clasificar', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });

export const obtenerTaxonomia = () => pedir('/api/taxonomia');
export const obtenerAnalistas = () => pedir('/api/analistas');

export const decidir = (idClasificacion, cuerpo) =>
  pedir(`/api/clasificaciones/${idClasificacion}/decision`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });

export function obtenerHistorial(filtros) {
  const q = new URLSearchParams();
  if (filtros.urgencia) q.set('urgencia', filtros.urgencia);
  if (filtros.estado) q.set('estado', filtros.estado);
  if (filtros.alertas) q.set('alertas', 'true');
  if (filtros.ticket.trim()) q.set('ticket', filtros.ticket.trim());
  return pedir(`/api/historial?${q}`);
}
export const obtenerConsulta = (id) => pedir(`/api/consultas/${id}`);

export const obtenerMetricas = () => pedir('/api/metricas');
