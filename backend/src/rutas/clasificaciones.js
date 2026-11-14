const express = require('express');
const { decidir } = require('../servicios/decision');

const router = express.Router();

router.post('/:id/decision', (req, res) => {
  res.json(decidir(req.params.id, req.body || {}));
});

module.exports = router;
