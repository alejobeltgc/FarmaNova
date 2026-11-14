const express = require('express');
const almacen = require('../almacen');
const { calcular } = require('../servicios/metricas');

const router = express.Router();

router.get('/', (req, res) => {
  const registros = almacen.listarConsultas().map((c) => {
    const todas = almacen.clasificacionesDe(c.id);
    return { sugerida: todas.find((k) => k.estado !== 'final'), final: todas.find((k) => k.estado === 'final') || null };
  });
  res.json(calcular(registros));
});

module.exports = router;
