# Tareas — Objetivo semanal (spec 002)

**Spec**: `specs/002-objetivo-semanal/spec.md` (v1.2, aprobada) · **Plan**: `specs/002-objetivo-semanal/plan.md` (v1, **pendiente de aprobación del usuario**)
**Estado**: ninguna tarea comenzada (checkboxes sin marcar).

Desglose del plan v1. Cada tarea es un bloque de ≤20–30 min con su prueba o verificación; **no se avanza con `node --test` en rojo** (constitución 4). Antes de tocar fechas: leer `.agents/skills/local-dates/SKILL.md` (checklist aplicada en §11 del plan). IDs de pruebas nuevas **O1–O12** (los 24 existentes no se tocan).

## A. Lógica pura — `calor.js` + `tests/calor.test.js`

- [x] **T1 — Validador del objetivo** `RF-1`, `RF-2`, `RNF-4`
  - Hecho cuando: existe `objetivoValido(valor)` (entero ≥ 1 o `null`, sin lanzar) y O1 está en verde: `300`/`1` → `300`; `0`, `-5`, `300.5`, `"300"`, `""`, `null`, `undefined`, `{}`, `NaN`, `Infinity` → `null`.
- [x] **T2 — Lectura de la clave corrupta** `RF-2`, `RNF-4`
  - Hecho cuando: existe `objetivoDesdeTexto(texto)` con `try/catch` (D4) y O2 está en verde: `"300"` → `300`; `"0"`, `"-5"`, `"300.5"`, `"abc"`, `""`, `"null"`, `"{}"`, `"\"300\""`, `undefined` → `null` **sin excepción**.
- [x] **T3 — Minutos de la semana en curso** `RF-3`, `RF-6`, `RF-7`, `RNF-2`
  - Hecho cuando: existe `minutosDeSemana(sesiones, hoy)` con la regla de la tarjeta (D12: rango lunes…hoy por texto + `minutosValidos`) y O3, O4, O5 y O10 están en verde (lunes→hoy excluye futuras; dominio de `hoy` en lunes y domingo; cambio de hora 2026-10-25 y 2027-03-28; coherencia total ↔ suma diaria).
- [x] **T4 — Porcentaje con tope entero** `RF-4`
  - Hecho cuando: existe `porcentajeDeProgreso(minutos, objetivo)` (entero 0–100 con `Math.round`, sin división por cero) y O6 está en verde: (90,300)→30, (100,300)→33, (0,300)→0, (320,300) y (500,300)→100, objetivo/minutos basura → 0.
- [x] **T5 — Texto «X de Y min» en es-ES** `RF-3`, `RF-6`, `RNF-8`
  - Hecho cuando: existe `textoDeProgreso(minutos, objetivo)` (o `null` sin objetivo) y O7 y O9 están en verde: «90 de 300 min», «12.345 de 100.000 min», «1234 de 5678 min», «90,5 de 300 min», objetivo `null` → `null`, y semana vacía → «0 de 300 min».
- [x] **T6 — Objetivo cumplido y exportaciones** `RF-4`, `RF-5`, `RNF-4`
  - Hecho cuando: existe `objetivoCumplido(minutos, objetivo)` y O8, O9 (completa: le falta `objetivoCumplido(0,300)` → `false`, anotado en el test), O11 y O12 están en verde ((300,300)→`true`, (299,300)→`false`, (90.5,90)→`true`, `null`→`false`; ninguna de las 6 funciones lanza con basura; recálculo 300→200 cambia texto/porcentaje/cumplido), y las 6 funciones están en el bloque `module.exports` de `calor.js`.
- [x] **T7 — Batería completa en verde** todos los RF de lógica, `RNF-4`
  - Hecho cuando: `node --test` reporta **36 tests, 0 fallos** (los 24 existentes + O1–O12), **antes de tocar la interfaz**.

## B. Interfaz — `index.html`, `styles.css`, `app.js`

