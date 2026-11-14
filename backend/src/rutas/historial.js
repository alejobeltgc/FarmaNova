const express = require('express');
const { listar, detalle } = require('../servicios/historial');

const router = express.Router();

router.get('/historial', (req, res) => res.json(listar(req.query)));
router.get('/consultas/:id', (req, res) => res.json(detalle(req.params.id)));

module.exports = router;
