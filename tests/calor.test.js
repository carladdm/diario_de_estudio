// =========================================================
// Pruebas del mapa de calor
// Se ejecutan con: node --test
// =========================================================
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  fechaDesdeTexto,
  fechaValida,
  fechaFutura,
  restarDias,
  fechaLocal,
  formatearFecha,
  diasDelMapaCalor,
  totalesPorDia,
  maximoDiario,
  cortesDeNiveles,
  nivelDeMinutos,
  rangosDeLeyenda,
  etiquetasDeMes,
  descripcionDeCelda,
  minutosValidos,
  objetivoValido,
  objetivoDesdeTexto,
  minutosDeSemana,
  porcentajeDeProgreso,
  textoDeProgreso,
  objetivoCumplido
} = require("../calor.js");

// ---------------------------------------------------------
// RF-1: la ventana de 26 semanas
// ---------------------------------------------------------

test("la ventana tiene 26 semanas completas de lunes a domingo", function () {
  const dias = diasDelMapaCalor("2026-10-07"); // miércoles

  assert.equal(dias.length, 26 * 7); // 182 días
  assert.equal(dias[0], "2026-04-13"); // primer lunes
  assert.equal(dias[181], "2026-10-11"); // domingo de la semana actual

  dias.forEach(function (dia, posicion) {
    const diaDeLaSemana = fechaDesdeTexto(dia).getDay();
    if (posicion % 7 === 0) {
      assert.equal(diaDeLaSemana, 1, "toda columna empieza en lunes: " + dia);
    }
    if (posicion % 7 === 6) {
      assert.equal(diaDeLaSemana, 0, "toda columna termina en domingo: " + dia);
    }
  });
});

test("si hoy es lunes o domingo, la ventana termina en el domingo de esa misma semana", function () {
  const desdeLunes = diasDelMapaCalor("2026-10-05");
  const desdeDomingo = diasDelMapaCalor("2026-10-11");

  assert.equal(desdeLunes[0], "2026-04-13");
  assert.equal(desdeLunes[181], "2026-10-11");
  assert.equal(desdeDomingo[0], "2026-04-13");
  assert.equal(desdeDomingo[181], "2026-10-11");
});

test("la ventana cruza cambio de año sin desbordarse", function () {
  const dias = diasDelMapaCalor("2027-01-06"); // miércoles de enero

  assert.equal(dias.length, 182);
  assert.equal(dias[0], "2026-07-13");
  assert.equal(dias[181], "2027-01-10");
});

// ---------------------------------------------------------
// RF-2 y RF-5: totales por día
// ---------------------------------------------------------

test("suma las sesiones del mismo día e ignora futuras, inválidas y de fuera de la ventana", function () {
  const hoy = "2026-10-07";
  const dias = diasDelMapaCalor(hoy);
  const sesiones = [
    { fecha: "2026-10-07", minutos: 45 },
    { fecha: "2026-10-07", minutos: 30 }, // mismo día: se suma
    { fecha: "2026-10-05", minutos: 60 },
    { fecha: "2026-10-06", minutos: 10 },
    { fecha: "2026-10-06", minutos: 0 }, // inválido
    { fecha: "2026-10-06", minutos: -10 }, // inválido
    { fecha: "2026-10-06", minutos: "30" }, // inválido (texto)
    { fecha: "2026-10-09", minutos: 50 }, // futura: no pinta
    { fecha: "2026-04-01", minutos: 99 } // fuera de la ventana
  ];

  const totales = totalesPorDia(sesiones, dias, hoy);

  assert.deepEqual(totales, {
    "2026-10-05": 60,
    "2026-10-06": 10,
    "2026-10-07": 75
  });
});

test("maximoDiario devuelve el mayor total y 0 si no hay datos", function () {
  assert.equal(maximoDiario({ a: 45, b: 75, c: 10 }), 75);
  assert.equal(maximoDiario({}), 0);
  assert.equal(maximoDiario({ a: -5 }), 0);
});

// ---------------------------------------------------------
// RF-3 y RF-6: niveles de color y máximo
// ---------------------------------------------------------

