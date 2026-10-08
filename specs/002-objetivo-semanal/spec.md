# Especificación — Objetivo semanal de estudio

**ID**: `002-objetivo-semanal`
**Estado**: **v1.2 — dudas de la fase de preguntas resueltas y QA de fase 2 aplicado (18 hallazgos; decisiones D-7, D-8 y D-9); pendiente de aprobación del usuario**
**Rige sobre**: `docs/constitution.md` (principios innegociables)

---

## Contexto y objetivo

El Diario de Estudio ya muestra el hábito pasado y presente: racha actual, mejor racha, minutos de la semana con su gráfico, días estudiados del mes, mapa de calor de las últimas 26 semanas y lista de sesiones. Lo que falta es un **objetivo**: saber cuánto queremos estudiar esta semana y **ver cuánto llevamos** para motivarnos a completarlo.

La petición del usuario, en sus palabras: «Quiero añadir un objetivo semanal de estudio: poder fijar cuántos minutos quiero estudiar cada semana y ver cuánto llevo, para motivarme a cumplirlo».

Esto implica dos cosas:

1. **Fijar** un objetivo en minutos por semana (guardarlo para verlo al volver).
2. **Ver el progreso**: la suma de minutos de la semana en curso frente a ese objetivo.

### Decisiones de la fase de preguntas

Las 6 dudas del borrador fueron respondidas por el usuario:

| Duda | Respuesta elegida |
|---|---|
| Persistencia | **Clave nueva aparte** en localStorage, `diario-estudio-objetivo-semanal`; la clave `diario-estudio-sesiones` y su formato no se tocan |
| Ubicación | El objetivo y el progreso se muestran **dentro de la tarjeta «Esta semana»**, junto a los minutos y el gráfico |
| Alcance | **Un único objetivo fijo** que se aplica cada semana hasta que el usuario lo cambie (sin histórico por semana) |
| Edición | **Editable en cualquier momento**; al cambiarlo, el progreso se mide contra el nuevo valor **desde ese instante**, sin memoria del valor anterior |
| Porcentaje | **No se muestra** porcentaje en texto: solo la barra con el formato «X de Y min» |
| Superar el objetivo | Barra al 100 % con las cifras exactas («320 de 300 min») **y** el mensaje **«¡Objetivo cumplido!»** |

### Decisiones del QA de fase 2 (correcciones del @reviewer)

| Decisión | Respuesta elegida |
|---|---|
| **D-7** — Confirmación del objetivo | **Formulario con botón**, igual que «Nueva sesión»: campo `type="number"` con validación nativa (`required`, `min="1"`, `step="1"` — enteros ≥ 1) y botón **«Guardar objetivo»**; **Enter también envía**. La validación nativa bloquea el envío vacío, con 0, negativos o decimales: **no existe borrar el objetivo por interfaz**, solo cambiarlo |
| **D-8** — Mensaje de cumplimiento | «¡Objetivo cumplido!» aparece **al alcanzar o superar**: «300 de 300 min» ya lo muestra |
| **D-9** — Accesibilidad | Lo añadido se **mantiene**: texto equivalente de la barra para lector de pantalla y contraste de texto 4,5:1 |

### Decisiones del redactor (coherentes con lo ya existente)

| Aspecto | Decisión |
|---|---|
| Unidad | Minutos por semana (enteros ≥ 1, con la misma validación nativa que el formulario «Nueva sesión»: `required`, `min="1"`, `step="1"`, según D-7) |
| Semana | **La misma que ya calcula la app**: lunes 00:00 a domingo, en fecha local; los días futuros no cuentan |
| Progreso | Minutos válidos de la semana en curso (mismas reglas que la tarjeta «Esta semana») frente al objetivo |
| Estado inicial | **Sin objetivo guardado → estado vacío que invita a fijarlo** (no hay valor por defecto) |
| Actualización | Al pintar (`pintarTodo()`), como el resto: **sin temporizadores** |
| «Sin objetivo» en la lógica | **`null`**: contrato único de todas las funciones puras (RNF-4) |
| Dónde vive la lógica | `calor.js` (funciones puras, sin archivos nuevos) + pruebas en `tests/calor.test.js`; `app.js` solo integra |
| Formato numérico | es-ES (`toLocaleString("es-ES")`) en los textos de interfaz; el campo `type="number"` va sin separador de miles (RNF-8) |

