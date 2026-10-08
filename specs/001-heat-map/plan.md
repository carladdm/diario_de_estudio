# Plan de implementación — Mapa de calor (spec 001, revisión v2)

**Spec que rige**: `specs/001-heat-map/spec.md` (v2.1 aprobada; §12 propone 2 enmiendas menores)
**Cumple**: `docs/constitution.md` (1 simplicidad, 2 la spec manda, 3 lógica pura, 4 tests, 5 datos sagrados, 6 idioma)
**Estado**: **v2 — implementada y verificada**. QA del plan (32 hallazgos) resuelto con las decisiones D1–D20 de la §11; enmiendas E1/E2 aplicadas en la spec (v2.2); `node --test` con 24 pruebas en verde y §8 (verificación con Chrome DevTools) completada.

> Nota sobre el principio 6: la interfaz y la documentación van en español (RF-1); los identificadores del código van en español conforme a la **enmienda del principio 6** de `docs/constitution.md` (excepción aprobada por el usuario, anotada en `MEMORY.md`).

> Versiones: «v5» es la versión de la aplicación ya desplegada; «v2.1» es la revisión de esta spec y «v2» la de este plan. No confundir.

---

## 1. Alcance: de la v5 a la siguiente versión

La v5 ya está implementada y en verde (12 tests). Esta revisión **no rehace el mapa**: aplica los **deltas de la spec v2.1** sobre lo existente.

| ¿Qué hay ya? | ¿Qué cambia? |
|---|---|
| Ventana de 26 semanas, niveles %, leyenda, detalle con `title`+`aria-label`, scroll interno, rótulos sticky | Cortes enteros `c₁/c₂/c₃`, redondeo de decimales, fechas corruptas ignoradas, es-ES en leyenda y detalle, `max` del campo de fecha + guarda JS, «—» en niveles inalcanzables, rótulos de año |

---

## 2. Archivos

| Archivo | Acción |
|---|---|
| `specs/001-heat-map/spec.md` | v2.2: enmiendas E1/E2 de la §12 ya aplicadas tras su aprobación |
| `specs/001-heat-map/plan.md` | ya creado (este documento, v2) |
| `calor.js` | modificar: `fechaValida`, `cortesDeNiveles`, `fechaFutura` (nuevas); `totalesPorDia`, `nivelDeMinutos`, `rangosDeLeyenda`, `descripcionDeCelda`, `formatearFecha` (modificadas) |
| `app.js` | modificar: redondeo/`max`/guarda JS en el `submit` y `actualizarMaxFecha()` |
| `styles.css` | modificar: paleta de 4 tonos (contraste ≥3:1), `gap` de la rejilla 4 → 3 px |
| `tests/calor.test.js` | modificar: 12 tests existentes (se conservan) + 12 nuevos = **24** |
| `index.html` | **sin cambios** (el `max` se fija desde JS; RF-10 ya está cumplido) |

---

## 3. Funciones

### Nuevas (en `calor.js`)

| Función | Contrato |
|---|---|
| `fechaValida(texto)` | **Solo textos**: si `typeof texto !== "string"` → `false` sin lanzar (D1). Para textos: formato correcto y día real, comprobado por ida y vuelta: `fechaLocal(fechaDesdeTexto(texto)) === texto`. Detecta «abc», «2026-13-45», «2026-02-30», «2026-10-7» (sin rellenar). |
| `cortesDeNiveles(maximo)` | Devuelve `[c₁, c₂, c₃]` = `⌈max/4⌉, ⌈max/2⌉, ⌈3·max/4⌉`. **Precondición**: entero ≥ 1 (D3). Los dos llamadores filtran `max ≤ 0` antes (`nivelDeMinutos` → 0; `rangosDeLeyenda` → `null`); no se duplica la guarda dentro. |
| `fechaFutura(fecha, hoy)` | Dos textos `AAAA-MM-DD`; compara como texto. Si alguno no es string → `false`, sin lanzar (D2): no bloquea un envío por datos garbados; la defensa real es el `max` nativo más las guardas del formulario. |

### Modificadas