test("los niveles cortan en los cortes enteros c1, c2 y c3", function () {
  assert.equal(nivelDeMinutos(0, 60), 0); // vacío
  assert.equal(nivelDeMinutos(60, 0), 0); // sin máximo: todo vacío
  assert.equal(nivelDeMinutos(14, 60), 1); // por debajo de c1 = 15
  assert.equal(nivelDeMinutos(15, 60), 2); // justo en c1: sube de nivel
  assert.equal(nivelDeMinutos(29, 60), 2); // por debajo de c2 = 30
  assert.equal(nivelDeMinutos(30, 60), 3); // justo en c2
  assert.equal(nivelDeMinutos(44, 60), 3); // por debajo de c3 = 45
  assert.equal(nivelDeMinutos(45, 60), 4); // justo en c3
  assert.equal(nivelDeMinutos(60, 60), 4); // el máximo siempre es nivel 4
});

test("con máximo bajo, los niveles imposibles no se usan", function () {
  assert.equal(nivelDeMinutos(1, 10), 1); // por debajo de c1 = 3
  assert.equal(nivelDeMinutos(2, 10), 1); // por debajo de c1 = 3
  assert.equal(nivelDeMinutos(3, 10), 2); // justo en c1
  assert.equal(nivelDeMinutos(5, 10), 3); // justo en c2 = 5
  assert.equal(nivelDeMinutos(8, 10), 4); // justo en c3 = 8
});

// ---------------------------------------------------------
// RF-7: leyenda
// ---------------------------------------------------------

test("sin minutos en la ventana, la leyenda no tiene rangos", function () {
  assert.equal(rangosDeLeyenda(0), null);
});

test("los rangos de la leyenda usan los mismos cortes que los niveles", function () {
  assert.deepEqual(rangosDeLeyenda(60), [
    "1-14 min", "15-29 min", "30-44 min", "45-60 min"
  ]);
  assert.deepEqual(rangosDeLeyenda(10), [
    "1-2 min", "3-4 min", "5-7 min", "8-10 min"
  ]);
  assert.deepEqual(rangosDeLeyenda(1), ["—", "—", "—", "1 min"]);

  // Propiedad: cada número de minutos cae en el rango de su nivel.
  [60, 10, 7, 33, 1].forEach(function (maximo) {
    const rangos = rangosDeLeyenda(maximo);
    for (let minutos = 1; minutos <= maximo; minutos++) {
      const texto = rangos[nivelDeMinutos(minutos, maximo) - 1];
      assert.notEqual(texto, "—", "nivel posible no marcado como imposible");
      const limites = texto.replace(" min", "").split("-").map(Number);
      const desde = limites[0];
      const hasta = limites.length === 2 ? limites[1] : limites[0];
      assert.ok(
        minutos >= desde && minutos <= hasta,
        minutos + " min debería estar en «" + texto + "» (máximo " + maximo + ")"
      );
    }
  });
});

// ---------------------------------------------------------
// RF-8: detalle de cada celda
// ---------------------------------------------------------

test("la descripción de la celda muestra fecha en español y minutos", function () {
  assert.equal(descripcionDeCelda("2026-10-07", 45), "7 de octubre de 2026: 45 min");
  assert.equal(descripcionDeCelda("2026-10-07", 0), "7 de octubre de 2026: sin minutos");
});

// ---------------------------------------------------------
// RF-9: etiquetas de mes
// ---------------------------------------------------------

test("cada columna que entra en un mes nuevo lleva su etiqueta", function () {
  const dias = diasDelMapaCalor("2026-10-07");
  const etiquetas = etiquetasDeMes(dias);

  assert.equal(etiquetas.length, 26);
  assert.equal(etiquetas[0], "abr");
  const texto = etiquetas.join(" ");
  ["may", "jun", "jul", "ago", "sep", "oct"].forEach(function (mes) {
    assert.ok(texto.includes(mes), "falta la etiqueta de " + mes);
  });
  // Todo el año es 2026: no hace falta añadir el año a ninguna.
  etiquetas.forEach(function (etiqueta) {
    assert.ok(!etiqueta.includes("20"), "no debería llevar año: " + etiqueta);
  });
});

test("al cruzar el año, la primera etiqueta del año nuevo lo incluye", function () {
  const dias = diasDelMapaCalor("2027-01-06");
  const texto = etiquetasDeMes(dias).join(" ");

  assert.ok(texto.includes("jul"));
  assert.ok(texto.includes("nov"));
  assert.ok(texto.includes("dic"));
  assert.ok(texto.includes("ene 2027"), "enero debe llevar el año");
});

// ---------------------------------------------------------
// Nuevos del plan v2 (N1-N12): contratos y casos límite
// ---------------------------------------------------------