---

## Usuarios

1. **Persona estudiante** (usuario único): quiere motivarse cumpliendo un objetivo semanal; consulta la app sobre todo desde el móvil, con pantalla pequeña.
2. **Persona que usa lector de pantalla**: debe poder saber su progreso sin ver la barra (RF-4, D-9).

---

## Historias de usuario

- **HU-1**: Como estudiante, quiero fijar cuántos minutos quiero estudiar cada semana, para tener una meta clara.
- **HU-2**: Como estudiante, quiero ver cuántos minutos llevo esta semana frente a mi objetivo, para motivarme a completarlo.
- **HU-3**: Como estudiante, quiero ver el avance de un vistazo (cifras y barra), para no tener que calcularlo yo.
- **HU-4**: Como estudiante, quiero que el progreso se actualice **automáticamente y sin temporizadores, en los mismos momentos en que se repinta la app** (al abrir, al registrar una sesión y al guardar el objetivo), para verlo siempre al día.
- **HU-5**: Como estudiante, quiero poder cambiar mi objetivo en cualquier momento, para adaptarlo a cada semana.
- **HU-6**: Como persona que usa lector de pantalla, quiero que el progreso se exprese también como texto, para saberlo sin ver la barra.

---

## Requisitos funcionales

### RF-1 — Estado inicial: fijar el objetivo semanal

Criterios de aceptación:

- **(Cuando)** Cuando **hay un objetivo fijado**, entonces el objetivo y su progreso aparecen **dentro de la tarjeta «Esta semana»** (decisión de ubicación), junto a los minutos estudiados y el gráfico; cuando no hay objetivo, en esa misma zona se ve el estado vacío del criterio siguiente.
- **(Dado / Cuando)** Dado que la aplicación no tiene ningún objetivo guardado, cuando se abre, entonces la zona del objetivo dentro de la tarjeta «Esta semana» muestra un **estado vacío que invite a fijarlo**, junto al formulario con su campo y su botón. **Lo exigible** es un texto en español que invite a fijar el objetivo semanal; el texto concreto «Todavía no has fijado tu objetivo semanal» es ilustrativo. Todavía no se muestra progreso ni barra.
- **(Cuando)** Cuando se usa el formulario del objetivo, entonces es el mismo patrón que «Nueva sesión» (D-7): campo `type="number"` con validación nativa `required`, `min="1"` y `step="1"` y botón **«Guardar objetivo»**; **Enter también envía**. Se acepta solo un número **entero mayor o igual que 1**; un valor vacío, 0, negativo o no entero (incluido un decimal tecleado) **bloquea el envío de forma nativa**, no se guarda y el navegador pide corregirlo.
- **(Dado / Cuando)** Dado que escribo 300, cuando pulso «Guardar objetivo» (o presiono Enter), entonces el objetivo pasa a ser 300 minutos por semana, el estado vacío desaparece y aparece el progreso (RF-3/RF-4).
- **(Cuando)** Cuando ya hay un objetivo, entonces el campo muestra el valor actual **como número entero sin separador de miles** (p. ej. `100000`, no «100.000»: `type="number"` no admite separadores; el formato es-ES con punto se reserva para los textos de interfaz, RNF-8), listo para cambiarlo (RF-5).

### RF-2 — Persistencia del objetivo

Criterios de aceptación:

- **(Cuando)** Cuando fijo un objetivo, entonces se guarda en una **clave nueva aparte** de localStorage, `diario-estudio-objetivo-semanal` (decisión de persistencia aprobada por el usuario, conforme a la regla de AGENTS.md «⚠ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados»).
- **(Cuando)** Cuando fijo un objetivo, entonces se conserva al recargar la página o al volver a abrir la app más tarde.
- **(Dado / Cuando)** Dado que hay un objetivo guardado, cuando se abre la aplicación, entonces se muestra sin volver a pedirlo.
- **(Si — comportamiento no deseado)** Si el valor guardado está corrupto —no numérico, 0, negativo, texto o **decimal metido a mano** (p. ej. `300.5` vía DevTools o a mano en localStorage; la nativa lo bloquea en el campo)—, entonces la app lo trata como **«sin objetivo»** (`null`, estado vacío del RF-1) y no se produce ningún error en consola.
- **(Dado / Cuando)** Dado que existe la clave `diario-estudio-sesiones`, cuando se guarda o se cambia el objetivo, entonces esa clave y el formato de las sesiones **no cambian** y ninguna sesión se pierde o modifica (constitución, principio 5).