| Función | Cambio |
|---|---|
| `totalesPorDia` | Primero filtra con `fechaValida(s.fecha)` (primer filtro, antes de tocar la fecha) y luego suma; **al final redondea cada clave existente** con `Math.round` (D6). Total que redondea a 0 (p. ej. 0,4 min) → la clave se queda con 0: celda vacía y no sube `max`. |
| `nivelDeMinutos` | Cortes enteros vía `cortesDeNiveles`. Dominio: `minutos` y `maximo` enteros (garantizado por el redondeo) (D4). |
| `rangosDeLeyenda` | Pares inicio/fin con los mismos cortes enteros; inicio > fin → «—»; números con `toLocaleString("es-ES")`. |
| `descripcionDeCelda` | Minutos con `toLocaleString("es-ES")` (hoy pega el número con `+`). |
| `formatearFecha` | **Defensiva** (D5): si `!fechaValida(texto)` devuelve el texto tal cual, sin formatear. Así una sesión con fecha corrupta no rompe la lista (hoy lanza `RangeError` y rompe todo el pintado). Requiere la enmienda E1 de la §12. |

### Sin cambios
`fechaLocal`, `fechaDesdeTexto`, `restarDias`, `minutosValidos`, `diasDelMapaCalor`, `maximoDiario`, `etiquetasDeMes`.

---

## 4. Pseudocódigo

### 4.1 `fechaValida`
```
si typeof texto !== "string" → false
devolver fechaLocal(fechaDesdeTexto(texto)) === texto
```

### 4.2 `totalesPorDia`
```
porDia ← {}
para cada sesión:
  si NO fechaValida(sesión.fecha) → saltar          // incluye fechas no-string
  si NO días.includes(sesión.fecha) → saltar
  si sesión.fecha > hoy → saltar                     // texto ordenado = orden cronológico
  si NO minutosValidos(sesión.minutos) → saltar
  porDia[sesión.fecha] ← (porDia[sesión.fecha] || 0) + sesión.minutos
para cada CLAVE existente de porDia:                  // solo claves existentes (D6)
  porDia[clave] ← Math.round(porDia[clave])
devolver porDia
```

### 4.3 `cortesDeNiveles` / `nivelDeMinutos` / `rangosDeLeyenda`
```
cortesDeNiveles(max) → [⌈max/4⌉, ⌈max/2⌉, ⌈3·max/4⌉]
nivelDeMinutos(min, max):
  si max ≤ 0 o min ≤ 0 → 0
  [c1,c2,c3] ← cortesDeNiveles(max)
  min ≥ c3 → 4;  min ≥ c2 → 3;  min ≥ c1 → 2;  si no → 1
rangosDeLeyenda(max):
  si max ≤ 0 → null
  [c1,c2,c3] ← cortesDeNiveles(max)
  pares ← [(1, c1-1), (c1, c2-1), (c2, c3-1), (c3, max)]
  para cada par: inicio > fin → «—»; si no → `${inicio.toLocaleString("es-ES")}-${fin.toLocaleString("es-ES")} min`
```

### 4.4 `formatearFecha` (defensiva)
```
si NO fechaValida(texto) → devolver texto tal cual   // D5, enmienda E1
si no → formatear con Intl es-ES como hasta ahora
```

### 4.5 `actualizarMaxFecha()` (en `app.js`)
```
actualizarMaxFecha(): inputFecha.max ← fechaLocal(new Date())
se llama en tres momentos: al cargar, en cada pintarTodo() y al enfocar
o cambiar el campo de fecha — sin temporizadores (D9, enmienda E2)
```

### 4.6 `submit`
```
si fecha está vacía o minutos inválidos → return (como ya)
hoy ← fechaLocal(new Date())              // «hoy» fresco en este instante (D10)
si fechaFutura(fecha, hoy) → return        // guarda JS silenciosa (D10)
guardar, reset, value ← hoy, pintarTodo()
```

---

## 5. Pintado

- `pintarCalor`: estructura sin cambios. Cambios de datos: los **totales llegan como números enteros** desde `calor.js` (el formateo es-ES se hace aquí al pintar rangos y detalle — D19); `max = maximoDiario(totales)`; celdas sin clave o con 0 → nivel 0; futuras → nivel 0 (sin `aria-label`); color por `nivel-1..4`; `title` + `aria-label` iguales; ninguna celda con `tabindex`.
- `pintarLeyenda(maximo)`: `rangosDeLeyenda` → 5 celdas: «0 min» si es `null`; si no, la 4.ª con «—» cuando hay niveles inalcanzables. El texto «N min» es exacto (test E9).
- Paleta nueva (nivel vacío `#f0f1f7` sin cambios): `#767ef5`, `#6366f1`, `#5457e8`, `#4338ca`. Contraste medido contra `#ffffff` (fondo real de `.tarjeta`, D12): 3,46 / 4,47 / 5,38 / 7,90 — todos ≥3:1.
- Medidas: celdas 12×12; `gap` de la rejilla de 4 → 3 px. El contenido real mide **438 px**: rótulos 20 + 26 columnas 332 (van de 12 a 18,4 px porque las etiquetas de mes ensanchan la suya) + 26 huecos de 3 px = 78 + holgura de 8 px. (La estimación inicial de ≈416 px suponía columnas uniformes de 15 px; se corrigió al medir en el §8.12.) Umbral RNF-2 = 438 px.
- `pintarRacha/pintarSemana/pintarMes/pintarLista`: **sin cambios de texto** (RF-10). En `pintarTodo()`, además de repintar, llama a `actualizarMaxFecha()` (D9).

