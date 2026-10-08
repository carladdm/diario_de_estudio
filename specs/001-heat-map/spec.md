# Especificación — Mapa de calor de las últimas 26 semanas

**ID**: `001-heat-map`
**Estado**: **Aprobada** (v2: revisión QA aplicada; v2.1: decisiones de la fase de planificación confirmadas; v2.2: enmiendas E1/E2 del QA del plan confirmadas)
**Rige sobre**: `docs/constitution.md` (principios innegociables)

---

## Contexto y objetivo

El Diario de Estudio muestra ya el hábito a corto plazo: racha actual, mejor racha, minutos de la semana con su gráfico de barras y días estudiados del mes. Lo que falta es la visión **larga**: saber cómo ha sido el estudio en los últimos meses de un solo vistazo — sus semanas intensas, sus rachas y sus huecos.

El objetivo es añadir un **mapa de calor tipo GitHub**: una cuadrícula donde cada celda es un día, cada columna una semana, y **cuantos más minutos se estudió ese día, más intenso es su color**. Responde a la pregunta "¿de verdad estoy estudiando tantas semanas seguidas como me dice la racha?" y sirve de motivación al ver el conjunto.

### Decisiones de la fase de preguntas

| Decisión | Respuesta elegida |
|---|---|
| Ventana de tiempo | Últimas **26 semanas** estilo GitHub (columnas completas de lunes a domingo, terminando en la semana en curso) |
| Escala de color | **Relativa al máximo** de minutos del periodo (no umbrales fijos): si sube el máximo, se recalculan todos los colores |
| Niveles | **5 niveles estilo GitHub**: vacío + 4 tonos con cortes en el 25 / 50 / 75 % del máximo |
| Días futuros | **Vacías** como GitHub: la semana actual se muestra completa y los días que aún no llegan no se pintan |
| Encaje en móvil | Decisión del redactor: celdas de tamaño fijo con desplazamiento horizontal **dentro** del mapa solo si no caben (ver RNF-2) |

### Decisiones de la revisión QA (v2)

| Hallazgo | Solución aprobada |
|---|---|
| «Se navega con teclado» indefinido | Detalle al puntero (escritorio) + equivalente textual por celda para lector de pantalla, **sin foco ni navegación por teclado** |
| Formato de rótulos | Días abreviados a 3 letras («lun», «mié», «dom»); meses abreviados («ene»…«dic»); todo en español |
| Minutos no enteros | Se aceptan en la suma y el total del día se redondea al entero más cercano **solo para pintar**; no se descarta ninguna sesión |
| Leyenda con niveles inalcanzables | Los 5 estados se muestran siempre; los rangos que no existen para `max` se etiquetan **«—»** |
| Sesiones con fecha futura creadas por el formulario | El formulario **no admite fechas posteriores a hoy** (RF-11); las que ya existan son «dato heredado» |
| Actualización de la ventana | Solo al pintar (abrir o registrar); **sin temporizadores** |

### Decisiones de la fase de planificación

| Hallazgo | Solución aprobada |
|---|---|
| RNF-7 literal era imposible (el vacío medía 1,13:1 sobre blanco) | El contraste **3:1 se exige a los 4 tonos con color**; el estado vacío queda exento (su significado lo aportan leyenda y texto equivalente). Paleta ajustada: `#767ef5` / `#6366f1` / `#5457e8` / `#4338ca` |
| Umbral de scroll de RNF-2 (390 px) ignoraba rótulos y holgura | El umbral se mide sobre **la rejilla completa (rótulos + 26 columnas + holgura, ≈416 px)** |

---

## Usuarios

1. **Persona estudiante** (usuario único): quiere mantener el hábito y verse progresar; consulta la app sobre todo desde el móvil, con pantalla pequeña.
2. **Persona que usa lector de pantalla**: debe poder interpretar el mapa sin ver los colores (HU-6).

---

## Historias de usuario

- **HU-1**: Como estudiante, quiero ver mis últimas 26 semanas en una cuadrícula de color, para reconocer mi hábito de un vistazo.
- **HU-2**: Como estudiante, quiero que los días con más minutos tengan el color más intenso, para distinguir mis mejores días y mis huecos.
- **HU-3**: Como usuaria móvil, quiero poder desplazarme por las semanas cuando no caben, para que la página no se rompa ni se vuelva ilegible.
- **HU-4**: Como estudiante, quiero una leyenda con rangos de minutos, para interpretar los colores sin tener que adivinarlos.
- **HU-5**: Como estudiante, quiero consultar los minutos exactos de un día con el puntero (en escritorio), para no tener que estimarlos por el tono.
- **HU-6**: Como persona que usa lector de pantalla, quiero que cada celda ofrezca su fecha y minutos como texto, para interpretar el mapa sin ver los colores.