### RF-3 — Progreso de la semana en curso

Criterios de aceptación:

- **(Cuando)** Cuando hay objetivo, entonces se muestra el progreso: los minutos estudiados **de la semana en curso** frente al objetivo, con el formato «X de Y min» (p. ej. «90 de 300 min»), en formato es-ES.
- **(Cuando)** Cuando se calcula la semana, entonces es **la misma semana que ya calcula la app**: de lunes 00:00 a domingo en fecha local (mismo lunes que la tarjeta «Esta semana»); solo suman las sesiones de lunes a hoy: los días futuros no cuentan.
- **(Cuando)** Cuando se suman los minutos, entonces se aplican las mismas reglas que la tarjeta «Esta semana»: solo minutos numéricos mayores que 0 (`minutosValidos`); una sesión corrupta no suma.
- **(Cuando)** Cuando se calculan esos minutos, entonces **la tarjeta «Esta semana» y el progreso usan la misma función pura** (`minutosDeSemana` de `calor.js`, RNF-4): una única copia compartida, sin colisión con el nombre de la función actual de `app.js` y sin que los textos de la tarjeta cambien (RF-7).
- **(Cuando)** Cuando los minutos de la semana tienen **decimales (dato heredado)**, entonces el texto del progreso los muestra **con coma es-ES**, p. ej. «90,5 de 300 min»; ninguna sesión se descarta por tener decimales.
- **(Dado / Cuando)** Dado que el objetivo es 300 minutos y esta semana hay sesiones de 60 (lunes) y 30 (martes), cuando se pinta, entonces el progreso es «90 de 300 min».
- **(Dado / Cuando)** Dado que hoy es jueves 8 de octubre de 2026, cuando se calcula la semana, entonces abarca del lunes 5 al domingo 11 de octubre de 2026 (solo lunes a jueves suman).
- **(Cuando)** Cuando el progreso se repinta (al abrir, al registrar una sesión o al guardar el objetivo), entonces se actualiza en ese mismo repintado de `pintarTodo()`; **no hay actualización automática por temporizador** (HU-4).

### RF-4 — Representación del avance (barra + texto)

Criterios de aceptación:

- **(Cuando)** Cuando hay objetivo, entonces junto al texto «X de Y min» se muestra una **barra de progreso**; su ancho es un **entero entre 0 y 100** obtenido con `Math.round(minutos × 100 / objetivo)` y limitado a ese intervalo (contrato determinista de `porcentajeDeProgreso`, RNF-4: 90/300 → 30; 100/300 → 33). La barra está hecha con HTML/CSS puro (sin canvas, SVG ni librerías).
- **(Cuando)** Cuando se muestra el progreso, entonces **no hay ningún texto de porcentaje**: la interfaz es solo la barra y el formato «X de Y min» (decisión de porcentaje).
- **(Dado / Cuando)** Dado que el objetivo es 300 y llevo 90 minutos, cuando se pinta, entonces la barra marca el 30 % de ancho y el texto dice «90 de 300 min».
- **(Si — comportamiento no deseado)** Si llevo 0 minutos, entonces la barra está vacía (0 %) y el texto dice «0 de 300 min»; no hay división por cero (objetivo `null` o inválido → sin barra, RF-1).
- **(Cuando)** Cuando el progreso **alcanza o supera** el objetivo (D-8), entonces la barra se queda llena al 100 %, el texto muestra **las cifras exactas** y aparece el mensaje **«¡Objetivo cumplido!»**: p. ej. «300 de 300 min» (cumplido al llegar) y «320 de 300 min» (superado). El progreso puede superar el 100 % sin romper la interfaz.
- **(Cuando)** Cuando el progreso todavía no llega al objetivo, entonces **no** se muestra el mensaje «¡Objetivo cumplido!».
- **(Dado / Cuando)** Dado un objetivo de 90 minutos y 90,5 minutos estudiados (dato heredado), cuando se comprueba, entonces se considera cumplido: `objetivoCumplido(90.5, 90)` → `true` y el texto es «90,5 de 90 min» con «¡Objetivo cumplido!».
- **(Cuando)** Cuando el progreso se muestra, entonces **el texto aporta siempre los minutos exactos**: la barra no es la única vía de información (accesibilidad / HU-6, D-9).