---

## 6. Decisiones técnicas

1. **Cortes y niveles**: `cortesDeNiveles` compartida por `nivelDeMinutos` y `rangosDeLeyenda`.
2. **`fechaValida` por ida y vuelta** con guarda `typeof` (D1).
3. **`fechaFutura`** compara textos; no-string → `false` (D2).
4. **`max` y guarda del formulario** (D9/D10): `actualizarMaxFecha()` se llama al cargar, en cada `pintarTodo()` y al enfocar/cambiar el campo; en el `submit` se recalcula `hoy` en ese instante. *Descartado A*: solo al cargar — obsoleto al día siguiente. *Descartado B*: solo en `pintarTodo` — con la app abierta al cruzar la medianoche el límite quedaría en «ayer» y rechazaría el día nuevo (hallazgo QA-plan). *Descartado C*: temporizadores — prohibidos por RF-1.
5. **Comparación de fechas**: texto ordenado, nunca `Date`.
6. **Detalle accesible**: `title` + `role="img"` + `aria-label` idénticos, sin foco.
7. **es-ES**: `toLocaleString("es-ES")` en `rangosDeLeyenda` y `descripcionDeCelda`; el resto de la app ya lo usa.
8. **Tests**: un solo archivo `tests/calor.test.js` (D14).
9. **Contraste**: verificado por script en DevTools, fuera de `node` (D12).
10. **Redondeo**: `Math.round` una sola vez, en `totalesPorDia`; totales a 0 → celda vacía (D6).
11. **Defensa en `formatearFecha`**: texto corrupto se muestra tal cual; nunca un `RangeError` (D5).

Decisiones adicionales del QA del plan (D1–D20): ver **§11**.

---

## 7. Pruebas (`node --test`)

Numeración única (D14): **E1–E12** = existentes (se conservan con sus mismas expectativas; en E6/E7 solo se ajusta el título/comentario para hablar de cortes `c₁/c₂/c₃`, equivalentes para esos valores). **N1–N12** = nuevos.

### Existentes (E)

| ID | Prueba | RF |
|---|---|---|
| E1 | La ventana tiene 26 semanas completas de lunes a domingo | RF-1 |
| E2 | La ventana empieza en lunes y termina en domingo | RF-1 |
| E3 | La ventana cruza el cambio de año | RF-1 |
| E4 | Suma minutos del mismo día; excluye futuras, inválidas y fuera de ventana | RF-2/4/5 |
| E5 | El máximo es el mayor total (con 0 y negativos da 0) | RF-3 |
| E6 | Fronteras de nivel con max=60 (14/15, 29/30, 44/45) | RF-3 |
| E7 | Con max=10 hay niveles imposibles sin romper | RF-3/7 |
| E8 | Sin minutos en la ventana, la leyenda no tiene rangos | RF-6/7 |
| E9 | Los rangos usan los mismos cortes + propiedad leyenda↔niveles | RF-7 |
| E10 | `descripcionDeCelda` con minutos y sin minutos | RF-8 |
| E11 | Las etiquetas de mes salen en es-ES | RF-9 |
| E12 | Al cruzar el año, la primera etiqueta lo incluye | RF-9 |

### Nuevos (N)

