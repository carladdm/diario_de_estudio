// =========================================================
// Diario de Estudio - lógica del mapa de calor
// Funciones puras: no tocan el DOM ni localStorage.
// Todas reciben "hoy" como texto "AAAA-MM-DD" para que se
// puedan probar con node --test sin falsear la fecha real.
// =========================================================

// =========================================================
// Fechas (siempre en la hora local, nunca en UTC)
// Estas funciones estaban en app.js: viven aquí para que el
// mapa de calor y las pruebas usen la misma única copia.
// =========================================================

// Devuelve una fecha como texto "AAAA-MM-DD" usando la hora local.
function fechaLocal(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return anio + "-" + mes + "-" + dia;
}

// Convierte "AAAA-MM-DD" en un objeto Date local (sin usar UTC).
function fechaDesdeTexto(texto) {
  const partes = texto.split("-");
  return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
}

// ¿Es un texto "AAAA-MM-DD" con formato correcto y día real?
// Solo textos: si no lo es, devuelve false sin lanzar, para que
// los datos corruptos no rompan nunca los cálculos (RF-2).
function fechaValida(texto) {
  if (typeof texto !== "string") {
    return false;
  }
  // Ida y vuelta: si al convertirlo y escribirlo otra vez no cuadra,
  // el texto estaba mal («abc», «2026-13-45», «2026-02-30», «2026-10-7»).
  return fechaLocal(fechaDesdeTexto(texto)) === texto;
}

// ¿Es la fecha posterior a "hoy"? Se comparan los textos: el texto
// "AAAA-MM-DD" ordenado sigue el orden cronológico. Si alguno de los
// dos no es texto no lanza y no bloquea (RF-11): quien realmente
// impide el envío de una fecha futura es el "max" del formulario.
function fechaFutura(fecha, hoy) {
  if (typeof fecha !== "string" || typeof hoy !== "string") {
    return false;
  }
  return fecha > hoy;
}

// Devuelve el mismo día restando una cantidad de días.
function restarDias(fecha, dias) {
  const copia = new Date(fecha);
  copia.setDate(copia.getDate() - dias);
  return copia;
}

// Solo minutos numéricos y mayores que 0 (por si hay datos corruptos).
function minutosValidos(minutos) {
  return Number.isFinite(minutos) && minutos > 0;
}

// Pinta la fecha en español: "6 de octubre de 2026".
function formatearFecha(texto) {
  // Fecha corrupta: la mostramos tal cual (RF-2, enmienda E1).
  // Mejor ver «abc» en la lista que un RangeError que rompa la página.
  if (!fechaValida(texto)) {
    return texto;
  }
  const fecha = fechaDesdeTexto(texto);
  const opciones = { day: "numeric", month: "long", year: "numeric" };
  return new Intl.DateTimeFormat("es-ES", opciones).format(fecha);
}

// =========================================================
// Mapa de calor - cálculos
// =========================================================

// Los 182 días de la ventana: 26 semanas completas (lunes a
// domingo) que terminan en la semana actual.
// Devuelve textos "AAAA-MM-DD" en orden cronológico.
function diasDelMapaCalor(hoy) {
  const fechaHoy = fechaDesdeTexto(hoy);

  // Lunes de la semana actual (misma regla que en app.js:
  // getDay() devuelve 0 el domingo, por eso se envuelve).
  const diasDesdeLunes = (fechaHoy.getDay() + 6) % 7;
  const lunesActual = restarDias(fechaHoy, diasDesdeLunes);

  // La primera columna es la semana del lunes hace 25 semanas.
  const primerDia = restarDias(lunesActual, 25 * 7);

  const dias = [];
  const actual = new Date(primerDia);
  for (let i = 0; i < 26 * 7; i++) {
    dias.push(fechaLocal(actual));
    actual.setDate(actual.getDate() + 1);
  }
  return dias;
}

// Minutos totales de cada día de la ventana: { "AAAA-MM-DD": minutos }.
// Mismas reglas que el resto de estadísticas: solo minutos válidos
// y nunca días futuros (aunque hubiera datos corruptos con fecha futura).
function totalesPorDia(sesiones, dias, hoy) {
  const porDia = {};
  sesiones.forEach(function (sesion) {
    // La fecha corrupta (o no texto) se descarta el primero (RF-2).
    const laFechaEsValida = fechaValida(sesion.fecha);
    const enLaVentana = dias.includes(sesion.fecha);
    const noFutura = sesion.fecha <= hoy; // El texto ordenado sigue el orden cronológico.
    if (laFechaEsValida && enLaVentana && noFutura && minutosValidos(sesion.minutos)) {
      porDia[sesion.fecha] = (porDia[sesion.fecha] || 0) + sesion.minutos;
    }
  });
  // Redondeamos al final, después de sumar (10,4 + 10,4 = 21).
  // Un total que redondea a 0 se queda con 0: celda vacía y
  // no sube el máximo.
  Object.keys(porDia).forEach(function (clave) {
    porDia[clave] = Math.round(porDia[clave]);
  });
  return porDia;
}

