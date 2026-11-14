const express = require('express');

const router = express.Router();
// Nombres ficticios. El inicio de sesión es simulado: sin contraseña (fuera del alcance de la PoC).
const ANALISTAS = ['Ana Ruiz', 'Carlos Mena', 'Lucía Torres'];

router.get('/', (req, res) => res.json({ analistas: ANALISTAS }));

module.exports = router;
