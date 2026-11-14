const NOMBRES = {
  urgencia: 'urgencia',
  especialidad_terapeutica: 'especialidad',
  tipo_consulta: 'tipo de consulta',
  posible_evento_adverso: 'evento adverso',
  uso_fuera_de_indicacion: 'uso fuera de indicación',
};

function masCorregido(porCampo) {
  const [campo, n] = Object.entries(porCampo).sort((a, b) => b[1] - a[1])[0];
  const nombre = NOMBRES[campo];
  return n > 0 ? `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} (${n})` : 'Ninguno';
}

export default function FranjaMetricas({ metricas: m }) {
  if (!m) return null;
  return (
    <div className="metricas" data-testid="metricas">
      <div><strong data-testid="m-total">{m.total}</strong><span>Consultas</span></div>
      <div><strong data-testid="m-aceptadas">{m.porcentaje_aceptadas} %</strong><span>Aceptadas sin cambio</span></div>
      <div><strong data-testid="m-campo">{masCorregido(m.correcciones_por_campo)}</strong><span>Campo más corregido</span></div>
      <div><strong data-testid="m-alertas">{m.con_alerta}</strong><span>Con alerta</span></div>
    </div>
  );
}