| ID | Prueba | RF |
|---|---|---|
| N1 | `fechaValida`: «2026-10-07» → true; «abc», «2026-13-45», «2026-02-30», «2026-10-7» → false; `undefined`/`null`/`42` → false **sin lanzar** | RF-2 |
| N2 | Sesión con fecha corrupta (texto y no-string) no entra en `totalesPorDia` | RF-2 |
| N3 | Decimales: 10,4+10,4 → 21; 2,5 → 3; 0,4 → clave 0 (celda vacía, no sube `max`) | RF-5 |
| N4 | `cortesDeNiveles(60)` → `[15,30,45]`; `(10)` → `[3,5,8]` | RF-3 |
| N5 | Recálculo: mismos datos con max 60 → `nivel(45)=4`; añadiendo sesión de 120 → `max=120`, `nivel(45)=2`, leyenda `1-29/30-59/60-89/90-120` | RF-3 |
| N6 | Rangos es-ES: `rangosDeLeyenda(1234)` → `["1-308 min","309-616 min","617-925 min","926-1234 min"]` (4 cifras sin separador) y `rangosDeLeyenda(12345)` → `…,"9259-12.345 min"` (millar con punto desde 5 cifras) | RF-7, RNF-9 |
| N7 | `descripcionDeCelda("2026-10-07", 12345)` → «7 de octubre de 2026: 12.345 min»; con 1234 → «…: 1234 min» | RF-8, RNF-9 |
| N8 | `fechaFutura`: pasada → false, misma → false, mañana → true, no-string → false | RF-11 |
| N9 | La ventana solo depende de `hoy` (dos llamadas idénticas dan igual) y una sesión anterior no la altera | RF-1 |
| N10 | Cambio de hora: `hoy=2026-10-28` → `2026-05-04…2026-11-01`; `hoy=2027-04-01` → `2026-10-05…2027-04-04`; 182 días distintos y consecutivos (con `restarDias`, a prueba de DST) | RNF-4 |
| N11 | `etiquetasDeMes` con `hoy=2027-02-08` → «ene 2027» y «feb 2027» | RF-9 |
| N12 | `formatearFecha("abc")` → «abc», sin lanzar | RF-2 (E1) |

**Total: 24 pruebas.**

Notas (D16): `toLocaleString("es-ES")` y `Intl` requieren node con ICU completo (lo trae node ≥13 por defecto); si un entorno mínimo los fallara, es un problema de entorno, no de lógica. La propiedad de E9 se mantiene con máximos < 10000 porque su parser `Number()` no entiende el separador de miles de es-ES («12.345»); ese formato lo cubren N6/N7. Ojo con la convención RAE ya anotada en `MEMORY.md`: las 4 cifras van **sin separador** (1234 → «1234») y el millar empieza en 5 (12345 → «12.345»).

---

## 8. Verificación con Chrome DevTools

Preámbulo: **solo datos de prueba de la instancia MCP**; ninguna clave de datos reales se toca (constitución 5).

1. **Tests**: `node --test` → 24 en verde.
2. **Estado vacío**: borrar la clave `diario-estudio-sesiones` → mapa sin color, leyenda solo «0 min», lista vacía, consola limpia.
3. **Leyenda «—»**: registrar una única sesión de 3 min en toda la ventana → `max=3` → leyenda: «—», «1 min», «2 min», «3 min». Borrar de nuevo.
4. **Niveles y recálculo (RF-3)**: registrar sesiones de 60, 30 y 45 min en días pasados → comprobar tonos; registrar después 120 min → leyenda «1-29 / 30-59 / 60-89 / 90-120» y los tonos anteriores cambian (45 pasa a nivel 2).
5. **RF-10**: los textos de rachas, semana, mes y lista mantienen su formato de antes (cifras es-ES, mismos plurales) y se actualizan al registrar, como en la v5.
6. **Detalle (RF-8)**: `title` = `aria-label`; ninguna celda recibe foco con Tab.
7. **RF-11**: `inputFecha.max` = hoy → simular el día siguiente poniendo `inputFecha.max = "2000-01-01"` por consola y luego `inputFecha.focus()` → vuelve a hoy (D9); quitar el atributo (`removeAttribute("max")`), poner mañana y enviar → **no se registra nada**, el formulario conserva los valores, consola limpia (D11); con `max` presente, el navegador bloquea nativamente.
8. **RF-2/RF-4**: inyectar por consola `{"fecha":"abc", ...}` y una sesión heredada con fecha futura → celdas vacías, `max` intacto, la lista muestra «abc» tal cual, consola sin errores (requiere E1).
9. **RNF-6**: inyectar un año de sesiones (script de consola usando `fechaLocal`/`restarDias`, disponibles en la página), recargar y medir `console.time("pintar")` + `pintarTodo()` + `console.timeEnd` → por debajo de 200 ms; al final borrar solo esos datos de prueba.
10. **RNF-7 (contraste)**: script en consola que calcula el ratio WCAG de `.nivel-1..4` contra `#ffffff` → ≈3,46 / 4,47 / 5,38 / 7,90, todos ≥3; el vacío `#f0f1f7` queda exento.
11. **Móvil (RNF-2)**: `emulate({viewport:"375x812x2,mobile,touch"})` (`resize_page` no baja de 502 px en Windows) → la página no se desborda, el scroll es solo interno de `.mapa-scroll`, rótulos de día sticky. Limpiar con `viewport:""`.
12. **Umbral (RNF-2)**: medir `document.querySelector(".mapa-rejilla").scrollWidth` → contenido real **438 px** (medido; la estimación de 416 no contaba las etiquetas de mes ni la holgura de 8 px — §2). En escritorio no hay scroll (`scrollWidth === clientWidth`, 566 = 566); a 375 px sí hay scroll interno (438 > 318 del contenedor). **RF-9** se cubre con N11 (no se puede forzar la fecha en DevTools).
13. **Global**: consola sin errores en todos los pasos.