---

## Requisitos funcionales

### RF-1 — El mapa cubre las últimas 26 semanas completas

Criterios de aceptación:

- **(Dado / Ubicua)** Dada la fecha `hoy` (texto `AAAA-MM-DD` en zona local), cuando la aplicación pinta el mapa, entonces la ventana se calcula a partir de `hoy`; el mapa se muestra haya o no sesiones registradas.
- **(Cuando)** Cuando se muestra el mapa, entonces las columnas se ordenan cronológicamente de izquierda a derecha y cada columna es una semana completa de lunes a domingo; hay 26 columnas (182 celdas).
- **(Dado / Cuando)** Dado que hoy es miércoles 7 de octubre de 2026, cuando se pinta el mapa, entonces la ventana abarca del lunes 13 de abril de 2026 al domingo 11 de octubre de 2026.
- **(Cuando)** Cuando el mapa se vuelve a pintar (al abrir o al registrar una sesión), entonces la ventana se recalcula a partir de `hoy`; si la aplicación permanece abierta al cambiar de semana, la ventana avanza en el siguiente repintado o recarga. No hay actualización automática por temporizador.
- **(Cuando)** Cuando una sesión registrada tiene fecha anterior al lunes de inicio de la ventana, entonces no modifica el mapa ni la ventana.

### RF-2 — Cada celda representa un día y su total de minutos

Criterios de aceptación:

- **(Cuando)** Cuando un día tiene una o varias sesiones, entonces su celda representa la suma de los minutos **válidos** de todas ellas (se definen en RF-5).
- **(Dado / Cuando)** Dado que el 5 de octubre de 2026 hay dos sesiones de 60 y 30 minutos, cuando se calcula la celda de ese día, entonces representa 90 minutos.
- **(Cuando)** Cuando un día no tiene sesiones, entonces su celda no tiene minutos asociados y se pinta como vacía.
- **(Cuando)** Cuando dos sesiones comparten la misma fecha de texto (`AAAA-MM-DD`), entonces cuentan como un único día.
- **(Si — comportamiento no deseado)** Si una sesión tiene una fecha que no es un texto `AAAA-MM-DD` válido (p. ej. «abc» o «2026-13-45»), entonces se ignora en el mapa: no aporta minutos a ninguna celda ni a `max`.
- **(Cuando)** Cuando una sesión guarda una fecha corrupta, entonces el resto de la aplicación sigue funcionando: la lista la muestra tal cual (sin formatear) y no se produce ningún error en consola; el mapa la sigue ignorando.

### RF-3 — La intensidad es relativa al máximo del periodo, en 5 niveles

Criterios de aceptación:

- **(Dado / Cuando)** Dado que `max` es el mayor total diario entero de los días no futuros de la ventana, se definen los cortes `c₁ = ⌈max/4⌉`, `c₂ = ⌈max/2⌉` y `c₃ = ⌈3·max/4⌉`, y `N` es el total entero de un día pintable, cuando se calcula el nivel, entonces: vacío si `N = 0`; nivel 1 si `N < c₁`; nivel 2 si `c₁ ≤ N < c₂`; nivel 3 si `c₂ ≤ N < c₃`; nivel 4 si `N ≥ c₃`. (Para minutos enteros, los cortes enteros coinciden exactamente con los porcentajes 25 / 50 / 75 %.)
- **(Dado / Cuando)** Dado que `max = 60` minutos (`c₁ = 15`, `c₂ = 30`, `c₃ = 45`), cuando un día tiene 45 minutos, entonces recibe el nivel 4.
- **(Cuando)** Cuando dos días **pintables** de la ventana tienen el mismo total de minutos, entonces reciben el mismo nivel de color.
- **(Cuando)** Cuando se registra una sesión que cambia el total de un día o el máximo del periodo, entonces en el siguiente repintado (dado `hoy`) se recalculan todos los niveles.
- **(Si — comportamiento no deseado)** Si un valor `N` cae justo en un corte (`c₁`, `c₂` o `c₃`), entonces pertenece al nivel superior.

### RF-4 — Los días futuros nunca se pintan

Criterios de aceptación:

