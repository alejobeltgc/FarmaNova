# Proyecto Hito 1 – Fase 4: implementación del clasificador FarmaNova

Curso de maestría (IA para Negocios Digitales). Las actividades 1 a 3 ya están hechas: todo está en `docs/`. Esta sesión **solo implementa** la Actividad 4 (el MVP de las 6 user stories) y deja la evidencia en el documento Word.

## Qué se construye
Un clasificador de consultas de información médica para FarmaNova (farmacéutica, soporte B2B). El analista pega una consulta y recibe, en JSON validado: urgencia, especialidad terapéutica, tipo de consulta, posible evento adverso, uso fuera de indicación y justificación. Luego la acepta o corrige, y consulta historial y métricas.

## Fuentes que mandan (no las cambies)
- `docs/user-stories.md` – ficha de cada historia: frontend, backend, contrato, reglas, criterios, errores y pruebas.
- `docs/tickets.md` – tickets de HU-01; CLF-01 es la primera tarea.
- `docs/taxonomia.md` – valores permitidos y reglas de urgencia.
- `docs/prompt-clasificador.md` – instrucciones que recibe el modelo.
- `docs/datos-prueba.json` – 10 consultas ficticias con su clasificación esperada.
- `docs/especificacion.md`, `docs/user-stories.md`, `docs/respuestas/` – contexto.

## Reglas
1. **No te extralimites.** Construye exactamente lo que dicen las fichas de HU-01 a HU-06. Nada más: sin TypeScript, base de datos, autenticación real, Docker, CI ni librerías de diseño o de agentes. Permitido: express, dotenv, react, react-dom, react-router-dom, vite y playwright (solo en herramientas/).
2. **JavaScript simple.** Backend: Node.js + Express (CommonJS). Frontend: React + Vite. Pruebas con `node:test`.
3. **Secretos.** La llave va solo en `backend/.env` (en `.gitignore`). Nunca en el código, en `frontend/`, en variables `VITE_`, en la bitácora, en commits ni en capturas. No abras ni muestres `backend/.env`. Si alguien pega una llave en el chat, no la copies y pide que la cambien.
4. **Pregunta antes de:** instalar programas fuera del proyecto, descargar navegadores, gastar llamadas pagas a la API, crear o publicar el repositorio. Las dependencias `npm install` dentro de `backend/`, `frontend/`, `herramientas/` y `entrega/` no necesitan permiso.
5. **Evidencia.** Cada paso queda en `docs/bitacora.md`: la instrucción que recibiste, archivos creados y commit. El enunciado evalúa el uso de GenAI para generar el código.
6. **Datos ficticios** solamente.
7. **Un commit por paso**, en español. No cambies la configuración de git; si falta nombre o correo, pregunta.
8. **Escribe corto.** Español, directo.
