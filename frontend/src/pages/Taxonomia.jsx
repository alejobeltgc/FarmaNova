import { useEffect, useState } from 'react';
import { obtenerTaxonomia } from '../api/cliente.js';

const TITULOS = {
  urgencia: 'Urgencia',
  especialidad_terapeutica: 'Especialidad terapéutica',
  tipo_consulta: 'Tipo de consulta',
};

export default function Taxonomia() {
  const [tax, setTax] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    obtenerTaxonomia().then(setTax).catch(setError);
  }, []);

  if (error) return <div className="error" role="alert">{error.mensaje}</div>;
  if (!tax) return <p>Cargando…</p>;

  return (
    <>
      <h1>Taxonomía {tax.version}</h1>
      {Object.entries(tax.campos).map(([campo, valores]) => (
        <section key={campo}>
          <h2>{TITULOS[campo] || campo}</h2>
          <table>
            <thead>
              <tr><th>Valor</th><th>Etiqueta</th><th>Descripción</th></tr>
            </thead>
            <tbody>
              {valores.map((v) => (
                <tr key={v.valor}><td><code>{v.valor}</code></td><td>{v.etiqueta}</td><td>{v.descripcion}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      <h2>Reglas</h2>
      <ul>{tax.reglas.map((r) => <li key={r}>{r}</li>)}</ul>
    </>
  );
}