test("N1: fechaValida solo acepta textos AAAA-MM-DD con día real", function () {
  assert.equal(fechaValida("2026-10-07"), true);
  assert.equal(fechaValida("abc"), false);
  assert.equal(fechaValida("2026-13-45"), false); // mes 13
  assert.equal(fechaValida("2026-02-30"), false); // febrero no llega al 30
  assert.equal(fechaValida("2026-10-7"), false); // sin rellenar con cero
  // Contrato string-only: nunca lanzan, devuelven false.
  assert.equal(fechaValida(undefined), false);
  assert.equal(fechaValida(null), false);
  assert.equal(fechaValida(42), false);
});

test("N2: una fecha corrupta no entra en los totales del mapa", function () {
  const hoy = "2026-10-07";
  const dias = diasDelMapaCalor(hoy);
  const totales = totalesPorDia([
    { fecha: "abc", minutos: 30 },
    { fecha: undefined, minutos: 30 },
    { fecha: 42, minutos: 30 },
    { fecha: "2026-10-06", minutos: 30 }
  ], dias, hoy);

  assert.deepEqual(totales, { "2026-10-06": 30 });
});

test("N3: los decimales se redondean al sumar y 0,4 da celda vacía", function () {
  const hoy = "2026-10-07";
  const dias = diasDelMapaCalor(hoy);

  // Suma primero, redondea después: 10,4 + 10,4 = 20,8 → 21.
  assert.deepEqual(
    totalesPorDia([
      { fecha: "2026-10-06", minutos: 10.4 },
      { fecha: "2026-10-06", minutos: 10.4 }
    ], dias, hoy),
    { "2026-10-06": 21 }
  );
  assert.deepEqual(
    totalesPorDia([{ fecha: "2026-10-06", minutos: 2.5 }], dias, hoy),
    { "2026-10-06": 3 }
  );

  // 0,4 min: la sesión es válida, pero su total redondeado es 0.
  const casiNada = totalesPorDia(
    [{ fecha: "2026-10-06", minutos: 0.4 }], dias, hoy
  );
  assert.deepEqual(casiNada, { "2026-10-06": 0 });
  assert.equal(maximoDiario(casiNada), 0); // no sube el máximo
  assert.equal(nivelDeMinutos(casiNada["2026-10-06"], 0), 0); // celda vacía
});

test("N4: los cortes enteros parten el máximo en cuatro trozos", function () {
  assert.deepEqual(cortesDeNiveles(60), [15, 30, 45]);
  assert.deepEqual(cortesDeNiveles(10), [3, 5, 8]);
  assert.deepEqual(cortesDeNiveles(1), [1, 1, 1]);
});

test("N5: al subir el máximo, todos los niveles se recalculan", function () {
  const hoy = "2026-10-07";
  const dias = diasDelMapaCalor(hoy);

  const antes = totalesPorDia(
    [{ fecha: "2026-10-06", minutos: 45 }], dias, hoy
  );
  assert.equal(maximoDiario(antes), 45);
  assert.equal(nivelDeMinutos(45, 45), 4); // 45 es el máximo: nivel 4

  const despues = totalesPorDia([
    { fecha: "2026-10-06", minutos: 45 },
    { fecha: "2026-10-05", minutos: 120 }
  ], dias, hoy);
  assert.equal(maximoDiario(despues), 120);
  // Mismo día de 45 min, nuevo máximo 120 (c₁=30, c₂=60): baja a nivel 2.
  assert.equal(nivelDeMinutos(45, 120), 2);
  // Los rangos acaban justo antes de cada corte (c₁-1, c₂-1, c₃-1).
  assert.deepEqual(rangosDeLeyenda(120), [
    "1-29 min", "30-59 min", "60-89 min", "90-120 min"
  ]);
});

test("N6: los rangos de la leyenda usan la convención es-ES", function () {
  // 4 cifras van sin separador (convención RAE): 1234 → "1234".
  assert.deepEqual(rangosDeLeyenda(1234), [
    "1-308 min", "309-616 min", "617-925 min", "926-1234 min"
  ]);
  // A partir de 5 cifras, el millar con punto: 12345 → "12.345".
  assert.deepEqual(rangosDeLeyenda(12345), [
    "1-3086 min", "3087-6172 min", "6173-9258 min", "9259-12.345 min"
  ]);
});