- **(Si — comportamiento no deseado)** Si un día de la ventana aún no ha llegado, entonces su celda aparece vacía, aunque exista una sesión con fecha futura; los minutos de esa sesión **no cuentan en `N` ni en `max`**. Es un dato heredado o anómalo: la sesión permanece intacta en el almacén y solo se ignora al pintar (RNF-5).
- **(Dado / Cuando)** Dado que hoy es miércoles 7 de octubre de 2026, cuando se pinta la última columna, entonces jueves, viernes, sábado y domingo de esa semana están vacíos.

### RF-5 — Solo cuentan minutos numéricos mayores que cero

Criterios de aceptación:

- **(Si — comportamiento no deseado)** Si una sesión tiene minutos que no son un número mayor que cero (texto, cero o negativo), entonces se ignora al calcular la celda.
- **(Dado / Cuando)** Dado que un día tiene sesiones válidas y otras corruptas, cuando se calcula la celda, entonces solo suman las válidas; si el total válido es 0, la celda queda vacía.
- **(Cuando)** Cuando el total de un día contiene decimales (dato heredado), entonces se redondea al entero más cercano solo para pintar; ninguna sesión se descarta por tener decimales.

### RF-6 — Ventana sin minutos: mapa completamente vacío

Criterios de aceptación:

- **(Si — comportamiento no deseado)** Si la ventana no contiene ningún minuto válido, entonces todas las celdas aparecen vacías y la leyenda no muestra rangos de color (solo el estado vacío).
- **(Si — comportamiento no deseado)** Si no existe un máximo (`max = 0`), entonces no hay división por cero ni errores: el mapa sale vacío.

### RF-7 — Leyenda de niveles

Criterios de aceptación:

- **(Si)** Si el periodo tiene minutos (`max > 0`), entonces la leyenda muestra los 5 estados, ordenados de menos a más intenso (vacío a la izquierda, nivel 4 a la derecha).
- **(Cuando)** Cuando la leyenda muestra los 5 estados, entonces el estado vacío está etiquetado «0 min» y cada tono indica su rango absoluto entero derivado de los cortes: `1–(c₁−1)`, `c₁–(c₂−1)`, `c₂–(c₃−1)` y `c₃–max` (los mismos cortes que RF-3, con los números en formato es-ES, p. ej. «1-14 min»).
- **(Dado / Cuando)** Dado que `max = 10` (`c₁ = 3`, `c₂ = 5`, `c₃ = 8`), cuando se muestra la leyenda, entonces los rangos son «1-2 min», «3-4 min», «5-7 min» y «8-10 min».
- **(Cuando)** Cuando un tono no tiene rango posible para el `max` actual (p. ej. `max < 4` deja niveles inalcanzables), entonces su leyenda se etiqueta «—»; la leyenda siempre presenta los 5 estados.
- **(Si)** Si el periodo no tiene minutos, entonces la leyenda solo indica el estado vacío (sin rangos de color).

### RF-8 — Consulta del detalle de una celda

Criterios de aceptación:

- **(Cuando)** Cuando el usuario coloca el cursor sobre una celda, entonces se muestra su fecha en español y sus minutos, por ejemplo: «7 de octubre de 2026: 45 min». El ejemplo es ilustrativo; lo exigible es que el texto lleve la fecha larga en español y los minutos en formato es-ES.
- **(Cuando)** Cuando la celda está vacía, entonces el detalle indica ese día sin minutos estudiados, por ejemplo: «7 de octubre de 2026: sin minutos».
- **(Cuando)** Cuando una celda se lee con lector de pantalla, entonces ofrece la misma fecha y minutos como texto equivalente al color (atributo de accesibilidad por celda). No se añaden puntos de foco ni navegación con teclado (RNF-3).
- **(Fuera de alcance)** En móvil no hay detalle al tocar: el mapa se interpreta con color + leyenda.

### RF-9 — Orientación del mapa (día y mes)

Criterios de aceptación:

- **(Cuando)** Cuando se muestra el mapa, entonces las filas llevan el rótulo del día de la semana **abreviado a 3 letras en minúscula** («lun», «mar», «mié», …, «dom»), en español.
- **(Cuando)** Cuando la ventana contiene varios meses, entonces aparece una etiqueta de mes abreviada en minúscula («ene», «abr», …, «dic») que permite situar las semanas en el calendario; cada mes representado tiene al menos una etiqueta.
- **(Cuando)** Cuando la ventana cruza un año (p. ej. de septiembre a marzo), entonces **todas** las etiquetas de meses pertenecientes a un año distinto del año inicial de la ventana llevan el año (p. ej. «ene 2027», «feb 2027»).

### RF-10 — Ubicación y no interferencia

