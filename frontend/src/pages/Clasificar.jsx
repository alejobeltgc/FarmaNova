import { useState } from 'react';
import FormularioConsulta from '../components/FormularioConsulta.jsx';
import AvisoEscalamiento from '../components/AvisoEscalamiento.jsx';
import TarjetaResultado from '../components/TarjetaResultado.jsx';
import { clasificar } from '../api/cliente.js';

const VACIO = { ticket: '', canal: 'web', solicitante: 'medico', texto: '' };

export default function Clasificar({ analista }) {
  const [valores, setValores] = useState(VACIO);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [decision, setDecision] = useState(null);
  const [cargando, setCargando] = useState(false);

  async function enviar() {
    setCargando(true);
    setError(null);
    setResultado(null);
    setDecision(null);
    try {
      setResultado(await clasificar(valores));
    } catch (e) {
      setError(e); // el texto escrito no se borra
    } finally {
      setCargando(false);
    }
  }

  function limpiar() {
    setValores(VACIO);
    setResultado(null);
    setDecision(null);
    setError(null);
  }

  return (
    <>
      <h1>Clasificar una consulta</h1>
      <FormularioConsulta valores={valores} cambiar={setValores} enviar={enviar} limpiar={limpiar} cargando={cargando} />
      {error && (
        <div className="error" role="alert" data-testid="error">
          {error.mensaje} <small>({error.codigo})</small>
        </div>
      )}
      {resultado && (
        <>
          <AvisoEscalamiento escalamiento={decision ? decision.escalamiento : resultado.escalamiento} />
          <TarjetaResultado
            resultado={resultado}
            decision={decision}
            analista={analista}
            onDecidida={(r, accion) => setDecision({ ...r, accion })}
          />
        </>
      )}
    </>
  );
}
