# AGENTS.md - Diario de estudio

## Qué es este repo

Web estática ("Diario de Estudio") para registrar sesiones de estudio y motivarse viendo la racha de días seguidos. 
Proyecto didáctico: el código debe poder entenderlo alguien que empieza a programar.

## Stack y estructura
- HTML, CSS y JavaScript puros: sin frameworks, librerías, npm, bundler ni build.
- `index.html` (estructura), `styles.css` (estilos), `app.js` (lógica y datos).
- Debe funcionar abriendo `index.html` con doble clic (`file://`): nada de módulos ES modules (`type="module"`), `fetch` a archivos locales ni nada que requiera servidor.

## Convenciones
- Textos de la interfaz en español.
- Código simple, nombres descriptivos y comentarios solo donde aporten.
- Diseño limpio y responsive; cualquier pantalla nueva debe verse bien en el móvil.

## Datos
- En `localStorage`, clave `diario-estudio-sesiones`: array de `{ id, fecha: "AAAA-MM-DD", tema, minutos }` (así lo guarda `app.js`).
- La lista se pinta de más reciente a más antigua (mismo día: la última registrada, primero).
- Si cambias la forma de los datos, mantén compatibilidad con lo ya guardado o el usuario perderá sus sesiones.

## Fechas y racha (fácil equivocarse)
- Antes de tocar nada con fechas, lee `.agents/skills/local-dates/SKILL.md`: sus reglas y su checklist son obligatorias en este proyecto.
- Trabaja siempre con la fecha **local** (`getFullYear/getMonth/getDate`) del usuario, nunca UTC. Nunca uses `toISOString()` ni `new Date("AAAA-MM-DD")`: se interpretan en UTC y desplazan el día.
- Racha = días consecutivos con al menos 1 sesión que terminan hoy. Si hoy no hay sesión pero ayer sí, la racha sigue viva y se cuenta desde ayer hasta que termine el día.
- Mejor racha = tramo más largo de días consecutivos con ≥1 sesión, **ignorando las fechas futuras**. Se deriva de las sesiones guardadas (sin clave propia en localStorage). Invariante: la mejor nunca puede ser menor que la actual.
- Truco: un texto `AAAA-MM-DD` ordenado o comparado como texto ya sigue el orden cronológico (sirve para ordenar días y descartar fechas futuras sin tocar `Date`).
- Varias sesiones el mismo día cuentan como un solo día. Las fechas futuras no suman.
- El formulario usa validación nativa (`required`, `min="1"`, `step="1"`, minutos enteros) y al enviar se resetea dejando la fecha de hoy otra vez.

## Estadísticas
- La semana va de **lunes 00:00 a domingo** en fecha local; el lunes se calcula con `(getDay() + 6) % 7` (`getDay()` devuelve 0 el domingo, hay que envolver) y sumando días con `restarDias()`.
- Minutos totales de la semana y gráfico se derivan de las sesiones guardadas (sin clave propia en localStorage). Solo suman `minutos` numéricos > 0 y fechas del rango lunes…hoy; las futuras y los datos corruptos se ignoran.
- El gráfico son 7 barras en HTML/CSS/JS puro (sin canvas, SVG ni librerías); la altura es relativa al día con más minutos de la semana (semana vacía → todas a 0). El día de hoy se resalta y los futuros van atenuados.
- Días estudiados del mes = **mes calendario** (día 1 → hoy): días únicos con ≥1 sesión comparando textos. Cualquier sesión cuenta aunque sus minutos sean inválidos (misma regla que la racha); las fechas futuras del propio mes quedan fuera. Derivado, sin clave propia.

## Forma de trabajar
- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.

## Memoria
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).

## Comandos
- Tests: `node --test`

## Reglas
- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código.

## Límites
- ✅ Siempre: respetar las reglas de fechas y racha, mantener los textos en español.
- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea.
- ⚠ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- 🚫 Nunca: añadir dependencias, frameworks o un paso de build.
  
## Verificación
- Tests de la lógica: `node --test` (están en verde; prohibido avanzar con pruebas en rojo).
- Además, tras cada cambio verifica con el MCP de Chrome DevTools: abre `index.html`, prueba la funcionalidad, revisa la consola y comprueba la
vista móvil.
- Para empezar de cero: DevTools → Application → Local Storage → borrar la clave `diario-estudio-sesiones`.