### RF-5 — Edición del objetivo

Criterios de aceptación:

- **(Cuando)** Cuando hay un objetivo fijado, entonces la interfaz permite **verlo y modificarlo en cualquier momento** con el mismo formulario con botón que RF-1 (campo + «Guardar objetivo», Enter también envía, validación nativa `required`, `min="1"`, `step="1"`), tal como define **D-7**.
- **(Si — comportamiento no deseado)** Si el usuario intenta **vaciar el campo** o poner 0, negativo o no entero, entonces la validación nativa bloquea el envío y el objetivo conserva su valor: **no existe «borrar objetivo» por interfaz**, solo cambiarlo.
- **(Cuando)** Cuando el usuario cambia el valor y lo confirma (botón o Enter), entonces el progreso se vuelve a calcular frente al nuevo valor **desde ese mismo repintado**, sin conservar nada del valor anterior.
- **(Cuando)** Cuando cambia de semana, entonces **el mismo objetivo sigue vigente** (un único objetivo fijo, sin histórico por semana) hasta que el usuario lo cambie; el progreso empieza de cero con los minutos de la semana nueva (decisión de alcance).
- **(Dado / Cuando)** Dado que llevo 90 de 300 minutos, cuando cambio el objetivo a 200 y lo guardo, entonces el progreso pasa a mostrarse como «90 de 200 min» al instante, con su barra y, si corresponde, el mensaje de cumplimiento (RF-4).
- **(Cuando)** Cuando la aplicación se repinta (al abrir, al registrar una sesión o al guardar el objetivo), entonces **el repintado no toca el campo** del objetivo: lo tecleado y no guardado se conserva hasta que el usuario envíe o recargue la página; el campo se rellena con el valor guardado **solo al abrir** y **tras guardar**. Así un tecleo sin confirmar nunca se pierde ni se confunde con el objetivo guardado.

### RF-6 — Semana vacía, cambio de semana y repintado

Criterios de aceptación:

- **(Dado / Cuando)** Dado un objetivo con la semana sin ninguna sesión, cuando se pinta, entonces el progreso es «0 de Y min» y la barra está vacía.
- **(Cuando)** Cuando la aplicación permanece abierta al cambiar de semana, entonces el progreso (y la semana) se recalculan en el siguiente repintado (abrir, registrar una sesión o guardar el objetivo); **sin temporizadores**, igual que el resto de la app.
- **(Si — comportamiento no deseado)** Si una sesión guardada tiene fecha futura (dato heredado), entonces sus minutos **no suman** al progreso, igual que no suman en la tarjeta «Esta semana».

### RF-7 — No interferencia con lo existente

Criterios de aceptación:

- **(Cuando)** Cuando se pinta el objetivo y el progreso, entonces racha actual, mejor racha, minutos de la semana, gráfico de 7 barras, «Este mes», mapa de calor y lista de sesiones se calculan **exactamente igual que antes** y sus textos no cambian.
- **(Cuando)** Cuando se añade el objetivo dentro de la tarjeta «Esta semana», entonces sus **cálculos y textos existentes** (total de minutos y gráfico) **no se modifican**: el objetivo es contenido nuevo añadido, no un cambio de la tarjeta (ver «Fuera de alcance»).
- **(Cuando)** Cuando no hay objetivo, entonces el resto de la aplicación funciona con normalidad: solo se ve el estado vacío del RF-1.

---

## Requisitos no funcionales