---

## 9. Cobertura: RF y RNF

| Requisito | Pruebas / verificación |
|---|---|
| RF-1 | E1, E2, E3, N9 |
| RF-2 | E4, N1, N2, N12 + §8.8 (+ enmienda E1) |
| RF-3 | E6, E7, N4, N5 + §8.4 |
| RF-4 | E4 + §8.8 |
| RF-5 | E4, N3 |
| RF-6 | E8 + §8.2 |
| RF-7 | E9, N6 + §8.3 |
| RF-8 | E10, N7 + §8.6 |
| RF-9 | E11, E12, N11 |
| RF-10 | §8.5 |
| RF-11 | N8 + §8.7 (+ enmienda E2) |
| RNF-1 | §8 |
| RNF-2 | §8.11, §8.12 |
| RNF-3 | apertura con doble clic (`file://`) |
| RNF-4 | N10 |
| RNF-5 | §8.1, §8.2, §8.9 (solo datos de prueba) |
| RNF-6 | §8.9 |
| RNF-7 | §8.10 |
| RNF-8 | `node --test` + estructura de archivos |
| RNF-9 | N6, N7 |

---

## 10. Dudas resueltas

- **Aclaración 1** (nombre «v2») y **Aclaración 2** (umbral de scroll): opciones recomendadas aprobadas por el usuario → spec v2.1.
- **QA del plan** (32 hallazgos: 11 ambigüedades, 8 contradicciones, 8 casos límite, 5 conflictos con la constitución): resueltos en §11.
- **Corrección durante la verificación**: el umbral de scroll estimado en ≈416 px medía 438 px reales (las etiquetas de mes ensanchan sus columnas); valor corregido en §2, §8.12 y D18. **Revisada y aprobada por el usuario.**

---

## 11. Decisiones del QA del plan (D1–D20)

### 11.1 Ambigüedades → decisiones (11)

| Hallazgo | Decisión |
|---|---|
| Contratos de entrada no definidos (`fechaValida`, `fechaFutura`) | **D1** string-only + ida y vuelta; **D2** no-string → `false` sin lanzar |
| `cortesDeNiveles` con `max ≤ 0` | **D3** precondición entero ≥1; filtran los llamadores |
| Dominio de `nivelDeMinutos` (¿decimales?) | **D4** enteros, garantizado por el redondeo |
| ¿De dónde sale «hoy» en el `submit`? | **D10** `fechaLocal(new Date())` en el instante del envío |
| Numeración de tests ambigua («3 (existente) + 3 nuevo») | **D14** IDs únicos E1–E12 / N1–N12 |
| RNF-6 declarado cubierto pero sin paso con un año de sesiones | **D17** paso §8.9 con inyección y medición |
| ¿Contra qué fondo se mide el contraste? | **D12** contra `#ffffff`, el color real de `.tarjeta` |
| Cómo verificar el umbral de scroll | **D13** medir `scrollWidth` + comprobación a 375 px con `emulate` (medido: 438 px, no los 416 estimados) |
| es-ES en `node --test` (¿ICU?) | **D16** nota de entorno: node ≥13 con ICU completo |
| §5 decía que los totales «llegan en es-ES desde calor.js» | **D19** llegan números enteros; es-ES solo al pintar |
| Cabecera/estado/§2 desactualizados («v2», «crear (este)», «pendiente de aclaraciones») | **D19** correcciones en este v2 |

### 11.2 Contradicciones → decisiones (8)

