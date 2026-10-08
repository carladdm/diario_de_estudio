# Plan de implementación — Objetivo semanal (spec 002)

**Spec que rige**: `specs/002-objetivo-semanal/spec.md` (**v1.2, aprobada por el usuario**)
**Cumple**: `docs/constitution.md` (1 simplicidad, 2 la spec manda, 3 lógica pura, 4 tests, 5 datos sagrados, 6 idioma)
**Estado**: **v1 — pendiente de aprobación del usuario**

> Nota sobre la numeración: las decisiones de este plan son **D1…D15** (numeración propia, como en el plan de la 001); las decisiones del usuario en la spec son **D-7, D-8 y D-9** (con guion). No se confunden.
>
> La app actual es la **v6** (spec 001 implementada, `node --test` 24/24). Este plan la lleva a la **v7**.

---

## §1. Objetivo y alcance

Añadir el **objetivo semanal de estudio** aprobado en la spec 002: fijar cuántos minutos se quieren estudiar cada semana (formulario con botón) y ver el progreso de la semana en curso (texto «X de Y min» + barra + «¡Objetivo cumplido!»), todo **dentro de la tarjeta «Esta semana»**.

| ¿Qué hay ya? | ¿Qué cambia? |
|---|---|
| Tarjeta «Esta semana» con total, gráfico de 7 barras y `minutosDeLaSemana()` propia (impura, línea ~165 de `app.js`); formulario de sesión como patrón; clave `diario-estudio-sesiones` | Bloque nuevo de objetivo (formulario + progreso + barra) en esa tarjeta; clave nueva `diario-estudio-objetivo-semanal`; 6 funciones puras nuevas en `calor.js` con sus tests (O1–O12); la tarjeta **reutiliza** la nueva `minutosDeSemana(sesiones, hoy)` (la vieja se borra); rachas, mes, gráfico, mapa y lista **sin cambios** |

No se toca: la spec 001, la clave de sesiones, su formato, ni los textos existentes de ninguna tarjeta.

---

## §2. Archivos

| Archivo | Acción |
|---|---|
| `specs/002-objetivo-semanal/spec.md` | sin cambios (v1.2 aprobada) |
| `specs/002-objetivo-semanal/plan.md` | ya creado (este documento, v1) |
| `specs/002-objetivo-semanal/tasks.md` | crear (desglose T1–T24) |
| `calor.js` | modificar: nuevas `objetivoValido`, `objetivoDesdeTexto`, `minutosDeSemana`, `porcentajeDeProgreso`, `textoDeProgreso`, `objetivoCumplido` + exportarlas en `module.exports` |
| `app.js` | modificar: `CLAVE_OBJETIVO`, carga/guardado, `pintarObjetivo()`, formulario del objetivo, y la tarjeta «Esta semana» pasa a `minutosDeSemana(sesiones, hoy)` (se borra la `minutosDeLaSemana()` local) |
| `index.html` | modificar: bloque del objetivo dentro de la sección «Esta semana» |
| `styles.css` | modificar: bloque, barra y estados, con contraste 4,5:1 elegido desde el diseño |
| `tests/calor.test.js` | modificar: 24 tests existentes (se conservan) + 12 nuevos O1–O12 = **36** |
| `AGENTS.md` | modificar al final: sección «Datos» con la clave nueva |
| `MEMORY.md` | modificar al final: estado y decisiones |

---

## §3. Decisiones técnicas (D1–D15)