Criterios de aceptación:

- **(Cuando)** Cuando la aplicación se abre, entonces el mapa aparece después de la sección «Este mes» y antes del formulario «Nueva sesión».
- **(Cuando)** Cuando se pinta el mapa, entonces racha actual, mejor racha, semana, mes y lista se calculan exactamente igual que antes y sus textos no cambian.

### RF-11 — El formulario no acepta fechas futuras

Criterios de aceptación:

- **(Cuando)** Cuando se usa el formulario «Nueva sesión», entonces el campo de fecha no admite fechas posteriores a hoy (límite fijado en el momento de usar la app); si se intenta, el navegador bloquea el envío.
- **(Cuando)** Cuando la aplicación lleva abierta de un día para otro, entonces el límite del campo de fecha vuelve a fijarse en «hoy» al usar el campo (y al repintar), de modo que nunca queda obsoleto.
- **(Cuando)** Cuando el límite está activo, entonces no es posible crear por la interfaz una sesión con fecha futura; las que ya existan en el almacén se siguen tratando según RF-4 sin modificarse.

---

## Requisitos no funcionales

- **RNF-1 — Idioma**: toda la interfaz del mapa (título, rótulos, leyenda y detalle) está en español.
- **RNF-2 — Encaje en móvil**: Dado un ancho de 375 px, cuando se muestra el mapa, entonces la página no desarrolla desbordamiento horizontal propio. Las celdas miden **12×12 px con 3 px de separación** (columna de 15 px); si el ancho de la rejilla completa — rótulos de día + 26 columnas + holgura, ≈416 px — no cabe en el contenedor, el desplazamiento ocurre únicamente dentro del contenedor del mapa; a partir de ese ancho (≈416 px) no hay scroll.
- **RNF-3 — Simplicidad**: sin dependencias nuevas ni pasos de build; la aplicación sigue funcionando abriéndola con doble clic, sin servidor ni instalación; no se añaden puntos de foco ni manejo de foco en las 182 celdas.
- **RNF-4 — Fechas en hora local**: determinar «qué día es hoy» y agrupar los días se hace siempre en la zona horaria local del usuario; nunca en UTC. La ventana contiene siempre 182 fechas locales consecutivas y distintas, también al cruzar el cambio de hora de marzo u octubre.
- **RNF-5 — Sin datos nuevos**: el mapa se deriva exclusivamente de las sesiones ya registradas; no se persiste ningún dato nuevo ni se modifica el formato de lo existente. **Ninguna regla del mapa borra o modifica sesiones guardadas**: RF-4 y RF-5 afectan solo al pintado.
- **RNF-6 — Rendimiento**: con un año completo de sesiones, el mapa se pinta sin demora perceptible.
- **RNF-7 — Accesibilidad**: los **4 tonos con color** se distinguen del fondo (tarjeta blanca) con un contraste mínimo de **3:1** (WCAG 2.1, criterio 1.4.11, elementos gráficos); el estado vacío queda **exento** de ese umbral (no comunica información por color: su significado lo aportan la leyenda y el texto equivalente de la celda). Los 5 estados están ordenados de menos a más intenso; toda celda tiene un equivalente textual (RF-8).
- **RNF-8 — Lógica pura**: los cálculos del mapa (ventana, totales, niveles, leyenda) son funciones puras: reciben las sesiones y el texto de `hoy`, sin DOM ni localStorage (constitución, principio 3).
- **RNF-9 — Formato numérico**: todos los números del mapa (rangos de leyenda y detalle) usan la convención es-ES del resto de la app (p. ej. «12.345 min»).

---

## Casos límite