- **RNF-1 — Idioma**: toda la interfaz del objetivo (rótulo, estado vacío, campo, botón «Guardar objetivo», progreso, barra y mensaje «¡Objetivo cumplido!») está en español.
- **RNF-2 — Fechas en hora local**: determinar la semana del progreso se hace siempre en la zona horaria local del usuario; nunca en UTC. Se reutilizan las funciones de fechas existentes (`restarDias`, texto `AAAA-MM-DD`, `(getDay() + 6) % 7`); prohibido `toISOString()` ni `new Date("AAAA-MM-DD")`. Debe funcionar el día del cambio de hora (último domingo de marzo y de octubre).
- **RNF-3 — Simplicidad**: sin dependencias nuevas ni pasos de build; la app sigue funcionando abriéndola con doble clic (`file://`); la barra es HTML/CSS puro.
- **RNF-4 — Lógica pura testeable con contrato definido**: el progreso se calcula con funciones **puras** en `calor.js`, sin DOM ni localStorage (constitución, principio 3), exportadas con `module.exports` y probadas con `node --test` en `tests/calor.test.js`. **Sin archivos nuevos**. Contratos (todas **sin lanzar excepciones** con entradas corruptas; «sin objetivo» = `null`):
  - `minutosDeSemana(sesiones, hoy)` → número ≥ 0: suma de los minutos válidos de lunes a `hoy` (la semana de la app; días futuros fuera). **Nombre sin colisión** con la `minutosDeLaSemana()` actual de `app.js`: es la función pura nueva y, además, la tarjeta «Esta semana» pasa a reutilizarla (una única copia; sus textos no cambian, RF-7).
  - `objetivoValido(valor)` → entero ≥ 1 o `null`: `null` para vacío, texto, 0, negativos, decimales (p. ej. `300.5`), `null`/`undefined` u objetos.
  - `porcentajeDeProgreso(minutos, objetivo)` → **entero** 0–100 (`Math.round`); `minutos` no numérico o `objetivo` no válido → 0; sin división por cero. El ancho CSS usa ese entero (la precisión del contrato es entero, aunque el estilo admita decimales).
  - `textoDeProgreso(minutos, objetivo)` → texto «X de Y min» en es-ES (los decimales con coma: «90,5 de 300 min») o **`null` si el objetivo no es válido** → la interfaz pinta el estado vacío.
  - `objetivoCumplido(minutos, objetivo)` → booleano: `minutos ≥ objetivo`; objetivo no válido → `false`; con decimales: `objetivoCumplido(90.5, 90)` → `true`.
  - `app.js` es solo integración (campo, guardado y pintado) y no se testea con node. El porcentaje es un dato interno del ancho de la barra: no se muestra como texto (RF-4).
- **RNF-5 — Datos sagrados**: la clave `diario-estudio-sesiones` y el formato de las sesiones **no cambian**; el objetivo se guarda en la clave nueva aprobada `diario-estudio-objetivo-semanal`, sin tocar lo existente; ninguna regla de esta spec borra ni modifica sesiones guardadas; un objetivo corrupto no rompe la app (RF-2).
- **RNF-6 — Accesibilidad y contraste (D-9)**: el progreso se entiende solo con el texto (la barra lleva su equivalente textual para lector de pantalla, p. ej. `role="img"` + `aria-label` con los mismos minutos); el texto del progreso, el botón, el estado vacío y «¡Objetivo cumplido!» cumplen **4,5:1** (WCAG 2.1, criterio 1.4.3, texto). **La paleta y los estilos se eligen desde el principio cumpliendo 4,5:1, incluido el estado vacío** (se mide en DevTools antes de cerrar la implementación), para no repetir la enmienda de contraste que sufrió la spec 001.
- **RNF-7 — Encaje en móvil**: con un ancho de 375 px, la zona del objetivo dentro de la tarjeta «Esta semana» no desarrolla desbordamiento horizontal; en móvil se comporta como el resto de tarjetas (se apila si hace falta).
- **RNF-8 — Formato numérico**: las cifras de los **textos** de interfaz (progreso, mensajes, estado vacío) usan la convención es-ES del resto de la app (4 cifras sin separador «1234», millar desde 5 «12.345», convención RAE). El **campo** del objetivo es `type="number"` y muestra y acepta el entero **sin separador de miles** (`100000`, no «100.000»): `type="number"` no admite el punto; el es-ES con punto es solo para textos.
- **RNF-9 — Rendimiento**: el progreso se calcula dentro del pintado actual sin demora perceptible, incluso con un año de sesiones.

---

## Casos límite