| # | Decisión | Por qué |
|---|---|---|
| **D1** | **Clave nueva** `diario-estudio-objetivo-semanal` cuyo valor es **un número JSON entero** (p. ej. `300`, sin comillas): `JSON.stringify(300)` / `JSON.parse` | La spec exige no tocar la clave de sesiones; un único entero es lo más simple y lo más fácil de leer para quien empieza; no hay campos que ampliar (decisión de alcance: sin histórico) |
| **D2** | La función pura se llama **`minutosDeSemana(sesiones, hoy)`**; la `minutosDeLaSemana()` de `app.js` **se borra** y su llamada se sustituye | Evita la colisión de nombres en el ámbito global compartido (calor.js y app.js son scripts clásicos) y la **duplicación de la suma**, que podría divergir; una única copia = RF-3 y RF-7 |
| **D3** | **«Sin objetivo» = `null`** en toda la lógica (como la spec): `objetivoValido` y `objetivoDesdeTexto` devuelven entero ≥1 o `null`; `textoDeProgreso` devuelve `null` sin objetivo; `objetivoCumplido` devuelve `false`; `porcentajeDeProgreso` devuelve `0` | Contrato único y testeable (RNF-4); `null` es JS «estándar» y distingue bien «no hay» de «0» |
| **D4** | Función extra **`objetivoDesdeTexto(texto)`** (pura, con `try/catch`, sin lanzar) que hace de puente entre localStorage y `objetivoValido` | Permite probar con `node --test` la lectura de la clave corrupta (RF-2) en lugar de dejarlo solo en DevTools; `app.js` no contiene lógica, solo integra (principio 3) |
| **D5** | Estado del objetivo en `app.js`: global **`objetivoSemanal`** + `cargarObjetivo()` / `guardarObjetivo()` con `try/catch`, **espejo exacto** de `cargarSesiones`/`guardarSesiones` | Mismo patrón que ya funciona; quien empieza a programar reconoce el esquema; `try/catch` evita que un localStorage bloqueado rompa la página |
| **D6** | **No se borra** el valor corrupto de la clave: se ignora al leer (`null`) y solo se sobrescribe si el usuario guarda un objetivo nuevo | Datos sagrados (principio 5): borrar sería destruir un dato del usuario sin permiso |
| **D7** | El objetivo se confirma con **`<form>` propio** (id `formulario-objetivo`) con campo `type="number"` y botón «Guardar objetivo»; se reutilizan las clases `.campo` y `button` existentes | **D-7 del usuario**: el Enter lo aporta de serie el `<form>` con botón `submit`; misma validación nativa y mismo aspecto que «Nueva sesión» sin CSS nuevo para el formulario |
| **D8** | El campo va **sin separador de miles** (`100000`): es `type="number"`, que no admite «100.000»; el es-ES con punto queda **solo** para textos (progreso, mensajes) | RNF-8 y RF-1.5: si el campo llevara el punto, el navegador lo dejaría vacío/inválido y no se podría guardar |
| **D9** | `pintarObjetivo()` se llama desde `pintarTodo()`, pero **nunca escribe en el campo**: el campo se rellena **solo al abrir** la página y **tras guardar** | RF-5.6 / P9: un tecleo sin confirmar no se pierde ni se confunde con el objetivo guardado |
| **D10** | La barra es un `div` con **HTML/CSS puro**: pista + relleno con `width` en % (entero de `porcentajeDeProgreso`); lleva `role="img"` + `aria-label` con el mismo texto «X de Y min» | Sin canvas ni librerías (principio 1); sigue el ejemplo literal de RNF-6 (D-9) |
| **D11** | Paleta elegida **desde el diseño** para 4,5:1: texto principal `#1f2430` (≈15,5:1 vs blanco), texto secundario y estado vacío `#6b7280` (≈4,8:1), «¡Objetivo cumplido!» y relleno de la barra `#4f46e5` (≈6,3:1; relleno vs pista `#e6e8f0` ≈5,1:1), pista `#e6e8f0` decorativa | RNF-6: los valores van **calculados de origen** (no una enmienda a posteriori como en la 001); son los colores que la app ya usa, así nada choca. Se **miden** en DevTools (§8.10) y se anotan los reales |
| **D12** | Regla de fechas **idéntica a la tarjeta**: `minutosDeSemana` suma `sesión.fecha ≥ lunes && ≤ hoy` + `minutosValidos` (**sin** `fechaValida`), con lunes por `(getDay() + 6) % 7` y `restarDias` | El total y el gráfico (`minutosPorDia` con `esDeLaSemana`) deben coincidir siempre (RF-3, RF-7); cualquier regla «más estricta» en un solo lado divergiría (p. ej. una fecha «2026-10-7» heredada) |
| **D13** | Los tests nuevos llevan IDs **O1–O12** (de «Objetivo») y se añaden al mismo `tests/calor.test.js` | Numeración única como en la 001 (E–N); la «O» no choca con las existentes; **36 tests** en total |
| **D14** | Decimales heredados: el texto los muestra **tal cual con coma es-ES** («90,5 de 300 min»), **sin redondear**; solo el ancho de la barra se redondea (`Math.round`, entero 0–100) | RF-3 (cifras exactas) + P8/P14: el redondeo sería pérdida de información en el texto; la barra necesita un entero determinista |
| **D15** | **Sin temporizadores** ni listeners nuevos de ciclo de vida: todo el repintado va dentro de `pintarTodo()`; los únicos listeners nuevos son los `submit` del formulario del objetivo | Igual que el resto de la app (RF-3, RF-6) y para no repetir el hallazgo de temporizadores de la 001 |

