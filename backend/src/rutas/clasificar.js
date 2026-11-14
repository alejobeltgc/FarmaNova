const express = require('express');
const { clasificar } = require('../servicios/clasificador');
const { ErrorApi } = require('../errores');

const router = express.Router();
const CANALES = ['web', 'correo', 'telefono'];
const SOLICITANTES = ['medico', 'farmaceutico', 'distribuidor', 'otro'];
const LIMITE_TEXTO = 4000;

router.post('/', async (req, res, next) => {
  const inicio = Date.now();
  const { ticket, canal, solicitante, texto } = req.body || {};
  let resultado;
  try {
    if (typeof texto !== 'string' || texto.trim() === '') throw new ErrorApi(400, 'TEXTO_VACIO', 'Escribe la consulta');
    if (texto.length > LIMITE_TEXTO) throw new ErrorApi(400, 'TEXTO_LARGO', 'La consulta es demasiado larga');
    const ticketLimpio = typeof ticket === 'string' ? ticket.trim() : '';
    if (ticketLimpio && !/^HD-\d+$/.test(ticketLimpio)) {
      throw new ErrorApi(400, 'TICKET_INVALIDO', 'El ticket debe tener el formato HD-1234');
    }
    resultado = await clasificar({
      ticket: ticketLimpio,
      canal: CANALES.includes(canal) ? canal : null,
      solicitante: SOLICITANTES.includes(solicitante) ? solicitante : null,
      texto: texto.trim(),
    });
  } catch (e) {
    // Solo ticket, modo, duración y código: nunca el texto ni la llave.
    console.log(`clasificar ticket=${/^HD-\d+$/.test(ticket) ? ticket : '-'} codigo=${e.codigo || 'ERROR_INTERNO'} ms=${Date.now() - inicio}`);
    return next(e);
  }
  console.log(`clasificar ticket=${resultado.consulta.ticket} modo=${resultado.modo} ms=${resultado.duracion_ms} codigo=201`);
  res.status(201).json(resultado);
});

module.exports = router;