| Hallazgo | Decisión |
|---|---|
| `max` solo en `pintarTodo` → límite obsoleto tras la medianoche | **D9** además al enfocar/cambiar el campo; sin temporizadores |
| §8 no podía ejercitar la guarda JS (el `max` nativo la impedía) | **D11** quitar el atributo por consola antes de enviar |
| El test de recálculo exigido por RF-3 no estaba en §7 | **D15** test N5 |
| RNF-6 sin paso en §8 | **D17** paso §8.9 |
| `formatearFecha` figuraba «sin cambios» pero la verificación la toca | **D5** pasa a «Modificadas» |
| §7 presentaba como «nuevos» tests que ya existían (filas 5 y 8) | **D14** tablas separadas E/N |
| §9 apuntaba a filas/§8 que no correspondían | **D19** referencias reescritas con IDs E/N y §8 numerado |
| Estado del plan contradecía el §10 («v1 completa» vs «resueltas») | **D19** cabecera unificada |

### 11.3 Casos límite → decisiones (8)

| Caso | Decisión |
|---|---|
| `fecha` no-string (undefined/null/número) | **D1** → `false`, sin excepción (N1/N2) |
| `fechaFutura` con entradas no texto | **D2** → `false`, sin excepción (N8) |
| Total que redondea a 0 (0,4 min) | **D6** clave con 0: celda vacía, no sube `max` (N3) |
| Decimales en semana/gráfico/lista | **D7** sin cambios: RF-10 manda, solo redondea el mapa |
| Minutos ≥ 1e21 (notación exponencial JS) | **D8** fuera de alcance: poner tope sería una regla de producto nueva que la spec no pide |
| Sesión con fecha corrupta rompe `pintarLista` con `RangeError` | **D5** + enmienda **E1** (N12) |
| Sesión heredada con fecha futura | §8.8: celda vacía, `max` intacto (RF-4) |
| Entorno node sin ICU completo | **D16** nota; la autoridad es `node --test` real |

### 11.4 Conflictos con la constitución → resolución (5)

| Principio | Resolución |
|---|---|
| 2 · la spec manda | **D5** y **D9** tocan comportamiento no explícito → enmiendas **E1/E2** propuestas en §12, pendientes de aprobación; el resto son mecanismos de RF existentes |
| 4 · tests como puente | Orden garantizado: `node --test` verde primero (§8.1); contraste y medidas no son lógica → script en DevTools (§8.10/8.12), no sustituye a node |
| 5 · datos sagrados | §8 solo inyecta/borra **datos de prueba** en la instancia MCP; ninguna clave real se toca |
| 6 · idioma | Identificadores en español = excepción aprobada y anotada (cabecera + `MEMORY.md`) |
| 1 · simplicidad | Sin temporizadores (D9 usa eventos), sin archivos nuevos (E/N en el mismo test), guardas de una línea |

### 11.5 Lista final de tests nuevos

**D15**: N1–N12 de la §7 (incluyen los tests que faltaban: recálculo N5, contratos N1/N8, redondeo a 0 N3, defensa N12). **D18**: §8 con valores esperados concretos (leyenda «—» con 3 min, leyenda «1-29…90-120», ratios de contraste, `scrollWidth` = 438 medido — estimación previa 416, `<200 ms`).

---

## 12. Enmiendas a la spec (aplicadas — D20)

Texto exacto añadido a la spec (aprobado por el usuario con el plan v2; spec ahora en v2.2):

- **E1 → RF-2**, criterio nuevo: «**(Cuando)** Cuando una sesión guarda una fecha corrupta, **entonces** el resto de la aplicación sigue funcionando: la lista la muestra tal cual (sin formatear) y no se produce ningún error en consola; el mapa la sigue ignorando.»
- **E2 → RF-11**, criterio nuevo: «**(Cuando)** Cuando la aplicación lleva abierta de un día para otro, **entonces** el límite del campo de fecha vuelve a fijarse en «hoy» al usar el campo (y al repintar), de modo que nunca queda obsoleto.»

---

## 13. Fuera de alcance (v1)

- Tope de minutos en el formulario (minutos ≥1e21 en notación exponencial) — **D8**.
- Redondear o cambiar los decimales de semana, gráfico y lista — **D7**.
- Validación de entradas dentro de `rangosDeLeyenda`/`nivelDeMinutos` — filtran los llamadores (**D3/D4**).
- Consulta de minutos exactos al tocar una celda en móvil.
- Navegación por teclado entre celdas (la spec decide «sin foco»: **RF-8**).
