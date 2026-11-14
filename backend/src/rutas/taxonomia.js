const express = require('express');
const { VERSION, CAMPOS, REGLAS } = require('../taxonomia');

const router = express.Router();

router.get('/', (req, res) => res.json({ version: VERSION, campos: CAMPOS, reglas: REGLAS }));

module.exports = router;
