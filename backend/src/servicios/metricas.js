const CORREGIBLES = ['urgencia', 'especialidad_terapeutica', 'tipo_consulta', 'posible_evento_adverso', 'uso_fuera_de_indicacion'];

// registros: [{ sugerida, final }] (final es null mientras la consulta no se decide).
function calcular(registros) {
  const decididas = registros.filter((r) => r.final);
  const aceptadas = decididas.filter((r) => r.sugerida.estado === 'aceptada').length;
  const correcciones = Object.fromEntries(CORREGIBLES.map((c) => [c, 0]));
  for (const r of decididas) for (const c of r.final.campos_corregidos) correcciones[c]++;
  const conAlerta = registros.filter((r) => {
    const v = r.final || r.sugerida;
    return v.posible_evento_adverso || v.uso_fuera_de_indicacion;
  }).length;
  return {
    total: registros.length,
    decididas: decididas.length,
    aceptadas_sin_cambio: aceptadas,
    porcentaje_aceptadas: decididas.length ? Math.round((100 * aceptadas) / decididas.length) : 0,
    correcciones_por_campo: correcciones,
    con_alerta: conAlerta,
  };
}

module.exports = { calcular };
