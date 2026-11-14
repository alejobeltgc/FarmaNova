const LIMITE = 4000;

export default function FormularioConsulta({ valores, cambiar, enviar, limpiar, cargando }) {
  const campo = (nombre) => ({ value: valores[nombre], onChange: (e) => cambiar({ ...valores, [nombre]: e.target.value }) });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        enviar();
      }}
    >
      <div className="fila">
        <label>
          Ticket (opcional)
          <input placeholder="HD-1234" {...campo('ticket')} />
        </label>
        <label>
          Canal
          <select {...campo('canal')}>
            <option value="web">Web</option>
            <option value="correo">Correo</option>
            <option value="telefono">Teléfono</option>
          </select>
        </label>
        <label>
          Tipo de solicitante
          <select {...campo('solicitante')}>
            <option value="medico">Médico</option>
            <option value="farmaceutico">Farmacéutico</option>
            <option value="distribuidor">Distribuidor</option>
            <option value="otro">Otro</option>
          </select>
        </label>
      </div>
      <label>
        Consulta
        <textarea data-testid="consulta" rows={8} placeholder="Pega aquí el texto de la consulta" {...campo('texto')} />
      </label>
      <div className="contador">{valores.texto.length}/{LIMITE}</div>
      <div className="fila">
        <button type="submit" data-testid="clasificar" disabled={cargando}>
          {cargando ? 'Clasificando…' : 'Clasificar'}
        </button>
        <button type="button" className="secundario" onClick={limpiar} disabled={cargando}>
          Limpiar
        </button>
      </div>
    </form>
  );
}