// El mayor total diario de la ventana (0 si no hay minutos).
function maximoDiario(totales) {
  let maximo = 0;
  Object.values(totales).forEach(function (minutos) {
    if (minutos > maximo) {
      maximo = minutos;
    }
  });
  return maximo;
}

// Los tres cortes enteros de la escala: 1/4, 2/4 y 3/4 del máximo.
// Precondición: entero >= 1. Quien llama filtra antes: nivelDeMinutos
// con max <= 0 devuelve 0 y rangosDeLeyenda con max <= 0 devuelve null.
function cortesDeNiveles(maximo) {
  return [
    Math.ceil(maximo / 4),
    Math.ceil(maximo / 2),
    Math.ceil((maximo * 3) / 4)
  ];
}

// Nivel de color de un día: 0 = vacío y 1 a 4 = cada vez más intenso.
// Escala relativa al máximo del periodo, con cortes enteros
// (un valor justo en el corte sube de nivel).
function nivelDeMinutos(minutos, maximo) {
  if (maximo <= 0 || minutos <= 0) {
    return 0;
  }
  const cortes = cortesDeNiveles(maximo);
  if (minutos >= cortes[2]) {
    return 4;
  }
  if (minutos >= cortes[1]) {
    return 3;
  }
  if (minutos >= cortes[0]) {
    return 2;
  }
  return 1;
}

// Los rangos en minutos de los 4 tonos de la leyenda, a partir
// del máximo (p. ej. con máximo 60: "1-14 min" … "45-60 min").
// Devuelve null si en la ventana no hay ningún minuto.
function rangosDeLeyenda(maximo) {
  if (maximo <= 0) {
    return null;
  }
  // Mismos cortes que nivelDeMinutos (compartidos) para que el
  // primer entero de cada rango esté siempre en su nivel.
  const cortes = cortesDeNiveles(maximo);
  const inicios = [1, cortes[0], cortes[1], cortes[2]];
  const fines = [cortes[0] - 1, cortes[1] - 1, cortes[2] - 1, maximo];

  return inicios.map(function (inicio, i) {
    if (inicio > fines[i]) {
      return "—"; // Rango imposible con este máximo (máximos muy bajos).
    }
    // Los números, en es-ES (el millar con punto: "926-1.234 min").
    const desde = inicio.toLocaleString("es-ES");
    const hasta = fines[i].toLocaleString("es-ES");
    if (inicio === fines[i]) {
      return desde + " min";
    }
    return desde + "-" + hasta + " min";
  });
}

// Etiqueta de mes para cada una de las 26 columnas ("abr", "",
// "may"…). Sale en la primera columna cuyo lunes entra en un
// mes nuevo. Si el mes es de otro año que el inicio de la
// ventana, se añade el año ("ene 2027").
function etiquetasDeMes(dias) {
  const anioInicio = fechaDesdeTexto(dias[0]).getFullYear();
  const mesesCortos = ["ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic"];
  const etiquetas = [];
  let mesAnterior = null;

  for (let columna = 0; columna < 26; columna++) {
    const lunes = fechaDesdeTexto(dias[columna * 7]);
    if (columna === 0 || lunes.getMonth() !== mesAnterior) {
      let texto = mesesCortos[lunes.getMonth()];
      if (lunes.getFullYear() !== anioInicio) {
        texto = texto + " " + lunes.getFullYear();
      }
      etiquetas.push(texto);
    } else {
      etiquetas.push("");
    }
    mesAnterior = lunes.getMonth();
  }
  return etiquetas;
}

// Texto de detalle de una celda: "7 de octubre de 2026: 45 min".
function descripcionDeCelda(fecha, minutos) {
  const fechaTexto = formatearFecha(fecha);
  if (minutos <= 0) {
    return fechaTexto + ": sin minutos";
  }
  return fechaTexto + ": " + minutos.toLocaleString("es-ES") + " min";
}

// =========================================================
// Objetivo semanal
// =========================================================

// Valida el objetivo fijado por la usuaria: devuelve el entero
// si es un número entero mayor o igual que 1, y null en cualquier
// otro caso (texto, decimal, 0, negativos, NaN, null, undefined,
// objetos…). «Sin objetivo» es siempre null (D3) y nunca lanza
// excepciones con entradas corruptas (RF-1, RF-2, RNF-4).
function objetivoValido(valor) {
  if (!Number.isInteger(valor) || valor < 1) {
    return null;
  }
  return valor;
}