---

## §4. Estructura de datos

- **Clave**: `diario-estudio-objetivo-semanal` (nueva, junto a la existente `diario-estudio-sesiones`).
- **Valor exacto**: un **número JSON entero ≥ 1**, p. ej. `300` (sin comillas). Se escribe con `JSON.stringify(objetivo)` y se lee con `JSON.parse`.
- **Clave de sesiones**: **intocable** (principio 5); este plan no la lee ni la escribe.

Regla de compatibilidad — todo caso se resuelve como **«sin objetivo» = `null`**, sin borrar la clave (D6):

| Valor almacenado | Lectura | Resultado |
|---|---|---|
| clave ausente | `getItem` → `null` | `null` (estado vacío, caso normal) |
| `300` | `parse` → `300` | `300` |
| `""` (vacía) | `parse` lanza | `null` |
| `abc` (texto corrupto) | `parse` lanza | `null` (sin error en consola: `try/catch`) |
| `"300.5"` | `parse` → `300.5` | `null` (decimal, RF-2/P3) |
| `"0"`, `"-5"` | `parse` → número | `null` (entero ≥1 exigido) |
| `"null"` | `parse` → `null` | `null` |
| `"\"300\""` (cadena JSON) | `parse` → `"300"` (texto) | `null` |
| `"{}"` | `parse` → objeto | `null` |
| valor corrupto con el sistema en modo privado (`getItem` lanza) | `try/catch` | `null` |

Si el usuario guarda un objetivo nuevo, la clave se sobrescribe con el entero válido (único momento en que se escribe).

---

## §5. Contratos de las funciones puras (`calor.js`)

Todas: sin DOM, sin `localStorage`, **sin lanzar excepciones** con entradas corruptas; «sin objetivo» = `null` (D3).

| Función | Entrada | Salida |
|---|---|---|
| `objetivoValido(valor)` | cualquier valor | entero ≥ 1 o `null` (texto, `300.5`, `0`, negativos, `NaN`, `Infinity`, `null`, `undefined`, objetos → `null`) |
| `objetivoDesdeTexto(texto)` | texto de la clave (o cualquier cosa) | entero ≥ 1 o `null`; `JSON.parse` con `try/catch`; sin lanzar (D4) |
| `minutosDeSemana(sesiones, hoy)` | array de sesiones + `hoy` `AAAA-MM-DD` | número ≥ 0: suma de `minutos` válidos de lunes a `hoy` de la semana local de `hoy` (mismas reglas que la tarjeta, D12); sesiones basura (`null`, sin objeto) se ignoran sin lanzar |
| `porcentajeDeProgreso(minutos, objetivo)` | números (o basura) | **entero** 0–100 con `Math.round`, con tope; `objetivo` no válido → `0`; `minutos` no finito o < 0 → `0`; sin división por cero (P8) |
| `textoDeProgreso(minutos, objetivo)` | números (o basura) | `«X de Y min»` en es-ES (coma decimal: «90,5 de 300 min»; «12.345 de 100.000 min») o **`null`** si el objetivo no es válido (RNF-8, P14) |
| `objetivoCumplido(minutos, objetivo)` | números (o basura) | `true` si `minutos ≥ objetivo`; objetivo no válido o minutos no numéricos → `false` (D-8: `300` de `300` cuenta) |

### §5.1 Pseudocódigo (sin código real)

