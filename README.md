# FarmaNova – Clasificador de consultas (MVP)

Aplicación web para analistas de Información Médica: pegan una consulta y reciben, en JSON validado, urgencia, especialidad terapéutica, tipo de consulta, posible evento adverso, uso fuera de indicación y una justificación. Luego la aceptan o corrigen y consultan historial y métricas. Proyecto de curso; **solo datos ficticios**.

- **Backend:** Node.js + Express (CommonJS). **Frontend:** React + Vite (JavaScript). El historial vive en memoria (se borra al reiniciar el backend).

## Requisitos
Node.js ≥ 22.12 (Vite 8 pide `^20.19` o `>=22.12`) y npm.

## Instalación
```bash
cd backend && npm install
cd ../frontend && npm install
```

## Configurar la llave del modelo (opcional)
```bash
cp backend/.env.example backend/.env
```
Edita `backend/.env` y completa `LLM_API_KEY=` (`LLM_PROVIDER=openai` o `anthropic`; `LLM_MODEL` es opcional). La llave **solo** va en `backend/.env`, que git ignora; nunca la pegues en el chat, en el código ni en el frontend.

**Modo simulado:** sin llave, el backend clasifica con reglas por palabras clave y la pantalla dice «Modo simulado». Sirve para probar la aplicación, pero no mide un modelo real.

## Ejecutar
En dos terminales:
```bash
cd backend && npm start     # http://localhost:3001
cd frontend && npm run dev  # http://localhost:5173
```
Abre http://localhost:5173, elige un analista en el encabezado y clasifica.

## Pruebas
```bash
cd backend && npm test      # node:test
```

## Evaluación de exactitud
Con el backend encendido:
```bash
cd backend && npm run evaluar
```
Envía 10 consultas de prueba a `POST /api/clasificar`, compara con la clasificación esperada y escribe un informe de aciertos. Con llave real hace 10 llamadas a la API.

> **Nota:** el script lee `docs/datos-prueba.json` y escribe en `docs/` y `entrega/`, carpetas del curso que **no están en este repositorio**. Sin ellas `npm run evaluar` no funciona.
