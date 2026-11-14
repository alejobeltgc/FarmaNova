const express = require('express');
const clasificar = require('./rutas/clasificar');
const clasificaciones = require('./rutas/clasificaciones');
const historial = require('./rutas/historial');
const metricas = require('./rutas/metricas');
const taxonomia = require('./rutas/taxonomia');
const analistas = require('./rutas/analistas');

const app = express();
app.use(express.json());

app.get('/api/salud', (req, res) => res.json({ estado: 'ok' }));
app.use('/api/clasificar', clasificar);
app.use('/api/clasificaciones', clasificaciones);
app.use('/api', historial);
app.use('/api/metricas', metricas);
app.use('/api/taxonomia', taxonomia);
app.use('/api/analistas', analistas);

// Manejador de errores: respuesta uniforme { error: { codigo, mensaje } }.
app.use((err, req, res, _next) => {
  if (err.http) return res.status(err.http).json({ error: { codigo: err.codigo, mensaje: err.message } });
  if (err.type === 'entity.too.large') {
    return res.status(400).json({ error: { codigo: 'TEXTO_LARGO', mensaje: 'La consulta es demasiado larga' } });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { codigo: 'JSON_INVALIDO', mensaje: 'El cuerpo no es JSON válido' } });
  }
  console.error(`Error interno: ${err.name}`); // sin mensaje ni cuerpo: podrían traer el texto de la consulta
  res.status(500).json({ error: { codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor' } });
});

module.exports = app;