1. **Ventana sin ningún minuto**: mapa vacío y leyenda solo con el estado vacío (RF-6).
2. **Un único día con minutos**: ese día es el máximo (nivel 4); el resto queda vacío.
3. **Varios días empatados en el máximo**: todos alcanzan `N = max` → nivel 4.
4. **Días futuros con sesión heredada**: celda vacía; sus minutos no entran en `N` ni en `max` (RF-4).
5. **Minutos no numéricos, cero o negativos**: ignorados; si el día queda en 0, celda vacía (RF-5).
6. **Totales con decimales (dato heredado)**: se redondean al entero más cercano solo para pintar (RF-5).
7. **Fecha de sesión no válida («abc», «2026-13-45»)**: se ignora en el mapa y la lista la muestra tal cual sin formatear (RF-2, enmienda E1).
8. **Días anteriores a la primera sesión**: celdas vacías, sin anomalía.
9. **Sesión anterior al inicio de la ventana** (más de 26 semanas): sin efecto visible; la ventana no cambia (RF-1).
10. **Hoy sin sesión todavía**: celda de hoy vacía, igual que cualquier otro día sin estudiar.
11. **Registro que dispara el máximo nuevo** (p. ej. 120 min): todos los colores del periodo se recalculan (RF-3); los días anteriores pueden cambiar de tono — es el comportamiento esperado de una escala relativa.
12. **`max` menor que 4 minutos**: los niveles 1-3 quedan inalcanzables; la leyenda los etiqueta «—» (RF-7).
13. **Ventana que cruza cambio de año**: etiquetas de los meses del año nuevo con año (RF-9).
14. **Ventana que cruza cambio de hora** (último domingo de marzo u octubre): la ventana sigue teniendo 182 fechas consecutivas y distintas (RNF-4).
15. **Racha más larga que la ventana** (más de 182 días): el mapa solo muestra el tramo que cae dentro de las 26 semanas; la racha completa se ve en las tarjetas. Es una limitación conocida, no un error.
16. **La app abierta varios días seguidos**: el mapa refleja la fecha y los datos del momento en que se pinta (al abrir y al registrar una sesión, sin temporizador).

---

## Fuera de alcance (versión 1)

- Elegir el número de semanas (8, 12, 52…): es fijo en 26.
- Interacción con clic en una celda: filtrar la lista, abrir las sesiones del día o editarlas.
- Popup o consulta táctil de los minutos exactos en móvil (decisión tomada en la fase de preguntas; ver tabla de decisiones).
- Navegación del mapa con teclado (flechas o tabulación entre celdas); el texto equivalente para lector de pantalla no requiere foco (RF-8).
- Comparativas («esta semana frente a la anterior»), objetivos diarios o marcas dentro del mapa.
- Animaciones o transiciones de color.
- Guardar preferencias o cualquier dato nuevo.
- Exportar o compartir la imagen del mapa.
- Modificar el gráfico semanal, las tarjetas existentes o la lista de sesiones (salvo el `max` de fecha del formulario, RF-11).

---

## Criterios de finalización

1. Todos los RF de esta spec están implementados y sus criterios de aceptación verificados con Chrome DevTools (MCP): cargar la app, registrar sesiones de prueba repartidas por varias semanas, comprobar colores y el contraste de los 4 tonos (≥3:1, RNF-7), leyenda (incluidos «0 min» y «—»), detalle al pasar el cursor, equivalente textual de las celdas, bloqueo de fecha futura en el formulario y vista móvil a 375 px; **consola sin errores**.
2. La lógica (ventana, totales con redondeo, niveles con cortes enteros, futuros, fechas y minutos inválidos, fechas corruptas, recálculo y cambio de hora) está cubierta por pruebas automatizadas en verde con `node --test`; no se avanza con pruebas en rojo (constitución, principio 4).
3. Sin dependencias nuevas ni build: la app abre con doble clic.
4. Compatibilidad: las sesiones existentes siguen pintándose igual en racha, semana, mes y lista; ninguna sesión se pierde ni cambia de formato.
5. Interfaz del mapa completamente en español.
6. `MEMORY.md` actualizado con el estado y las decisiones de esta función.
7. La línea «Dudas abiertas» solo puede decir «Ninguna» si una revisión QA posterior no detecta ambigüedades (constitución, principio 2).

---

## Dudas abiertas

**Ninguna.** Historial: las dos marcas `[NECESITA ACLARACIÓN]` iniciales se resolvieron al aprobar la spec (detalle en móvil → color + leyenda; 26 semanas → fijas). La revisión QA posterior detectó 27 hallazgos (ambigüedades, contradicciones, casos límite y conflictos con la constitución) y el usuario aprobó todas sus soluciones, confirmando las 6 decisiones marcadas como recomendadas (teclado/lector de pantalla, rótulos abreviados, decimales, leyenda de niveles inalcanzables, bloqueo de fecha futuras en el formulario y actualización de la ventana sin temporizadores). Al planificar la implementación se detectaron 2 dudas nuevas (contraste literal imposible en RNF-7 y umbral de scroll de RNF-2) y el usuario aprobó también sus opciones recomendadas: contraste 3:1 solo para los 4 tonos y umbral de ≈416 px sobre la rejilla completa. El QA del plan añadió 2 enmiendas (E1: la lista no se rompe con fechas corruptas; E2: el `max` del campo de fecha se refresca al usarlo), confirmadas por el usuario al aprobar el plan v2.