test("N7: la descripción de la celda formatea en es-ES", function () {
  assert.equal(
    descripcionDeCelda("2026-10-07", 12345),
    "7 de octubre de 2026: 12.345 min"
  );
  assert.equal(
    descripcionDeCelda("2026-10-07", 1234),
    "7 de octubre de 2026: 1234 min"
  );
});

test("N8: fechaFutura solo compara textos y no lanza", function () {
  assert.equal(fechaFutura("2026-10-06", "2026-10-07"), false);
  assert.equal(fechaFutura("2026-10-07", "2026-10-07"), false); // mismo día
  assert.equal(fechaFutura("2026-10-08", "2026-10-07"), true);
  assert.equal(fechaFutura(undefined, "2026-10-07"), false);
  assert.equal(fechaFutura("2026-10-07", undefined), false);
});

test("N9: la ventana solo depende de hoy y una sesión vieja no la altera", function () {
  const hoy = "2026-10-07";
  const dias = diasDelMapaCalor(hoy);
  assert.deepEqual(dias, diasDelMapaCalor(hoy));
  // Sesión anterior a la ventana: no aporta minutos, la ventana no cambia.
  assert.deepEqual(
    totalesPorDia([{ fecha: "2026-01-01", minutos: 60 }], dias, hoy),
    {}
  );
  assert.deepEqual(dias, diasDelMapaCalor(hoy));
});

test("N10: la ventana aguanta los cambios de hora (26 semanas seguidas)", function () {
  // Ventana con el cambio de hora de octubre de 2026 (25/26).
  const verano = diasDelMapaCalor("2026-10-28"); // miércoles
  assert.equal(verano[0], "2026-05-04");
  assert.equal(verano[181], "2026-11-01");

  // Ventana con el cambio de hora de marzo de 2027.
  const invierno = diasDelMapaCalor("2027-04-01");
  assert.equal(invierno[0], "2026-10-05");
  assert.equal(invierno[181], "2027-04-04");

  // Días distintos y consecutivos por calendario (restarDias, no ms).
  [verano, invierno].forEach(function (dias) {
    assert.equal(new Set(dias).size, 182);
    for (let i = 0; i < dias.length - 1; i++) {
      const siguiente = fechaLocal(restarDias(fechaDesdeTexto(dias[i]), -1));
      assert.equal(siguiente, dias[i + 1]);
    }
  });
});

test("N11: todas las etiquetas del año nuevo llevan el año", function () {
  const dias = diasDelMapaCalor("2027-02-08");
  const etiquetas = etiquetasDeMes(dias);

  assert.ok(etiquetas.includes("ene 2027"), "enero debe llevar el año");
  assert.ok(etiquetas.includes("feb 2027"), "febrero también");
});

test("N12: una fecha corrupta no rompe el pintado de la lista", function () {
  assert.equal(formatearFecha("abc"), "abc");
  assert.equal(formatearFecha("2026-02-30"), "2026-02-30");
  // La fecha válida sigue formateándose igual que siempre.
  assert.equal(formatearFecha("2026-10-07"), "7 de octubre de 2026");
});

// ---------------------------------------------------------
// Objetivo semanal (spec 002)
// ---------------------------------------------------------

test("O1: objetivoValido acepta enteros >= 1 y rechaza el resto sin lanzar", function () {
  // Válidos: devuelve el entero tal cual.
  assert.equal(objetivoValido(300), 300);
  assert.equal(objetivoValido(1), 1);

  // Inválidos: devuelve null. Ninguna de estas llamadas puede lanzar.
  assert.equal(objetivoValido(0), null);
  assert.equal(objetivoValido(-5), null);
  assert.equal(objetivoValido(300.5), null); // decimal
  assert.equal(objetivoValido("300"), null); // texto (aunque parezca número)
  assert.equal(objetivoValido(""), null);
  assert.equal(objetivoValido(null), null);
  assert.equal(objetivoValido(undefined), null);
  assert.equal(objetivoValido({}), null);
  assert.equal(objetivoValido(NaN), null);
  assert.equal(objetivoValido(Infinity), null);
});

