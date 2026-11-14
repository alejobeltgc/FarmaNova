require('dotenv').config();
const app = require('./app');

const PUERTO = process.env.PORT || 3001;
app.listen(PUERTO, () => console.log(`Backend en http://localhost:${PUERTO}`));
