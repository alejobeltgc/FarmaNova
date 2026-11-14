import { useEffect, useState } from 'react';
import { obtenerTaxonomia } from './api/cliente.js';

let pedida; // una sola petición a /api/taxonomia para toda la app
const formato = (v) => {
  const s = String(v).replaceAll('_', ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// Devuelve etiqueta(campo, valor): la de la taxonomía o, mientras carga o si falla, el valor formateado.
export function useEtiquetas() {
  const [tax, setTax] = useState(null);
  useEffect(() => {
    pedida ??= obtenerTaxonomia();
    pedida.then(setTax).catch(() => { pedida = undefined; }); // sin taxonomía se muestran los valores formateados
  }, []);
  return (campo, valor) => tax?.campos[campo]?.find((v) => v.valor === valor)?.etiqueta ?? formato(valor);
}