test("O2: objetivoDesdeTexto lee la clave corrupta sin lanzar nunca", function () {
  // La clave guarda JSON: "300" (texto de localStorage) → 300.
  assert.equal(objetivoDesdeTexto("300"), 300);

  // JSON tolera los espacios alrededor del número (plan §5: JSON.parse).
  assert.equal(objetivoDesdeTexto(" 300 "), 300);

  // Corruptos: sin objetivo (null). Ninguna llamada puede lanzar:
  // localStorage puede devolver cualquier cosa (JSON malformado,
  // números, null, undefined…).
  assert.equal(objetivoDesdeTexto("abc"), null); // JSON malformado
  assert.equal(objetivoDesdeTexto(""), null); // JSON malformado
  assert.equal(objetivoDesdeTexto("null"), null); // JSON válido, sin objetivo
  assert.equal(objetivoDesdeTexto("{}"), null); // objeto, no número
  assert.equal(objetivoDesdeTexto("300.5"), null); // decimal metido a mano
  assert.equal(objetivoDesdeTexto("0"), null);
  assert.equal(objetivoDesdeTexto("-5"), null);
  assert.equal(objetivoDesdeTexto('"300"'), null); // string, no número
  assert.equal(objetivoDesdeTexto(null), null);
  assert.equal(objetivoDesdeTexto(undefined), null);
});

test("O3: minutosDeSemana suma de lunes a hoy y excluye el domingo previo, el futuro y los minutos corruptos", function () {
  const hoy = "2026-10-08"; // jueves
  const sesiones = [
    { id: 1, fecha: "2026-10-05", minutos: 60 },    // lunes de esta semana
    { id: 2, fecha: "2026-10-06", minutos: 30 },    // martes de esta semana
    { id: 3, fecha: "2026-10-04", minutos: 500 },   // domingo de la semana anterior
    { id: 4, fecha: "2026-10-09", minutos: 700 },   // viernes futuro
    { id: 5, fecha: "2026-10-07", minutos: "60" },  // minutos en texto (corrupto)
    { id: 6, fecha: "2026-10-07", minutos: 0 },     // 0 no suma
    { id: 7, fecha: "2026-10-07", minutos: -20 }    // negativo no suma
  ];

  assert.equal(minutosDeSemana(sesiones, hoy), 90);
});

test("O4: la semana depende de hoy: el lunes solo cuenta el lunes y el domingo cuenta la semana completa", function () {
  const sesiones = [
    { id: 1, fecha: "2026-10-05", minutos: 40 },   // lunes de la semana
    { id: 2, fecha: "2026-10-06", minutos: 30 },   // martes
    { id: 3, fecha: "2026-10-10", minutos: 15 },   // sábado
    { id: 4, fecha: "2026-10-11", minutos: 5 },    // domingo (fin de semana)
    { id: 5, fecha: "2026-09-28", minutos: 500 }   // lunes de la semana anterior
  ];

  // Empezando la semana: solo cuenta el lunes, el resto aún es futuro.
  assert.equal(minutosDeSemana(sesiones, "2026-10-05"), 40);

  // Cierre de semana: cuentan los 7 días (5–11) y sigue fuera el lunes anterior.
  assert.equal(minutosDeSemana(sesiones, "2026-10-11"), 40 + 30 + 15 + 5);
});

test("O5: la semana cruza los cambios de hora sin saltar ni repetir días", function () {
  // Domingo del cambio de hora de octubre de 2026: semana del 19 al 25.
  assert.equal(minutosDeSemana([
    { id: 1, fecha: "2026-10-19", minutos: 45 },   // lunes
    { id: 2, fecha: "2026-10-24", minutos: 30 },   // sábado
    { id: 3, fecha: "2026-10-25", minutos: 20 },   // domingo (hoy)
    { id: 4, fecha: "2026-10-18", minutos: 100 },  // domingo anterior: fuera
    { id: 5, fecha: "2026-10-26", minutos: 200 }   // lunes siguiente: futuro
  ], "2026-10-25"), 45 + 30 + 20);

  // Domingo del cambio de hora de marzo de 2027: semana del 22 al 28.
  assert.equal(minutosDeSemana([
    { id: 1, fecha: "2027-03-22", minutos: 10 },   // lunes
    { id: 2, fecha: "2027-03-28", minutos: 50 },   // domingo (hoy)
    { id: 3, fecha: "2027-03-21", minutos: 700 },  // domingo anterior: fuera
    { id: 4, fecha: "2027-03-29", minutos: 800 }   // futuro: fuera
  ], "2027-03-28"), 10 + 50);
});