```
minutosDeSemana(sesiones, hoy):
  si typeof hoy !== "string" → 0
  fechaHoy ← fechaDesdeTexto(hoy)              // local, nunca new Date("AAAA-MM-DD")
  diasDesdeLunes ← (fechaHoy.getDay() + 6) % 7
  lunes ← fechaLocal(restarDias(fechaHoy, diasDesdeLunes))
  total ← 0
  para cada sesión:                             // con guarda: si no es objeto → saltar
    si sesión.fecha >= lunes y sesión.fecha <= hoy y minutosValidos(sesión.minutos):
      total ← total + sesión.minutos
  devolver total

pintarObjetivo():                              // llamada SIEMPRE desde pintarTodo()
  si objetivoSemanal === null → mostrar #objetivo-vacio, ocultar bloque de progreso
  si no:
    minutos ← minutosDeSemana(sesiones, fechaLocal(new Date()))
    texto ← textoDeProgreso(minutos, objetivoSemanal)
    pintar texto; barra.width ← porcentajeDeProgreso(minutos, objetivoSemanal) + "%"
    barra.aria-label ← texto                   // equivalente textual (D-10)
    mostrar #objetivo-cumplido solo si objetivoCumplido(minutos, objetivoSemanal)
  // NUNCA escribe en el campo (D9)
```

---

## §6. Cambios por fichero (sin código)

### `index.html`
- Dentro de la sección «Esta semana», **al final** (tras el gráfico, para no alterar la lectura actual de la tarjeta), un bloque con:
  - `<form id="formulario-objetivo">`: `<label>` («Objetivo semanal»), `<input type="number" id="objetivo-minutos" name="objetivo" min="1" step="1" required>` y `<button type="submit">Guardar objetivo</button>`.
  - Estado vacío (p. ej. `#objetivo-vacio`, con `hidden` cuando no procede).
  - Bloque de progreso: texto «X de Y min» (`#objetivo-texto`), barra (`#objetivo-barra`, `role="img"` + `aria-label`) y mensaje `#objetivo-cumplido` («¡Objetivo cumplido!», oculto por defecto).

### `styles.css`
- Bloque `.objetivo` (separación vertical dentro de la tarjeta), texto `.objetivo-texto`, estado vacío `.objetivo-vacio`, mensaje `.objetivo-cumplido` y barra (`.objetivo-barra` pista + `.objetivo-barra-relleno`), con la paleta de **D11** (4,5:1 desde el diseño).
- Ancho del relleno: lo pone JS en línea (`width: NN%`), como ya hace el gráfico con la altura.
- Sin animaciones nuevas; sin cambios en el resto de selectores (en el bloque `@media (max-width: 480px)` solo si hace falta, comprobando a 375 px).

### `calor.js`
- Nuevas: `objetivoValido`, `objetivoDesdeTexto`, `minutosDeSemana`, `porcentajeDeProgreso`, `textoDeProgreso`, `objetivoCumplido` (§5).
- `minutosDeSemana` reutiliza las helper de fechas ya existentes (`fechaDesdeTexto`, `fechaLocal`, `restarDias`, `minutosValidos`); **ninguna fecha con `toISOString()` ni `new Date("AAAA-MM-DD")`**.
- Añadirlas al bloque `module.exports`.

### `app.js`
- `const CLAVE_OBJETIVO = "diario-estudio-objetivo-semanal"` junto a la `CLAVE` actual (**sin renombrarla**).
- `let objetivoSemanal = cargarObjetivo()` + `cargarObjetivo()`/`guardarObjetivo()` con `try/catch` (D5), usando `objetivoDesdeTexto`.
- Referencias a los elementos nuevos del bloque del objetivo.
- `pintarObjetivo()` (§5.1) llamada **dentro** de `pintarTodo()`.
- `rellenarCampoObjetivo()` (rellena el campo con `String(objetivoSemanal)`): se llama **solo** al cargar y tras guardar (D9).
- `submit` del `formulario-objetivo`: `preventDefault`, `objetivoValido(Number(campo.value))`; si `null` → return (guarda JS redundante a la nativa); si no → asignar global, `guardarObjetivo`, `rellenarCampoObjetivo()`, `pintarTodo()`.
- **Tarjeta «Esta semana»**: `pintarSemana()` pasa a usar `minutosDeSemana(sesiones, fechaLocal(new Date()))` y se **borra** la función `minutosDeLaSemana()` local (D2). `minutosPorDia()` y `esDeLaSemana()` del gráfico **no cambian**.

### `tests/calor.test.js`
- 12 tests nuevos **O1–O12** (§7), siguiendo el estilo existente: bloques comentados por RF, nombres descriptivos en español, `assert` de `node:assert/strict`, fechas de ejemplo con `hoy` inyectado.

---

## §7. Estrategia de pruebas (`node --test`)