1. **Sin objetivo fijado**: estado vacío con invitación a fijarlo; sin progreso ni barra (RF-1).
2. **Objetivo con la semana vacía**: «0 de Y min», barra al 0 %, sin división por cero (RF-4, RF-6).
3. **Alcanzar o superar el objetivo** (D-8): «300 de 300 min» o «320 de 300 min», barra al 100 % y mensaje «¡Objetivo cumplido!» (RF-4).
4. **Objetivo corrupto en localStorage** (texto, 0, negativo, no numérico o decimal `300.5` metido a mano): se trata como «sin objetivo» (`null`), sin errores en consola (RF-2).
5. **Objetivo borrado a mano de localStorage** (p. ej. desde Application): al recargar, vuelve el estado vacío (RF-1).
6. **Intentar vaciar el campo o fijar 0, negativo o no entero**: la validación nativa bloquea el envío; no hay borrado del objetivo por interfaz, solo cambio (D-7, RF-1, RF-5).
7. **Cambio del objetivo a mitad de semana**: el progreso se recalcula al instante contra el nuevo valor, sin memoria del valor anterior (p. ej. 90 de 300 → «90 de 200 min» al guardar 200) (RF-5).
8. **Cambio de semana con la app abierta**: progreso y semana se refrescan en el siguiente repintado, sin temporizadores; el objetivo único sigue vigente (RF-5, RF-6).
9. **Sesión con fecha futura heredada**: sus minutos no suman al progreso (RF-6).
10. **Minutos corruptos en una sesión** (texto, 0, negativos): no suman, igual que en la tarjeta «Esta semana» (RF-3).
11. **Minutos con decimales (dato heredado)**: se suman igual que en la tarjeta de semana y el texto los muestra con coma es-ES («90,5 de 300 min»); con objetivo 90 y 90,5 min estudiados → cumplido (RF-3, RF-4).
12. **Objetivo muy grande** (p. ej. 100000): el texto muestra «100.000 min» en es-ES, el campo va sin separador (`100000`) y la barra sigue proporcional, sin desbordes (RNF-8, RNF-7).
13. **Campo con texto tecleado sin guardar al repintar** (p. ej. al registrar una sesión): se conserva lo tecleado; el repintado no modifica el campo salvo al abrir y tras guardar (RF-5).

---

## Fuera de alcance (versión 1)

- Objetivos diarios, por materia, múltiples o por periodo personalizado.
- Notificaciones, recordatorios, alarmas o mensajes push.
- Rachas de cumplimiento, marcas, insignias, animaciones o celebraciones (el único texto extra aprobado es «¡Objetivo cumplido!», RF-4).
- Histórico de objetivos ni un objetivo por semana: hay **un único objetivo fijo** que el usuario cambia cuando quiere (RF-5); tampoco comparativas («esta semana frente a la anterior»).
- Mostrar el porcentaje en texto (decisión de porcentaje: solo barra y «X de Y min»).
- Borrar el objetivo por interfaz (D-7: solo cambiarlo).
- Cambiar los **cálculos y textos existentes** de la tarjeta «Esta semana» (su total de minutos y su gráfico de 7 barras), las rachas, «Este mes», el mapa de calor o la lista de sesiones; el objetivo se añade **dentro** de «Esta semana» como contenido nuevo sin tocarlos (RF-7).
- Backend, cuentas de usuario, sincronización o exportación.
- Guardar cualquier dato que no sea el objetivo en la clave aprobada `diario-estudio-objetivo-semanal`.

---

## Traza prevista (para la fase de planificación)