test("O6: porcentajeDeProgreso da entero 0-100 con Math.round y tope, sin lanzar nunca", function () {
  // Casos del contrato (RF-4): entero con Math.round.
  assert.equal(porcentajeDeProgreso(90, 300), 30);
  assert.equal(porcentajeDeProgreso(100, 300), 33); // 33,3… redondea a 33
  assert.equal(porcentajeDeProgreso(0, 300), 0);
  assert.equal(porcentajeDeProgreso(300, 300), 100);
  assert.equal(porcentajeDeProgreso(320, 300), 100); // tope
  assert.equal(porcentajeDeProgreso(500, 300), 100); // tope

  // Objetivo no válido (sin objetivo = null, D3): 0, sin división por cero.
  assert.equal(porcentajeDeProgreso(90, null), 0);
  assert.equal(porcentajeDeProgreso(90, 0), 0);
  assert.equal(porcentajeDeProgreso(90, -5), 0);
  assert.equal(porcentajeDeProgreso(90, "300"), 0);
  assert.equal(porcentajeDeProgreso(90, 300.5), 0);
  assert.equal(porcentajeDeProgreso(90, undefined), 0);
  assert.equal(porcentajeDeProgreso(90, NaN), 0);

  // Minutos basura: 0, sin lanzar.
  assert.equal(porcentajeDeProgreso(-10, 300), 0);
  assert.equal(porcentajeDeProgreso(NaN, 300), 0);
  assert.equal(porcentajeDeProgreso(Infinity, 300), 0);
  assert.equal(porcentajeDeProgreso("90", 300), 0);
  assert.equal(porcentajeDeProgreso(undefined, 300), 0);
  assert.equal(porcentajeDeProgreso(null, 300), 0);

  // Sin excepción con basura en ambos argumentos.
  assert.equal(porcentajeDeProgreso("abc", "def"), 0);
});

test("O7: textoDeProgreso escribe «X de Y min» en es-ES y devuelve null sin objetivo", function () {
  // Formato normal y millares (RNF-8): las 4 cifras sin separador
  // y a partir de la 5.ª el millar con punto (convención es-ES).
  assert.equal(textoDeProgreso(90, 300), "90 de 300 min");
  assert.equal(textoDeProgreso(1234, 5678), "1234 de 5678 min");
  assert.equal(textoDeProgreso(12345, 100000), "12.345 de 100.000 min");

  // Decimal heredado: coma es-ES y sin redondear (D14).
  assert.equal(textoDeProgreso(90.5, 300), "90,5 de 300 min");

  // Sin objetivo válido (D3): null, para que la interfaz pinte
  // el estado vacío. Ninguna de estas llamadas puede lanzar.
  assert.equal(textoDeProgreso(90, null), null);
  assert.equal(textoDeProgreso(90, undefined), null);
  assert.equal(textoDeProgreso(90, 0), null);
  assert.equal(textoDeProgreso(90, "300"), null);
  assert.equal(textoDeProgreso(90, 300.5), null);

  // Minutos corruptos: sin excepción y se muestran como 0,
  // la misma regla que porcentajeDeProgreso (RNF-4).
  assert.equal(textoDeProgreso(undefined, 300), "0 de 300 min");
  assert.equal(textoDeProgreso(null, 300), "0 de 300 min");
  assert.equal(textoDeProgreso("abc", 300), "0 de 300 min");
  assert.equal(textoDeProgreso(NaN, 300), "0 de 300 min");
  assert.equal(textoDeProgreso(-10, 300), "0 de 300 min");

  // Basura en los dos argumentos: sigue sin lanzar.
  assert.equal(textoDeProgreso("abc", "def"), null);
});

test("O8: objetivoCumplido da true al alcanzar o superar y false sin objetivo o por debajo", function () {
  // D-8: alcanzar cuenta (300 de 300) y superar también (320 de 300).
  assert.equal(objetivoCumplido(300, 300), true);
  assert.equal(objetivoCumplido(320, 300), true);
  assert.equal(objetivoCumplido(299, 300), false);

  // Decimales heredados: 90,5 con objetivo 90 cumple.
  assert.equal(objetivoCumplido(90.5, 90), true);

  // Sin objetivo válido → false (D3), sin lanzar.
  assert.equal(objetivoCumplido(300, null), false);
  assert.equal(objetivoCumplido(300, 0), false);
  assert.equal(objetivoCumplido(300, "300"), false);
  assert.equal(objetivoCumplido(300, undefined), false);
});