// Lee lo que haya guardado en la clave del objetivo (texto de
// localStorage o cualquier otra cosa) y lo convierte en objetivo.
// La clave puede estar corrupta (JSON malformado, números, null…),
// así que el JSON.parse va con try/catch y nunca lanza: lo que no
// sea un entero >= 1 es «sin objetivo» = null (RF-2, D4).
function objetivoDesdeTexto(texto) {
  try {
    return objetivoValido(JSON.parse(texto));
  } catch (error) {
    return null;
  }
}

// Minutos de la semana en curso: de lunes a hoy (inclusive).
// Regla idéntica a la tarjeta «Esta semana» (D12): el rango se
// compara por textos "AAAA-MM-DD" (el orden como texto es el
// cronológico) y solo suman los minutosValidos, sin fechaValida,
// para que el total y el gráfico nunca diverjan (RF-3, RF-7).
function minutosDeSemana(sesiones, hoy) {
  if (typeof hoy !== "string" || !Array.isArray(sesiones)) {
    return 0; // sin lanzar nunca (contrato §5)
  }

  const fechaHoy = fechaDesdeTexto(hoy);

  // Mismo lunes que la tarjeta: getDay() devuelve 0 el domingo,
  // por eso se envuelve (RNF-2: todo en fecha local).
  const diasDesdeLunes = (fechaHoy.getDay() + 6) % 7;
  const lunes = fechaLocal(restarDias(fechaHoy, diasDesdeLunes));

  let total = 0;
  sesiones.forEach(function (sesion) {
    // Sesión basura (null, sin objeto): se ignora sin lanzar.
    if (sesion === null || typeof sesion !== "object") {
      return;
    }
    if (sesion.fecha >= lunes && sesion.fecha <= hoy && minutosValidos(sesion.minutos)) {
      total = total + sesion.minutos;
    }
  });
  return total;
}

// Porcentaje de avance hacia el objetivo: entero 0–100 con
// Math.round y tope (RF-4). Objetivo no válido (null = «sin
// objetivo», D3) o minutos no finitos o < 0 → 0, así que nunca
// hay división por cero ni excepciones con entradas corruptas
// (P8, RNF-4).
function porcentajeDeProgreso(minutos, objetivo) {
  if (objetivoValido(objetivo) === null) {
    return 0;
  }
  if (!Number.isFinite(minutos) || minutos < 0) {
    return 0;
  }
  const calculado = Math.round((minutos * 100) / objetivo);
  return Math.min(100, Math.max(0, calculado));
}

// Texto de progreso «X de Y min» en es-ES (RF-3, RF-6, RNF-8):
// millares con punto desde la 5.ª cifra y decimales con coma sin
// redondear (D14, p. ej. «90,5 de 300 min»). Sin objetivo válido
// → null (D3), que es lo que la interfaz usa para pintar el estado
// vacío. Minutos basura (no finitos o negativos) se muestran como 0,
// la misma regla que porcentajeDeProgreso: nunca lanza excepciones
// (RNF-4).
function textoDeProgreso(minutos, objetivo) {
  if (objetivoValido(objetivo) === null) {
    return null;
  }
  const minutosAMostrar = Number.isFinite(minutos) && minutos > 0 ? minutos : 0;
  return minutosAMostrar.toLocaleString("es-ES") +
    " de " + objetivo.toLocaleString("es-ES") + " min";
}

// ¿Cumple el objetivo? true al ALCANZAR o superar (D-8: 300 de 300
// cuenta). Objetivo no válido (null = «sin objetivo», D3) o minutos
// no finitos → false; con decimales heredados compara tal cual
// (90,5 con objetivo 90 → true). Nunca lanza excepciones con
// entradas corruptas (RF-4, RF-5, RNF-4).
function objetivoCumplido(minutos, objetivo) {
  if (objetivoValido(objetivo) === null) {
    return false;
  }
  if (!Number.isFinite(minutos)) {
    return false;
  }
  return minutos >= objetivo;
}

// En el navegador este bloque no existe; en node exporta las
// funciones para que las pruebas (node --test) puedan usarlas.
if (typeof module !== "undefined") {
  module.exports = {
    fechaLocal,
    fechaDesdeTexto,
    fechaValida,
    fechaFutura,
    restarDias,
    minutosValidos,
    formatearFecha,
    diasDelMapaCalor,
    totalesPorDia,
    maximoDiario,
    cortesDeNiveles,
    nivelDeMinutos,
    rangosDeLeyenda,
    etiquetasDeMes,
    descripcionDeCelda,
    objetivoValido,
    objetivoDesdeTexto,
    minutosDeSemana,
    porcentajeDeProgreso,
    textoDeProgreso,
    objetivoCumplido
  };
}