| Capa | Archivo | Contenido previsto |
|---|---|---|
| Lógica pura | `calor.js` | Funciones nuevas con los contratos de RNF-4: `minutosDeSemana(sesiones, hoy)` (**nombre sin colisión** con la `minutosDeLaSemana()` de `app.js`), `objetivoValido(valor)` → entero ≥1 o `null`, `porcentajeDeProgreso(minutos, objetivo)` → entero 0–100 (`Math.round`), `textoDeProgreso(minutos, objetivo)` → «90 de 300 min» en es-ES (coma en decimales) o `null`, y `objetivoCumplido(minutos, objetivo)` → booleano; todas sin lanzar, exportadas en `module.exports` |
| Pruebas | `tests/calor.test.js` | Tests nuevos con `node --test`: semana en curso (con `hoy` inyectado), exclusión de futuras y minutos corruptos, contrato «sin objetivo» = `null` en las 4 funciones, redondeo entero del ancho (90/300 → 30, 100/300 → 33), formato es-ES («100.000» y «90,5» con coma), `objetivoCumplido(90.5, 90)` → `true` y no cumplido → `false`, decimal `300.5` como objetivo → `null` |
| Integración | `app.js` | Cargar/guardar el objetivo en la clave nueva `diario-estudio-objetivo-semanal`; formulario con botón «Guardar objetivo» (Enter incluido); estado vacío; **la tarjeta «Esta semana» pasa a reutilizar `minutosDeSemana`** (sus textos intactos); pintado del progreso dentro de `pintarTodo()` **sin tocar el campo** salvo al abrir y tras guardar (RF-5) |
| Estructura | `index.html` | Campo `type="number"` + botón «Guardar objetivo», estado vacío, progreso y mensaje «¡Objetivo cumplido!», **dentro de la tarjeta «Esta semana»** |
| Estilos | `styles.css` | Barra de progreso y estado vacío dentro de la tarjeta existente; colores elegidos para 4,5:1 **desde el principio**, estado vacío incluido (RNF-6) |

---

## Criterios de finalización

1. Todos los RF de esta spec están implementados y verificados con Chrome DevTools (MCP): abrir la app en **estado vacío** (sin objetivo), fijar un objetivo con «Guardar objetivo» (y con Enter), comprobar el progreso y la barra dentro de la tarjeta «Esta semana», registrar una sesión y ver cómo avanza, recargar y comprobar la persistencia en la clave nueva, editar el objetivo a mitad de semana y comprobar que un tecleo sin guardar **no se pierde al repintar**, probar los valores límite **distinguiendo los dos «0»**: (a) intentar fijar **0 minutos como objetivo** → bloqueado por la validación nativa (verificable en DevTools quitando `min`/`step` por consola y forzando el envío) y (b) **0 minutos de progreso** con la semana vacía → «0 de Y min»; además, alcanzar el objetivo («300 de 300 min» con «¡Objetivo cumplido!») y objetivo corrupto en localStorage; **vista móvil a 375 px**; **consola sin errores**.
2. La lógica (minutos de la semana en curso, contratos con «sin objetivo» = `null`, ancho entero con tope y `Math.round`, texto «X de Y min» en es-ES con coma decimal, objetivo cumplido, exclusiones de fechas futuras y minutos corruptos) está cubierta por pruebas automatizadas en verde con `node --test`; no se avanza con pruebas en rojo (constitución, principio 4).
3. Sin dependencias nuevas ni build: la app sigue abriéndose con doble clic.
4. Compatibilidad: la clave y el formato de las sesiones existentes no cambian; racha, semana, mes, gráfico, mapa y lista se calculan igual que antes y **ninguna sesión se pierde** (constitución, principio 5).
5. Interfaz y textos de esta función completamente en español; identificadores de código en español (enmienda del principio 6).
6. Documentación actualizada: `MEMORY.md` con el estado y las decisiones de esta función, y la **sección «Datos» de `AGENTS.md` ampliada con la clave nueva** `diario-estudio-objetivo-semanal` (además de su clave de sesiones).
7. Las 6 dudas de la fase de preguntas y los 18 hallazgos del QA de fase 2 están resueltos en v1.2 (tablas «Decisiones de la fase de preguntas» y «Decisiones del QA de fase 2») y no queda ninguna ambigüedad sin cerrar; **la aprobación de la spec es del usuario** (constitución, principio 2).

---

## Dudas abiertas

**Ninguna.** Historial: las 6 dudas iniciales del borrador (clave de persistencia, ubicación, alcance semanal, momento de edición, porcentaje y mensaje al superar el objetivo) se resolvieron con las respuestas del usuario, recogidas en «Decisiones de la fase de preguntas». El QA de fase 2 detectó 18 hallazgos, resueltos en **v1.2**: 3 con decisiones nuevas del usuario (**D-7** formulario con botón, **D-8** cumplimiento al alcanzar o superar, **D-9** accesibilidad mantenida) y los 15 restantes como precisiones del redactor ya incorporadas a los RF, RNF, casos límite, fuera de alcance, traza y criterios de finalización (precedente de la spec 001, cuyas dudas quedaron igualmente en «Ninguna» tras su ronda de QA). La spec queda **pendiente de aprobación del usuario** antes de pasar a la fase de planificación.