- [x] **T8 — Bloque del objetivo en la tarjeta** `RF-1`, `RF-4`, `D-7`
  - Hecho cuando: dentro de «Esta semana» (tras el gráfico) existe el `<form id="formulario-objetivo">` con campo `type="number"` (`min="1"`, `step="1"`, `required`) y botón «Guardar objetivo», más estado vacío, texto de progreso, barra y «¡Objetivo cumplido!» oculto; con la clave borrada se ve el estado vacío con su invitación.
- [x] **T9 — Estilos con contraste de origen** `RNF-6`, `RNF-7`, `D11`
  - Hecho cuando: barra (pista + relleno), estado vacío y mensaje tienen sus selectores con la paleta de D11 (`#1f2430`, `#6b7280`, `#4f46e5`, `#e6e8f0`), prevista ≥4,5:1 para los textos; el resto de tarjetas quedan visualmente idénticas y no se añaden animaciones.
- [x] **T10 — Carga y guardado del objetivo** `RF-2`, `RNF-5`, `D1`, `D5`
  - Hecho cuando: existen `CLAVE_OBJETIVO = "diario-estudio-objetivo-semanal"`, el global `objetivoSemanal` y `cargarObjetivo()`/`guardarObjetivo()` con `try/catch`; al guardar 300 la clave contiene el entero `300` (JSON) y la clave `diario-estudio-sesiones` queda **byte a byte igual**.
- [x] **T11 — `pintarObjetivo()` dentro de `pintarTodo()`** `RF-1`, `RF-3`, `RF-4`, `RF-6`, `D9`, `D15`
  - Hecho cuando: `pintarTodo()` llama a `pintarObjetivo()`, que pinta texto + barra + mensaje (o estado vacío), la barra tiene `role="img"` con `aria-label` = al texto visible y su `width` sale de `porcentajeDeProgreso`; probado en consola, llamar `pintarTodo()` **no modifica** lo que haya tecleado el usuario en el campo.
- [x] **T12 — Formulario del objetivo (submit y Enter)** `RF-1`, `RF-5`, `D-7`
  - Hecho cuando: el `submit` del formulario hace `preventDefault` + `objetivoValido(Number(valor))`, guarda y repinta; con la app, **Enter** en el campo también envía; el valor `0`, vacío o con decimal no se guarda (guarda JS); el campo se rellena **solo al abrir y tras guardar**.
- [x] **T13 — La tarjeta reutiliza la función pura** `RF-3`, `RF-7`, `D2`
  - Hecho cuando: la `minutosDeLaSemana()` local de `app.js` está **eliminada** (no quedan dos nombres en el ámbito global) y `pintarSemana` usa `minutosDeSemana(sesiones, fechaLocal(new Date()))`; con los mismos datos de la v6, el total y sus textos son idénticos a los de antes.

## C. Verificación con Chrome DevTools — §8 del plan

- [x] **T14 — Estado vacío, guardar y persistencia** `RF-1`, `RF-2`
  - Hecho cuando: §8.2 y §8.3 pasan: sin clave → estado vacío sin progreso; guardar `300` con el botón y con **Enter** → clave = `300`, progreso «0 de 300 min» y barra 0 %; tras recargar sigue; la clave de sesiones no cambia; consola limpia.
- [x] **T15 — Progreso y coherencia con el gráfico** `RF-3`, `RF-7`
  - Hecho cuando: §8.4 pasa: con sesiones de 60 (lunes 2026-10-05) y 30 (martes) → «90 de 300 min» y barra al **30 %**; el total de la tarjeta coincide con la suma de las 7 barras del gráfico; **no aparece ningún «%»** como texto.
- [x] **T16 — Edición y tecleo sin guardar** `RF-5`
  - Hecho cuando: §8.5 pasa: cambiar a `200` → «90 de 200 min» al instante; teclear `250` sin guardar y registrar una sesión → el campo **conserva el 250**; al recargar, el campo muestra `200`.
