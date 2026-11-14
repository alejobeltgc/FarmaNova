import { useEffect, useState } from 'react';
import { obtenerHistorial, obtenerMetricas } from '../api/cliente.js';
import { useEtiquetas } from '../etiquetas.js';
import FranjaMetricas from '../components/FranjaMetricas.jsx';
import DetalleConsulta from '../components/DetalleConsulta.jsx';

const SIN_FILTROS = { urgencia: '', estado: '', alertas: false, ticket: '' };
const hora = (iso) => new Date(iso).toLocaleString('es');

export default function Historial({ analista }) {
  const etiqueta = useEtiquetas();
  const [filtros, setFiltros] = useState(SIN_FILTROS);
  const [lista, setLista] = useState(null);
  const [metricas, setMetricas] = useState(null);
  const [error, setError] = useState(null);
  const [abierta, setAbierta] = useState(null);

  const cargar = () => {
    obtenerHistorial(filtros).then(setLista).catch(setError);
    obtenerMetricas().then(setMetricas).catch(setError);
  };
  useEffect(() => { cargar(); }, [filtros]);

  const poner = (campo) => (e) => setFiltros({ ...filtros, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const hayFiltros = JSON.stringify(filtros) !== JSON.stringify(SIN_FILTROS);

  return (
    <>
      <h1>Historial</h1>
      <FranjaMetricas metricas={metricas} />
      <p className="aviso">El historial se borra al reiniciar el servidor (prueba de concepto)</p>
      <div className="fila filtros">
        <label>Urgencia
          <select data-testid="filtro-urgencia" value={filtros.urgencia} onChange={poner('urgencia')}>
            <option value="">Todas</option><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option>
          </select>
        </label>
        <label>Estado
          <select data-testid="filtro-estado" value={filtros.estado} onChange={poner('estado')}>
            <option value="">Todos</option><option value="sugerida">Sugerida</option><option value="aceptada">Aceptada</option><option value="corregida">Corregida</option>
          </select>
        </label>
        <label>Ticket
          <input data-testid="filtro-ticket" placeholder="HD-5001" value={filtros.ticket} onChange={poner('ticket')} />
        </label>
        <label className="interruptor">
          <input data-testid="filtro-alertas" type="checkbox" checked={filtros.alertas} onChange={poner('alertas')} /> Solo con alertas
        </label>
      </div>
      {error && <div className="error" role="alert">{error.mensaje}</div>}
      {lista && lista.items.length === 0 && (
        <p data-testid="vacio">{hayFiltros ? 'Ninguna consulta coincide con los filtros' : 'Aún no hay consultas clasificadas'}</p>
      )}
      {lista && lista.items.length > 0 && (
        <table data-testid="tabla-historial">
          <thead>
            <tr><th>Fecha</th><th>Ticket</th><th>Extracto</th><th>Urgencia</th><th>Especialidad</th><th>Tipo</th><th>Alertas</th><th>Estado</th><th>Modo</th></tr>
          </thead>
          <tbody>
            {lista.items.map((i) => (
              <tr key={i.consulta_id} className="clicable" data-testid="fila" tabIndex={0}
                  onClick={() => setAbierta(i.consulta_id)} onKeyDown={(e) => e.key === 'Enter' && setAbierta(i.consulta_id)}>
                <td>{hora(i.fecha)}</td>
                <td>{i.ticket}</td>
                <td>{i.extracto}</td>
                <td><span className={`etiqueta urgencia-${i.urgencia}`}>{i.urgencia}</span></td>
                <td>{etiqueta('especialidad_terapeutica', i.especialidad_terapeutica)}</td>
                <td>{etiqueta('tipo_consulta', i.tipo_consulta)}</td>
                <td>
                  {i.alertas.includes('posible_evento_adverso') && <span title="Posible evento adverso" aria-label="Posible evento adverso">🔴</span>}
                  {i.alertas.includes('uso_fuera_de_indicacion') && <span title="Uso fuera de indicación" aria-label="Uso fuera de indicación">🟠</span>}
                </td>
                <td>{i.estado}</td>
                <td>{i.modo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {abierta && (
        <DetalleConsulta id={abierta} analista={analista} onCambio={cargar} onCerrar={() => setAbierta(null)} />
      )}
    </>
  );
}
