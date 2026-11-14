import { useEffect, useState } from 'react';
import { decidir, obtenerTaxonomia } from '../api/cliente.js';

const LISTAS = [
  ['urgencia', 'Urgencia'],
  ['especialidad_terapeutica', 'Especialidad terapéutica'],
  ['tipo_consulta', 'Tipo de consulta'],
];
const ALERTAS = [
  ['posible_evento_adverso', 'Posible evento adverso'],
  ['uso_fuera_de_indicacion', 'Uso fuera de indicación'],
];
const CAMPOS = [...LISTAS.map(([c]) => c), ...ALERTAS.map(([c]) => c)];

// Botones Aceptar / Corregir de una clasificación sugerida. Al decidir llama a onDecidida(respuesta, accion).
export default function AccionesDecision({ clasificacion, analista, onDecidida }) {
  const [corrigiendo, setCorrigiendo] = useState(false);
  const [taxonomia, setTaxonomia] = useState(null);
  const [valores, setValores] = useState({});
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (corrigiendo && !taxonomia) obtenerTaxonomia().then(setTaxonomia).catch(setError);
  }, [corrigiendo, taxonomia]);

  function empezar() {
    setValores(Object.fromEntries(CAMPOS.map((c) => [c, clasificacion[c]])));
    setMotivo('');
    setError(null);
    setCorrigiendo(true);
  }

  function poner(campo, valor) {
    const siguiente = { ...valores, [campo]: valor };
    // Con una alerta activa la urgencia es alta y no se puede bajar.
    if (ALERTAS.some(([a]) => siguiente[a])) siguiente.urgencia = 'alta';
    setValores(siguiente);
  }

  async function enviar(accion, extra = {}) {
    setEnviando(true);
    setError(null);
    try {
      onDecidida(await decidir(clasificacion.id, { accion, analista, ...extra }), accion);
    } catch (e) {
      setError(e);
    } finally {
      setEnviando(false);
    }
  }

  const guardar = () => {
    const cambios = Object.fromEntries(CAMPOS.filter((c) => valores[c] !== clasificacion[c]).map((c) => [c, valores[c]]));
    enviar('corregir', { cambios, motivo });
  };
  const cambiado = (c) => (valores[c] !== clasificacion[c] ? 'cambiado' : '');
  const alertaActiva = ALERTAS.some(([a]) => valores[a]);

  return (
    <div className="decision">
      {!corrigiendo && (
        <div className="fila">
          <button data-testid="aceptar" disabled={enviando} onClick={() => enviar('aceptar')}>Aceptar</button>
          <button data-testid="corregir" className="secundario" disabled={enviando} onClick={empezar}>Corregir</button>
        </div>
      )}
      {corrigiendo && (
        <form onSubmit={(e) => { e.preventDefault(); guardar(); }}>
          {!taxonomia ? <p>Cargando…</p> : (
            <>
              <div className="fila">
                {LISTAS.map(([campo, titulo]) => (
                  <label key={campo} className={cambiado(campo)}>
                    {titulo}
                    <select
                      data-testid={`campo-${campo}`}
                      value={valores[campo]}
                      disabled={campo === 'urgencia' && alertaActiva}
                      onChange={(e) => poner(campo, e.target.value)}
                    >
                      {taxonomia.campos[campo].map((v) => <option key={v.valor} value={v.valor}>{v.etiqueta}</option>)}
                    </select>
                  </label>
                ))}
              </div>
              <div className="fila">
                {ALERTAS.map(([campo, titulo]) => (
                  <label key={campo} className={`interruptor ${cambiado(campo)}`}>
                    <input
                      type="checkbox"
                      role="switch"
                      data-testid={`campo-${campo}`}
                      checked={valores[campo]}
                      onChange={(e) => poner(campo, e.target.checked)}
                    />
                    {titulo}
                  </label>
                ))}
              </div>
              <label>
                Motivo de la corrección
                <textarea data-testid="motivo" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              </label>
              <div className="fila">
                <button type="submit" data-testid="guardar-correccion" disabled={enviando}>Guardar corrección</button>
                <button type="button" data-testid="cancelar" className="secundario" disabled={enviando} onClick={() => setCorrigiendo(false)}>Cancelar</button>
              </div>
            </>
          )}
        </form>
      )}
      {error && <div className="error" role="alert" data-testid="error-decision">{error.mensaje}</div>}
    </div>
  );
}