test("O9: la semana vacía muestra «0 de 300 min» con todas las cifras en cero", function () {
  const hoy = "2026-10-08"; // jueves

  assert.equal(minutosDeSemana([], hoy), 0);
  assert.equal(textoDeProgreso(0, 300), "0 de 300 min");
  assert.equal(porcentajeDeProgreso(0, 300), 0);
  assert.equal(objetivoCumplido(0, 300), false);
});

test("O10: el total de la semana cuadra con la suma de los totales diarios de la tarjeta", function () {
  const hoy = "2026-10-08"; // jueves
  const lunes = "2026-10-05";
  const sesiones = [
    { id: 1, fecha: "2026-10-05", minutos: 60 },    // lunes válido
    { id: 2, fecha: "2026-10-06", minutos: 30.5 },  // decimal heredado: suma
    { id: 3, fecha: "2026-10-06", minutos: 10 },    // mismo día: se acumula
    { id: 4, fecha: "2026-10-07", minutos: "60" },  // minutos en texto
    { id: 5, fecha: "2026-10-07", minutos: 0 },     // 0
    { id: 6, fecha: "2026-10-07", minutos: -20 },   // negativo
    { id: 7, fecha: "2026-10-09", minutos: 999 },   // futuro (viernes)
    { id: 8, fecha: "2026-09-30", minutos: 500 },   // semana anterior
    { id: 9, fecha: "abc", minutos: 45 }            // fecha corrupta
  ];

  // Misma regla que minutosPorDia() de la tarjeta: por día, de lunes a
  // hoy comparando textos y solo minutosValidos (D12); luego se suman los días.
  const porDia = {};
  sesiones.forEach(function (sesion) {
    if (sesion.fecha >= lunes && sesion.fecha <= hoy && minutosValidos(sesion.minutos)) {
      porDia[sesion.fecha] = (porDia[sesion.fecha] || 0) + sesion.minutos;
    }
  });
  const sumaDiaria = Object.values(porDia).reduce(function (total, minutos) {
    return total + minutos;
  }, 0);

  assert.equal(sumaDiaria, 100.5); // 60 + 30,5 + 10: los decimales suman
  assert.equal(minutosDeSemana(sesiones, hoy), sumaDiaria);
});

test("O11: ninguna de las 6 funciones lanza con entradas basura y devuelve su contrato", function () {
  // Contrato §5: basura en cualquier argumento → valor del contrato, sin excepción.
  const basuras = [undefined, null, "x", {}, []];
  basuras.forEach(function (basura) {
    assert.equal(objetivoValido(basura), null);
    assert.equal(objetivoDesdeTexto(basura), null);
    assert.equal(minutosDeSemana(basura, basura), 0);
    assert.equal(porcentajeDeProgreso(basura, basura), 0);
    assert.equal(textoDeProgreso(basura, basura), null);
    assert.equal(objetivoCumplido(basura, basura), false);
  });

  // Un array de sesiones con null y basura dentro: se ignoran sin lanzar.
  assert.equal(minutosDeSemana([null, "x", 42], "2026-10-08"), 0);
  assert.equal(
    minutosDeSemana([{ fecha: "2026-10-06", minutos: 30 }, null], "2026-10-08"),
    30
  );
});

test("O12: al cambiar el objetivo se recalculan texto, porcentaje y cumplido", function () {
  const minutos = 90;

  // Objetivo 300: a mitad del camino.
  assert.equal(textoDeProgreso(minutos, 300), "90 de 300 min");
  assert.equal(porcentajeDeProgreso(minutos, 300), 30);
  assert.equal(objetivoCumplido(minutos, 300), false);

  // Objetivo 200: texto y porcentaje se recalculan al instante;
  // 90 < 200, así que aún no cumple (contrato §5: minutos >= objetivo,
  // y la spec dice «el mensaje si corresponde»).
  assert.equal(textoDeProgreso(minutos, 200), "90 de 200 min");
  assert.equal(porcentajeDeProgreso(minutos, 200), 45);
  assert.equal(objetivoCumplido(minutos, 200), false);

  // Objetivo 80: con los mismos minutos ahora sí cumple (RF-5).
  assert.equal(textoDeProgreso(minutos, 80), "90 de 80 min");
  assert.equal(porcentajeDeProgreso(minutos, 80), 100); // tope
  assert.equal(objetivoCumplido(minutos, 80), true);
});
