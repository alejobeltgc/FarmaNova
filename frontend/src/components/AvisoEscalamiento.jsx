const AVISOS = {
  posible_evento_adverso: { clase: 'aviso-rojo', texto: 'Posible evento adverso – escalar a Farmacovigilancia según el procedimiento interno' },
  uso_fuera_de_indicacion: { clase: 'aviso-ambar', texto: 'Uso fuera de indicación – la respuesta requiere validación médica y regulatoria' },
};

// Sin botón de cierre: los avisos no se pueden descartar. Orden: el rojo primero (el backend ya lo entrega así).
export default function AvisoEscalamiento({ escalamiento }) {
  if (!escalamiento?.requerido) return null;
  return (
    <div data-testid="aviso-escalamiento">
      {escalamiento.motivos.map((m) => (
        <div key={m} role="alert" className={`aviso-escalamiento ${AVISOS[m].clase}`} data-testid={`aviso-${m}`}>
          {AVISOS[m].texto}
        </div>
      ))}
    </div>
  );
}
