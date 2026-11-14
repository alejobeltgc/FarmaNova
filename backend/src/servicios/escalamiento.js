const MOTIVOS = ['posible_evento_adverso', 'uso_fuera_de_indicacion'];

// Calcula el escalamiento a partir de las dos alertas de la clasificación vigente.
function calcular(clasificacion) {
  const motivos = MOTIVOS.filter((m) => clasificacion[m] === true);
  return { requerido: motivos.length > 0, motivos };
}

module.exports = { calcular };
