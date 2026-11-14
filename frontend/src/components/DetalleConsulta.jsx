import { useEffect, useState } from 'react';
import { obtenerConsulta } from '../api/cliente.js';
import AvisoEscalamiento from './AvisoEscalamiento.jsx';
import AccionesDecision from './AccionesDecision.jsx';
import { useEtiquetas } from '../etiquetas.js';

const FILAS = [
  ['urgencia', 'Urgencia'],
  ['especialidad_terapeutica', 'Especialidad'],
  ['tipo_consulta', 'Tipo'],
  ['posible_evento_adverso', 'Posible evento adverso'],
  ['uso_fuera_de_indicacion', 'Uso fuera de indicación'],
  ['justificacion', 'Justificación'],
];
const hora = (iso) => new Date(iso).toLocaleString('es');

function Columna({ titulo, k, corregidos = [] }) {
  const etiqueta = useEtiquetas();
  const ver = (campo, v) => (typeof v === 'boolean' ? (v ? 'Sí' : 'No') : campo === 'justificacion' ? v : etiqueta(campo, v));
  return (
    <div className="columna">
      <h3>{titulo}</h3>
      <dl>
        {FILAS.map(([campo, etiqueta]) => (
          <div key={campo} className={corregidos.includes(campo) ? 'cambiado' : ''}>
            <dt>{etiqueta}</dt>
            <dd>{ver(campo, k[campo])}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// onCambio: avisa al padre para que recargue la lista tras decidir desde el detalle.
export default function DetalleConsulta({ id, analista, onCambio, onCerrar }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState(null);

  const cargar = () => obtenerConsulta(id).then(setD).catch(setError);
  useEffect(() => {
    setD(null);
    setError(null);
    cargar();
  }, [id]);

  if (error) return <div className="error" role="alert">{error.mensaje}</div>;
  if (!d) return <p>Cargando…</p>;
  const { sugerida, final } = d.clasificaciones;

  return (
    <aside className="detalle" data-testid="detalle">
      <div className="fila">
        <h2>Ticket {d.consulta.ticket} <span className="etiqueta estado" data-testid="detalle-estado">{d.estado}</span></h2>
        <button className="secundario" onClick={onCerrar}>Cerrar</button>
      </div>
      <AvisoEscalamiento escalamiento={d.escalamiento} />
      <h3>Consulta</h3>
      <p className="texto-consulta">{d.consulta.texto}</p>
      <div className="lado-a-lado">
        <Columna titulo="Sugerida" k={sugerida} />
        {final && <Columna titulo="Final" k={final} corregidos={final.campos_corregidos} />}
      </div>
      {final && (
        <p>
          Decidió <strong>{final.analista}</strong> · {hora(final.fecha)}
          {final.motivo && <> · Motivo: {final.motivo}</>}
        </p>
      )}
      <p className="pie">{d.modo === 'simulado' ? 'Modo simulado' : `Modelo: ${d.modelo}`}</p>
      {d.estado === 'sugerida' && (
        <AccionesDecision
          clasificacion={sugerida}
          analista={analista}
          onDecidida={() => { cargar(); onCambio(); }}
        />
      )}
    </aside>
  );
}