- [x] **T17 — «¡Objetivo cumplido!»** `RF-4`
  - Hecho cuando: §8.6 pasa: con objetivo 300, en 299 **no** aparece el mensaje; en «300 de 300 min» **sí** con barra 100 %; en «320 de 300 min» sigue con barra 100 % y mensaje. *Verificado (2026-10-08, semana = 100 min reales): objetivo 211 → «100 de 211 min» / 47 % / sin mensaje; 100 → «100 de 100 min» / 100 % / con mensaje; 90 → «100 de 90 min» / 100 % (tope) / con mensaje; bajar a 211 → el mensaje desaparece al repintar; consola limpia; estado final objetivo 90.*
- [x] **T18 — Valores límite** `RF-1`, `RF-2`, `RNF-8`
  - Hecho cuando: §8.7 y §8.8 pasan: quitando `min`/`step`, `0` y vacío no se guardan (guarda JS, clave intacta); `"300.5"` a mano en la clave → estado vacío y consola limpia (la clave sigue `"300.5"` hasta que se guarde un valor válido; al guardar `90` vuelve a entero); objetivo `100000` → campo `100000` (sin separador) y texto «100 de 100.000 min»; tecleando `100.000` en Chrome (es) se interpreta como 100 con `step="1"` → enviado queda `100`; sesión heredada de 90,5 min con objetivo 90 → «190,5 de 90 min» (texto con coma es-ES) + mensaje «¡Objetivo cumplido!» visible; limpiada por id exacto (99001).
- [x] **T19 — Los stats existentes no cambian** `RF-7`
  - Hecho cuando: §8.9 pasa: racha, mejor racha, semana, mes, gráfico, mapa y lista conservan **exactamente** sus textos de la v6 y se actualizan al registrar una sesión.
- [x] **T20 — Contraste medido** `RNF-6`
  - Hecho cuando: §8.10 pasa: el script de ratios da **≥4,5:1** para texto principal, secundario, estado vacío y «¡Objetivo cumplido!» (previstos ≈15,5 · ≈4,8 · ≈6,3) y ≥3:1 relleno vs pista (previsto ≈5,1), y los valores **medidos** quedan anotados en §8.10 del plan.
- [x] **T21 — Móvil 375 px** `RNF-7` (devtools emulate 375x812; sin desbordamiento horizontal, bloque .objetivo cabe, formulario usable, barra/estado correcto, consola limpia, estado restaurado)
  - Hecho cuando: §8.11 pasa: con `emulate({viewport:"375x812x2,mobile,touch"})` la tarjeta «Esta semana» con su bloque del objetivo no desborda, el formulario es usable y el gráfico se ve; se limpia con `viewport:""`.
- [x] **T22 — Cierre de la verificación** `RNF-1`, `RNF-3`, `RNF-9`
  - Hecho cuando: §8.12 y §8.13 pasan: `pintarTodo()` con ~365 sesiones inyectadas tarda **<200 ms** (y solo se borran esos datos de prueba); la app abierta con doble clic (`file://`) muestra todo el bloque del objetivo **en español** y la consola no tiene errores en ningún paso; `node --test` sigue en **36/36**.

## D. Documentación

- [x] **T23 — `AGENTS.md`: sección «Datos»** (finalización 6)
  - Hecho cuando: la sección «Datos» de `AGENTS.md` lista las **dos** claves — `diario-estudio-sesiones` (sin cambios) y `diario-estudio-objetivo-semanal` (entero de minutos ≥1; ausente/corrupto = sin objetivo) — conservando todas las reglas existentes.
- [x] **T24 — `MEMORY.md` y estados** (finalización 6 y 7)
  - Hecho cuando: `MEMORY.md` recoge la v7 de la app, los **36 tests**, la clave nueva y las decisiones clave del plan (D2 sin colisión, D9 no pisar el campo, D11 contraste medido); el plan queda marcado «implementada y verificada» con los valores medidos de §8.10; `node --test` sigue en 36/36.
