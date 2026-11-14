class ErrorApi extends Error {
  constructor(http, codigo, mensaje) {
    super(mensaje);
    this.http = http;
    this.codigo = codigo;
  }
}

module.exports = { ErrorApi };