IDs únicos **O1–O12** (D13); los 24 existentes **no se tocan**. Total esperado: **36**.

| ID | Prueba | RF |
|---|---|---|
| O1 | `objetivoValido`: 300 → 300; 1 → 1; `0`, `-5`, `300.5`, `"300"`, `""`, `null`, `undefined`, `{}`, `NaN`, `Infinity` → `null` **sin lanzar** | RF-1, RF-2 |
| O2 | `objetivoDesdeTexto`: `"300"` → 300; `"0"`, `"-5"`, `"300.5"`, `"abc"`, `""`, `"null"`, `"{}"`, `"\"300\""`, `undefined` → `null`, sin lanzar (con `try/catch`) | RF-2 |
| O3 | `minutosDeSemana` con `hoy="2026-10-08"`: sesiones lun 5 (60) + mar 6 (30) → 90; excluye domingo 4 anterior, viernes 9 futuro y minutos corruptos | RF-3 |
| O4 | Semana según `hoy`: lunes `2026-10-05` → solo lunes; domingo `2026-10-11` → semana completa (5–11); sesión del lunes anterior no cuenta | RF-3, RF-5, RF-6 |
| O5 | Cambio de hora: `hoy="2026-10-25"` → semana `2026-10-19`…`2026-10-25`; `hoy="2027-03-28"` → `2027-03-22`…`2027-03-28`; totales correctos en ambos | RNF-2 |
| O6 | `porcentajeDeProgreso`: (90,300)→30; (100,300)→33; (0,300)→0; (320,300)→100 y (500,300)→100 (tope); objetivo `null`/basura → 0; minutos basura → 0 | RF-4 |
| O7 | `textoDeProgreso`: (90,300) → «90 de 300 min»; (12345,100000) → «12.345 de 100.000 min»; (1234, 5678) → «1234 de 5678 min»; (90.5,300) → «90,5 de 300 min»; objetivo `null` → `null` | RF-3, RNF-8 |
| O8 | `objetivoCumplido`: (300,300)→true; (320,300)→true; (299,300)→false; (90.5,90)→true; objetivo `null` → false | RF-4, D-8 |
| O9 | Semana vacía: `minutosDeSemana([], hoy)` → 0; `textoDeProgreso(0,300)` → «0 de 300 min»; `porcentajeDeProgreso(0,300)` → 0; `objetivoCumplido(0,300)` → false | RF-6 |
| O10 | Coherencia con la tarjeta: para un lote de sesiones (válidas, corruptas, futuras y decimales), `minutosDeSemana` = suma de los totales diarios del lunes a `hoy` con la misma regla que `minutosPorDia` | RF-3, RF-7 |
| O11 | «Nunca lanzan»: las 6 funciones con entradas basura (`undefined`, `null`, `"x"`, `{}`, arrays con `null` dentro) devuelven el contrato sin excepción | RNF-4 |
| O12 | Recálculo al editar: mismos `minutos=90`, objetivo 300 → «90 de 300 min», 30 %, false; objetivo 200 → «90 de 200 min», 45 %, false (90 < 200, aún no cumple); objetivo 80 → «90 de 80 min», 100 % (tope), true | RF-5 |

Lo que **no** se testea con node (queda en §8, verificación DevTools): validación nativa del formulario, persistencia real en localStorage, pintado del DOM, `aria-label`, contraste medido, vista móvil y consola.

---

## §8. Verificación con Chrome DevTools (MCP)

Preámbulo: **solo datos de prueba de la instancia MCP**; ninguna clave real se toca (constitución 5). Al empezar: Application → Local Storage → borrar `diario-estudio-objetivo-semanal` (y, si se quiere el caso más duro, también `diario-estudio-sesiones`).

