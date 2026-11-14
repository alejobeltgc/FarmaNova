import { useEffect, useState } from 'react';
import { obtenerAnalistas } from '../api/cliente.js';

export default function SelectorAnalista({ analista, cambiar }) {
  const [nombres, setNombres] = useState([]);

  useEffect(() => {
    obtenerAnalistas().then((r) => setNombres(r.analistas)).catch(() => setNombres([]));
  }, []);

  return (
    <label className="selector">
      Analista
      <select data-testid="analista" value={analista} onChange={(e) => cambiar(e.target.value)}>
        <option value="">Selecciona…</option>
        {nombres.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </label>
  );
}
