import AccionesDecision from './AccionesDecision.jsx';
import { useEtiquetas } from '../etiquetas.js';

const siNo = (b) => (b ? 'Sí' : 'No');
const hora = (iso) => new Date(iso).toLocaleString('es');

// decision (opcional): { accion, final, campos_corregidos }. Si existe, la tarjeta muestra la clasificación final.
export default function TarjetaResultado({ resultado, decision, analista, onDecidida }) {
  const etiqueta = useEtiquetas();
  const { consulta, modo, modelo, version_taxonomia, duracion_ms } = resultado;
  const c = decision ? decision.final : resultado.clasificacion;
  const marca = (campo) => (decision?.campos_corregidos.includes(campo) ? 'cambiado' : '');

  return (
    <section className="tarjeta" data-testid="resultado">
      <h2>
        Ticket {consulta.ticket} <span className={`etiqueta urgencia-${c.urgencia}`}>Urgencia {c.urgencia}</span>
        {decision && (
          <span className="etiqueta estado" data-testid="estado-decision">
            {decision.accion === 'aceptar' ? 'Aceptada' : 'Corregida'}
          </span>
        )}
      </h2>
      <dl>
        <dt>Especialidad terapéutica</dt>
        <dd className={marca('especialidad_terapeutica')}>{etiqueta('especialidad_terapeutica', c.especialidad_terapeutica)}</dd>
        <dt>Tipo de consulta</dt>
        <dd className={marca('tipo_consulta')}>{etiqueta('tipo_consulta', c.tipo_consulta)}</dd>
        <dt>Posible evento adverso</dt>
        <dd className={marca('posible_evento_adverso')}>{siNo(c.posible_evento_adverso)}</dd>
        <dt>Uso fuera de indicación</dt>
        <dd className={marca('uso_fuera_de_indicacion')}>{siNo(c.uso_fuera_de_indicacion)}</dd>
        <dt>Justificación</dt>
        <dd>{c.justificacion}</dd>
        {decision && (
          <>
            <dt>Decidió</dt>
            <dd data-testid="quien-decidio">{c.analista} · {hora(c.fecha)}</dd>
            {c.motivo && (<><dt>Motivo</dt><dd>{c.motivo}</dd></>)}
          </>
        )}
      </dl>
      <p className="pie">
        Taxonomía {version_taxonomia} · {modo === 'simulado' ? 'Modo simulado' : `Modelo: ${modelo}`} · {duracion_ms} ms
      </p>
      {!decision && <AccionesDecision clasificacion={resultado.clasificacion} analista={analista} onDecidida={onDecidida} />}
    </section>
  );
}