1. **Tests**: `node --test` → **36 en verde** (24 + O1–O12). Primero, siempre (principio 4).
2. **Estado vacío (RF-1)**: con la clave borrada → en «Esta semana», el estado vacío invita a fijar el objetivo junto al campo y el botón; **sin** progreso, **sin** barra; consola limpia.
3. **Guardar y persistir (RF-1, RF-2, D-7)**: escribir `300` y pulsar «Guardar objetivo» (y luego con **Enter**) → clave `diario-estudio-objetivo-semanal` = `300` (entero JSON); progreso «0 de 300 min» con barra 0 %; recargar → sigue ahí sin volver a pedirlo; clave `diario-estudio-sesiones` **idéntica a antes** (comparar su JSON antes/después).
4. **Progreso (RF-3, RF-7)**: registrar sesiones de 60 (lunes 2026-10-05) y 30 (martes) con el formulario → «90 de 300 min» y barra al **30 %**; el total de la tarjeta («90») **coincide con la suma de las 7 barras** del gráfico; **no aparece ningún «%» como texto**.
5. **Edición sin pisar (RF-5, D9)**: cambiar el objetivo a `200` y guardar → «90 de 200 min» al instante (45 %, con mensaje si procede); a continuación teclear `250` **sin guardar** y registrar una sesión → el campo **sigue mostrando 250**; recargar → el campo vuelve a `200` (el valor guardado).
6. **«¡Objetivo cumplido!» (RF-4, D-8)**: con objetivo 300, llevar el total a 299 → **sin** mensaje; a 300 → «300 de 300 min» **con** mensaje y barra 100 %; a 320 → «320 de 300 min», barra 100 % y mensaje. *Verificado el 2026-10-08 con el progreso real de la semana = **100 min** (adaptación de la semántica idéntica): objetivo **211** → «100 de 211 min», barra **47 %**, sin mensaje; objetivo **100** → «100 de 100 min», barra **100 %**, con mensaje (igualdad exacta, D-8); objetivo **90** → «100 de 90 min», barra **100 %** (tope), con mensaje; al volver a bajar el objetivo a 211, el mensaje **desaparece** al repintar (recálculo bidireccional). Consola limpia en cada paso. Estado final dejado: 3 sesiones + objetivo **90**.*
7. **Valores límite (RF-1, RF-2, RNF-8, P10)**: quitando `min`/`step` por consola (`removeAttribute`), intentar objetivo `0` y campo vacío → la **guarda JS** corta el envío (la clave no cambia); escribir `"300.5"` a mano en la clave → estado vacío y consola limpia; objetivo `100000` → campo `100000` (sin punto) y texto «100.000 min».
8. **Decimales heredados (RF-3, P14)**: inyectando por consola una sesión de `90,5` minutos de esta semana con objetivo `90` → «90,5 de 90 min» y «¡Objetivo cumplido!»; al final borrar solo esa sesión de prueba.
9. **Stats existentes intactos (RF-7)**: racha, mejor racha, semana, mes, gráfico, mapa y lista conservan **exactamente** sus textos de la v6 (mismas cifras es-ES y plurales) y siguen actualizándose al registrar una sesión.
10. **Accesibilidad y contraste (RNF-6, D-9/D11)**: la barra tiene `role="img"` y `aria-label` = al texto visible; script en consola que calcule el ratio WCAG de los textos contra `#ffffff`: previstos **≈15,5** (`#1f2430`), **≈4,8** (`#6b7280`), **≈6,3** (`#4f46e5`) y relleno vs pista **≈5,1**, todos ≥4,5 (≥3 para la relación gráfica); **anotar los valores medidos reales\n     - **Medido (2026-10-08)**: texto objetivo (#1f2430 vs blanco) ~15.52:1; estado vacio (#6b7280 vs blanco) ~4.83:1; relleno (#4f46e5) vs pista (#e6e8f0) ~5.14:1; relleno (#4f46e5) vs blanco ~6.29:1; exito (#4f46e5 vs blanco) ~6.29:1. Todos >=4,5:1.** aquí al verificarlos.
11. **Móvil 375 px (RNF-7)**: `emulate({viewport:"375x812x2,mobile,touch"})` (`resize_page` no baja de 502 px en Windows) → la tarjeta «Esta semana» con su bloque del objetivo **no desborda** horizontalmente, el formulario es usable y el gráfico sigue viéndose; limpiar con `viewport:""`.
12. **Rendimiento (RNF-9)**: inyectar ~365 sesiones, medir `console.time("pintar")` + `pintarTodo()` + `console.timeEnd` → **<200 ms**; borrar solo esos datos de prueba (comprobando el recuento).
13. **Cierre (RNF-1, RNF-3)**: abrir `index.html` con doble clic (`file://`): todo el bloque del objetivo en **español** y **consola sin errores** en todos los pasos anteriores.

> Nota sobre fechas: el cambio de semana con la app abierta (RF-6) **no se puede forzar** en DevTools (no se puede cambiar el reloj del sistema); queda cubierto por O4 con distintos `hoy` y por el hecho de que `pintarObjetivo` recalcula en cada `pintarTodo()`, sin temporizadores (D15).

---

## §9. Cobertura: RF y RNF

| Requisito | Pruebas / verificación |
|---|---|
| RF-1 | O1, O2 · §8.2, §8.3 |
| RF-2 | O1, O2 · §8.3, §8.7 |
| RF-3 | O3, O4, O7, O9, O10 · §8.4 |
| RF-4 | O6, O8, O9 · §8.6 |
| RF-5 | O12 · §8.5 |
| RF-6 | O4, O9 · §8.3 + nota de §8 (semana) |
| RF-7 | O10 · §8.4, §8.9 |
| RNF-1 | §8.13 |
| RNF-2 | O5 |
| RNF-3 | §8.13 |
| RNF-4 | O1–O12 · `node --test` |
| RNF-5 | §8.3, §8.9 |
| RNF-6 | §8.10 |
| RNF-7 | §8.11 |
| RNF-8 | O7 · §8.7 |
| RNF-9 | §8.12 |

---

## §10. Riesgos y cuidados

1. **Romper la tarjeta «Esta semana»** al sustituir `minutosDeLaSemana()` → mitigación: O10 (coherencia), §8.4 (total = suma de barras) y §8.9 (textos idénticos). La función vieja se **borra** para no dejar dos copias en el ámbito global (D2).
2. **Tocar la clave de sesiones** → este plan solo la lee para sumar; §8.3 compara su JSON antes/después.
3. **Fechas en UTC** → prohibido `toISOString()` y `new Date("AAAA-MM-DD")`; semana con `fechaDesdeTexto` + `(getDay() + 6) % 7` + `restarDias` (checklist de §11).
4. **División por cero / objetivo corrupto** → todos los contratos filtran con `null` antes (O1, O6, O11).
5. **Contraste tardío** → la paleta se elige cumpliendo 4,5:1 **de origen** (D11) y se mide en §8.10.
6. **Pisar lo tecleado** → `pintarObjetivo` no toca el campo (D9); §8.5 lo verifica.
7. **Nativa vs guarda JS** → la guarda JS es la red de seguridad verificable quitando los atributos (§8.7), como en la 001.
8. **Tests en rojo** → prohibido avanzar: `node --test` verde antes del bloque B (T7) y al final (§8.1).

---

## §11. Checklist de la skill de fechas (`.agents/skills/local-dates/SKILL.md`)

- [x] **¿Algún `toISOString()` o `new Date("AAAA-MM-DD")`?** → No: «hoy» se obtiene con `fechaLocal(new Date())` y la semana se compara como textos `AAAA-MM-DD` (§5.1, D12).
- [x] **¿Algún cálculo con 86400000 milisegundos?** → No: el lunes sale de `(getDay() + 6) % 7` + `restarDias()`; la semana entera se compara por rangos de texto.
- [x] **¿Qué pasa con una sesión registrada a las 00:30?** → Nada: todo es por día **local**; el corte lunes–hoy no mira horas, así que una sesión a las 00:30 del martes cuenta el martes.
- [x] **¿Qué pasa el día del cambio de hora?** → Cubierto por **O5** (`hoy` = 2026-10-25 y 2027-03-28): mismas fronteras de semana, sin milisegundos.
- [x] **¿Se ignoran las fechas futuras donde corresponde?** → Sí: `sesión.fecha <= hoy` en `minutosDeSemana` (RF-6), probado en **O3/O4**; el formulario de sesión sigue bloqueando fechas futuras (RF-11 de la 001, intacto).

---

## §12. Fuera de alcance y estado

- Todo lo que la spec 002 marca como fuera de alcance (objetivos diarios/múltiples, notificaciones, histórico, % en texto, borrar por interfaz, backend…).
- No se modifica la spec 001 ni ninguna funcionalidad existente más allá de la sustitución interna de `minutosDeLaSemana()` (D2), que **no cambia ningún texto**.

**Estado**: v1 **pendiente de aprobación del usuario**. Tras aprobarla: crear `tasks.md` (T1–T24) y empezar por el bloque A (`node --test` en verde).
