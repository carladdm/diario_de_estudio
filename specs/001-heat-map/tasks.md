# Tareas — Mapa de calor (spec 001)

**Spec**: `specs/001-heat-map/spec.md` (v2.2) · **Plan**: `specs/001-heat-map/plan.md` (v2)
**Estado**: todas las tareas completadas (app v6: `node --test` 24/24 y §8 del plan verificado).

Desglose de los deltas del plan v2 sobre la v5 ya existente. Cada tarea es un bloque de ≤30 min con su prueba o verificación; **no se avanza con `node --test` en rojo** (constitución 4). Antes de tocar fechas: leer `.agents/skills/local-dates/SKILL.md`. IDs de pruebas E1–E12 / N1–N12 según §7 del plan.

## A. Lógica pura — `calor.js` + `tests/calor.test.js`

- [x] **T1 — Validar fechas de sesión** `RF-2`
  - Hecho cuando: existe `fechaValida(texto)` (contrato string-only, ida y vuelta) y N1 está en verde: «2026-10-07» → true; «abc», «2026-13-45», «2026-02-30», «2026-10-7» → false; `undefined`/`null`/`42` → false **sin lanzar**.
- [x] **T2 — Excluir fechas corruptas de los totales** `RF-2`, `RNF-5`
  - Hecho cuando: `totalesPorDia` filtra primero con `fechaValida` y N2 está en verde (las sesiones con fecha «abc»/no-string no entran; la válida del mismo día sí), con E4 sin romperse.
- [x] **T3 — Redondear decimales solo al pintar** `RF-5`
  - Hecho cuando: `totalesPorDia` redondea cada clave **después** de sumar y N3 está en verde: 10,4+10,4 → 21; 2,5 → 3; 0,4 → clave 0 (celda vacía y no sube `max`).
- [x] **T4 — Cortes enteros de nivel** `RF-3`
  - Hecho cuando: existen `cortesDeNiveles` y `nivelDeMinutos` con cortes `c₁/c₂/c₃`; N4 ([15,30,45] y [3,5,8]) y E6/E7 (mismas expectativas) están en verde y sus títulos hablan de cortes.
- [x] **T5 — Recálculo al subir el máximo** `RF-3`
  - Hecho cuando: N5 está en verde: con max 60 → `nivel(45)=4`; añadiendo una sesión de 120 → `max=120`, `nivel(45)=2` y leyenda `1-29/30-59/60-89/90-120`.
- [x] **T6 — Leyenda con los cortes compartidos y es-ES** `RF-7`, `RNF-9`
  - Hecho cuando: `rangosDeLeyenda` usa `cortesDeNiveles` y `toLocaleString("es-ES")`, con E9 y N6 en verde («926-1234 min» con 4 cifras sin separador y «9259-12.345 min» con 5).
- [x] **T7 — Detalle de celda en es-ES** `RF-8`, `RNF-9`
  - Hecho cuando: `descripcionDeCelda` formatea los minutos con es-ES y N7 («12.345 min» y «1234 min») y E10 están en verde.
- [x] **T8 — `formatearFecha` defensivo (E1)** `RF-2`
  - Hecho cuando: una fecha que no pasa `fechaValida` se devuelve tal cual y N12 está en verde («abc» → «abc», «2026-02-30» → «2026-02-30»), con la válida intacta («7 de octubre de 2026»).
- [x] **T9 — Comparar fechas futuras como texto** `RF-11`
  - Hecho cuando: existe `fechaFutura(fecha, hoy)` (no-string → `false` sin lanzar) y N8 está en verde: pasada/misma → false, mañana → true, no-string → false.
- [x] **T10 — Pruebas de ventana y etiquetas** `RF-1`, `RF-9`, `RNF-4`
  - Hecho cuando: N9, N10 y N11 están en verde: la ventana solo depende de `hoy`; `2026-10-28` → `2026-05-04…2026-11-01` y `2027-04-01` → `2026-10-05…2027-04-04` con 182 días distintos y consecutivos (cambio de hora); «ene 2027» y «feb 2027» llevan año.
- [x] **T11 — Batería completa en verde** todos los RF de lógica, `RNF-8`
  - Hecho cuando: `node --test` reporta **24 tests, 0 fallos** (E1–E12 + N1–N12).

## B. Interfaz — `app.js` + `styles.css`

- [x] **T12 — Paleta con contraste y hueco de 3 px** `RNF-7`, `RNF-2`, `RF-3`
  - Hecho cuando: los 4 tonos son `#767ef5/#6366f1/#5457e8/#4338ca` y `.mapa-rejilla` tiene `gap: 3px`; un script en DevTools mide contra `#ffffff` **3,46 · 4,47 · 5,38 · 7,90** (todos ≥3:1; el vacío `#f0f1f7` exento).
- [x] **T13 — `actualizarMaxFecha()` sin temporizadores** `RF-11`, `RF-1`
  - Hecho cuando: `inputFecha.max` se fija al cargar, en cada `pintarTodo()` y al enfocar/cambiar el campo; en DevTools, poniendo `max = "2000-01-01"` y enfocando, el límite vuelve a «hoy», y no hay ningún timer nuevo.
- [x] **T14 — Guarda de fecha futura en el `submit`** `RF-11`
  - Hecho cuando: con `max` quitado por consola y una fecha futura válida, el envío no registra nada, el formulario conserva los valores y la consola no muestra errores («hoy» calculado en el instante del envío con `fechaFutura`).

## C. Verificación con Chrome DevTools — §8 del plan

- [x] **T15 — Estado vacío, leyenda «—» y recálculo** `RF-6`, `RF-7`, `RF-3`
  - Hecho cuando: sin datos → leyenda solo «0 min» y 182 celdas vacías; con una sesión de 3 min → «0 min, —, 1 min, 2 min, 3 min»; con 60/30/45 y luego 120 → leyenda «1-29 / 30-59 / 60-89 / 90-120» y el día de 45 baja a nivel-2.
- [x] **T16 — Los stats existentes no cambian** `RF-10`
  - Hecho cuando: racha, mejor racha, semana, mes y lista conservan exactamente sus textos de la v5 (mismas cifras es-ES y plurales) y se actualizan al registrar una sesión.
- [x] **T17 — Detalle y accesibilidad de las celdas** `RF-8`, `RNF-3`
  - Hecho cuando: en las 182 celdas `title` = `aria-label`, ninguna tiene `tabindex` ni manejadores de foco, y los rótulos de día/mes están en español.
- [x] **T18 — RF-11 extremo a extremo** `RF-11`
  - Hecho cuando: `input.max` = hoy al abrir; el campo rechaza nativamente una fecha futura; quitando `max`, la guarda JS la corta (T14); y el límite sigue siendo hoy tras repintar.
- [x] **T19 — Datos heredados corruptos y futuros** `RF-2`, `RF-4`, `RNF-5`
  - Hecho cuando: inyectando por consola `{"fecha":"abc"}` y una sesión con fecha futura, la lista muestra «abc» tal cual, sus celdas quedan vacías (futuras fuera de `max`), las sesiones del almacén no se modifican y la consola está limpia.
- [x] **T20 — Rendimiento con un año de sesiones** `RNF-6`, `RNF-5`
  - Hecho cuando: inyectadas ~365 sesiones, `pintarTodo()` tarda **<200 ms** (medido: 88 ms) y al terminar se borran **solo** esos datos de prueba (comprobando el recuento de sesiones).
- [x] **T21 — Móvil 375 px y umbral de scroll** `RNF-2`
  - Hecho cuando: con `emulate({viewport:"375x812x2,mobile,touch"})` la página no se desborda (375 vs 375), `.mapa-scroll` desborda solo por dentro (rejilla **438 px** > 318 del contenedor) con rótulos sticky visibles, y en escritorio no hay scroll; limpiar con `viewport:""`.
- [x] **T22 — Cierre de verificación** `RNF-1`, `RNF-3`
  - Hecho cuando: la app abierta con doble clic (`file://`) muestra todo el mapa en español y la consola no tiene errores en ninguno de los pasos anteriores.

## D. Documentación

- [x] **T23 — Estado y memoria** `RF-1` (criterios de finalización 3 y 6)
  - Hecho cuando: la spec queda en v2.2 y el plan en «implementada y verificada», y `MEMORY.md` recoge el estado (v6, 24 tests), las decisiones (paleta, 438 px) y los errores a evitar; `node --test` sigue en 24/24.
