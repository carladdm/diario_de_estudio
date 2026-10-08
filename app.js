// =========================================================
// Diario de Estudio - JavaScript
// Guarda las sesiones en localStorage y calcula las estadísticas.
// =========================================================

// Clave para guardar los datos en localStorage.
const CLAVE = "diario-estudio-sesiones";

// Clave aparte para el objetivo semanal: guarda un JSON entero (p. ej. 300).
const CLAVE_OBJETIVO = "diario-estudio-objetivo-semanal";

// Cargamos las sesiones que ya estén guardadas.
let sesiones = cargarSesiones();

// Objetivo semanal en minutos; null = sin objetivo.
let objetivoSemanal = cargarObjetivo();

// Referencias a los elementos de la página.
const formulario = document.getElementById("formulario");
const inputFecha = document.getElementById("fecha");
const listaSesiones = document.getElementById("lista-sesiones");
const listaVacia = document.getElementById("lista-vacia");
const rachaDias = document.getElementById("racha-dias");
const rachaTexto = document.getElementById("racha-texto");
const mejorDias = document.getElementById("mejor-dias");
const mejorTexto = document.getElementById("mejor-texto");
const minutosSemana = document.getElementById("minutos-semana");
const graficoSemana = document.getElementById("grafico-semana");
const diasMes = document.getElementById("dias-mes");
const diasMesTexto = document.getElementById("dias-mes-texto");
const mapaCalor = document.getElementById("mapa-calor");
const mapaLeyenda = document.getElementById("mapa-leyenda");
// Bloque del objetivo. El campo está aquí solo para el guardado:
// pintarObjetivo nunca lo toca, solo se rellena al abrir y tras guardar (D9).
const objetivoVacio = document.getElementById("objetivo-vacio");
const objetivoTexto = document.getElementById("objetivo-texto");
const objetivoBarra = document.getElementById("objetivo-barra");
const objetivoRelleno = document.getElementById("objetivo-barra-relleno");
const mensajeCumplido = document.getElementById("objetivo-cumplido");
const formularioObjetivo = document.getElementById("formulario-objetivo");
const campoObjetivo = document.getElementById("objetivo-minutos");

// Al abrir, el campo muestra el objetivo guardado (y lo tecleado sin guardar
// nunca se pisa en un repintado: D9).
if (objetivoSemanal !== null) {
  campoObjetivo.value = String(objetivoSemanal);
}

// Ponemos la fecha de hoy en el formulario (por defecto).
inputFecha.value = fechaLocal(new Date());

// El límite del campo de fecha es siempre "hoy": se fija al abrir,
// en cada repintado y al enfocar el campo, por si la app queda
// abierta al cambiar de día. Sin temporizadores (RF-11).
function actualizarMaxFecha() {
  inputFecha.max = fechaLocal(new Date());
}
actualizarMaxFecha();
inputFecha.addEventListener("focus", actualizarMaxFecha);
inputFecha.addEventListener("change", actualizarMaxFecha);

// =========================================================
// Guardar y cargar datos
// =========================================================

function cargarSesiones() {
  try {
    const texto = localStorage.getItem(CLAVE);
    if (!texto) {
      return [];
    }
    const datos = JSON.parse(texto);
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    return [];
  }
}

function guardarSesiones() {
  localStorage.setItem(CLAVE, JSON.stringify(sesiones));
}

function cargarObjetivo() {
  try {
    const texto = localStorage.getItem(CLAVE_OBJETIVO);
    if (!texto) {
      return null;
    }
    // Un valor corrupto se trata como "sin objetivo" (null) y la clave
    // no se borra: solo se sobrescribe si la usuaria guarda otro (D6).
    return objetivoDesdeTexto(texto);
  } catch (error) {
    return null;
  }
}

function guardarObjetivo(valor) {
  try {
    localStorage.setItem(CLAVE_OBJETIVO, JSON.stringify(valor));
  } catch (error) {
    // localStorage no disponible: el objetivo no se guarda, pero la app sigue.
  }
}

// =========================================================
// Fechas (siempre en la hora local, nunca en UTC)
// =========================================================
// Las funciones de fechas (fechaLocal, fechaDesdeTexto,
// restarDias, minutosValidos y formatearFecha) viven en
// calor.js, que se carga antes que app.js: así el mapa de
// calor y las pruebas comparten una única copia.

// =========================================================
// Racha
// =========================================================

function calcularRacha() {
  // Guardamos en un conjunto todos los días que tienen sesión.
  const diasConSesion = new Set(sesiones.map(function (sesion) {
    return sesion.fecha;
  }));

  // Empezamos por hoy. Si hoy todavía no hay sesión,
  // la racha sigue viva desde ayer (no se rompe hasta que termine el día).
  let dia = new Date();
  if (!diasConSesion.has(fechaLocal(dia))) {
    dia = restarDias(dia, 1);
    if (!diasConSesion.has(fechaLocal(dia))) {
      return 0;
    }
  }

  // Contamos los días consecutivos hacia atrás.
  let racha = 0;
  while (diasConSesion.has(fechaLocal(dia))) {
    racha = racha + 1;
    dia = restarDias(dia, 1);
  }
  return racha;
}

// La mejor racha es el tramo más largo de días consecutivos con sesión.
// Ignora las fechas futuras (no suman) y cuenta cada día una sola vez.
function calcularMejorRacha() {
  const hoy = fechaLocal(new Date());

  // Días únicos con sesión, sin futuros y de menor a mayor.
  // Un texto "AAAA-MM-DD" ordenado como texto ya va en orden cronológico.
  const dias = Array.from(new Set(sesiones.map(function (sesion) {
    return sesion.fecha;
  }))).filter(function (dia) {
    return dia <= hoy;
  }).sort();

  let mejor = 0;
  let tramo = 0;
  let diaAnterior = null;

  dias.forEach(function (dia) {
    // Comprobamos si este día es justo el siguiente al anterior de la lista.
    const diaPrevio = fechaLocal(restarDias(fechaDesdeTexto(dia), 1));
    if (diaAnterior !== null && diaAnterior === diaPrevio) {
      tramo = tramo + 1;
    } else {
      tramo = 1;
    }
    if (tramo > mejor) {
      mejor = tramo;
    }
    diaAnterior = dia;
  });

  return mejor;
}

// =========================================================
// Semana (de lunes a domingo, siempre en fecha local)
// =========================================================

// Devuelve la fecha del lunes de la semana en la que estamos.
function inicioDeLaSemana() {
  const hoy = new Date();
  const diasDesdeLunes = (hoy.getDay() + 6) % 7; // getDay(): 0 = domingo … 6 = sábado.
  return restarDias(hoy, diasDesdeLunes);
}

// Los 7 días de la semana como textos "AAAA-MM-DD", de lunes a domingo.
function diasDeLaSemana() {
  const inicio = inicioDeLaSemana();
  const dias = [];
  for (let i = 0; i < 7; i++) {
    // El constructor de Date suma los días y corrige mes y año solo.
    const dia = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
    dias.push(fechaLocal(dia));
  }
  return dias;
}

// ¿La fecha está entre el lunes de esta semana y hoy? (Las futuras no cuentan.)
// Comparamos textos "AAAA-MM-DD": el orden como texto es el orden cronológico.
function esDeLaSemana(fecha) {
  const inicio = fechaLocal(inicioDeLaSemana());
  const hoy = fechaLocal(new Date());
  return fecha >= inicio && fecha <= hoy;
}

// Minutos de cada día de la semana: un mapa { "AAAA-MM-DD": minutos }.
function minutosPorDia() {
  const porDia = {};
  sesiones.forEach(function (sesion) {
    if (esDeLaSemana(sesion.fecha) && minutosValidos(sesion.minutos)) {
      porDia[sesion.fecha] = (porDia[sesion.fecha] || 0) + sesion.minutos;
    }
  });
  return porDia;
}

// =========================================================
// Mes calendario (siempre en fecha local)
// =========================================================

// Días con al menos una sesión desde el día 1 del mes hasta hoy.
// Varias sesiones el mismo día cuentan una sola vez, y una sesión
// cuenta aunque sus minutos no sean válidos (misma regla que la racha).
function diasEstudiadosEsteMes() {
  const hoy = new Date();
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const desde = fechaLocal(primerDia);
  const hasta = fechaLocal(hoy);

  // Fechas como texto: el orden como texto es el orden cronológico.
  const dias = new Set(sesiones.filter(function (sesion) {
    return sesion.fecha >= desde && sesion.fecha <= hasta;
  }).map(function (sesion) {
    return sesion.fecha;
  }));

  return dias.size;
}

// =========================================================
// Pintar la página
// =========================================================

function pintarRacha() {
  const racha = calcularRacha();
  rachaDias.textContent = racha;
  rachaTexto.textContent = textoDias(racha);

  const mejor = calcularMejorRacha();
  mejorDias.textContent = mejor;
  mejorTexto.textContent = textoDias(mejor);
}

function textoDias(cantidad) {
  const palabra = cantidad === 1 ? "día" : "días";
  return cantidad + " " + palabra + " seguidos estudiando";
}

function pintarSemana() {
  // La suma de la semana (lunes…hoy) es la función pura de calor.js:
  // misma regla que el gráfico y el objetivo, una única copia (D2).
  const total = minutosDeSemana(sesiones, fechaLocal(new Date()));
  minutosSemana.textContent = total.toLocaleString("es-ES");

  const porDia = minutosPorDia();
  const dias = diasDeLaSemana();
  const hoy = fechaLocal(new Date());

  // El día con más minutos marca la altura máxima del gráfico.
  let maximo = 0;
  dias.forEach(function (dia) {
    if ((porDia[dia] || 0) > maximo) {
      maximo = porDia[dia];
    }
  });

  const nombres = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

  graficoSemana.textContent = "";
  dias.forEach(function (dia, posicion) {
    const minutos = porDia[dia] || 0;

    const columna = document.createElement("div");
    columna.className = "grafico-dia";
    if (dia === hoy) {
      columna.className = columna.className + " hoy";
    } else if (dia > hoy) {
      columna.className = columna.className + " futuro";
    }

    // Minutos encima de la barra (solo se ven si hay).
    const cantidad = document.createElement("span");
    cantidad.className = "grafico-minutos";
    cantidad.textContent = minutos > 0 ? minutos.toLocaleString("es-ES") : "";

    const area = document.createElement("div");
    area.className = "grafico-area";

    const barra = document.createElement("div");
    barra.className = "grafico-barra";
    const porcentaje = maximo > 0 ? Math.round((minutos / maximo) * 100) : 0;
    barra.style.height = porcentaje + "%";
    barra.title = nombres[posicion] + ": " + minutos + " min";
    area.appendChild(barra);

    const etiqueta = document.createElement("span");
    etiqueta.className = "grafico-etiqueta";
    etiqueta.textContent = nombres[posicion].substring(0, 3);

    columna.appendChild(cantidad);
    columna.appendChild(area);
    columna.appendChild(etiqueta);
    graficoSemana.appendChild(columna);
  });
}

function pintarMes() {
  const dias = diasEstudiadosEsteMes();
  diasMes.textContent = dias;

  // Plural con el adjetivo también: "1 día estudiado" / "7 días estudiados".
  const palabra = dias === 1 ? "día" : "días";
  const adjetivo = dias === 1 ? "estudiado" : "estudiados";
  diasMesTexto.textContent = palabra + " " + adjetivo;
}

function ordenarSesiones() {
  // De la más reciente a la más antigua.
  return sesiones.slice().sort(function (a, b) {
    if (a.fecha === b.fecha) {
      return b.id - a.id; // Si es el mismo día, la última registrada primero.
    }
    return a.fecha < b.fecha ? 1 : -1;
  });
}

function pintarLista() {
  listaSesiones.textContent = "";
  listaVacia.hidden = sesiones.length > 0;

  ordenarSesiones().forEach(function (sesion) {
    const item = document.createElement("li");
    item.className = "elemento";

    const bloque = document.createElement("div");

    const tema = document.createElement("p");
    tema.className = "elemento-tema";
    tema.textContent = sesion.tema;

    const meta = document.createElement("p");
    meta.className = "elemento-meta";
    meta.textContent = formatearFecha(sesion.fecha);

    bloque.appendChild(tema);
    bloque.appendChild(meta);

    const minutos = document.createElement("span");
    minutos.className = "elemento-minutos";
    minutos.textContent = sesion.minutos + " min";

    item.appendChild(bloque);
    item.appendChild(minutos);
    listaSesiones.appendChild(item);
  });
}

// =========================================================
// Mapa de calor (el cálculo vive en calor.js)
// =========================================================

function pintarCalor() {
  const hoy = fechaLocal(new Date());
  const dias = diasDelMapaCalor(hoy);
  const totales = totalesPorDia(sesiones, dias, hoy);
  const maximo = maximoDiario(totales);
  const nombresDias = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

  mapaCalor.textContent = "";

  // Rótulos de día de la semana, a la izquierda.
  // El primer espacio en blanco pone a la altura la fila de meses.
  const rotulos = document.createElement("div");
  rotulos.className = "mapa-rotulos";
  const huecoMeses = document.createElement("span");
  huecoMeses.className = "mapa-mes";
  rotulos.appendChild(huecoMeses);
  nombresDias.forEach(function (nombre) {
    const rotulo = document.createElement("span");
    rotulo.className = "mapa-rotulo";
    rotulo.textContent = nombre;
    rotulos.appendChild(rotulo);
  });
  mapaCalor.appendChild(rotulos);

  // 26 columnas: una por semana, con sus 7 días.
  const etiquetas = etiquetasDeMes(dias);
  for (let columna = 0; columna < 26; columna++) {
    const caja = document.createElement("div");
    caja.className = "mapa-columna";

    const mes = document.createElement("span");
    mes.className = "mapa-mes";
    mes.textContent = etiquetas[columna];
    caja.appendChild(mes);

    for (let fila = 0; fila < 7; fila++) {
      const dia = dias[columna * 7 + fila];
      const minutos = totales[dia] || 0;

      const celda = document.createElement("div");
      celda.className = "mapa-celda nivel-" + nivelDeMinutos(minutos, maximo);

      // La misma fecha y minutos como texto: se ven al pasar
      // el cursor y las lee el lector de pantalla.
      const detalle = descripcionDeCelda(dia, minutos);
      celda.title = detalle;
      celda.setAttribute("role", "img");
      celda.setAttribute("aria-label", detalle);

      caja.appendChild(celda);
    }
    mapaCalor.appendChild(caja);
  }

  pintarLeyenda(maximo);
}

function pintarLeyenda(maximo) {
  mapaLeyenda.textContent = "";

  // El nivel vacío ("0 min") siempre; los 4 rangos solo si hay minutos.
  const rangos = rangosDeLeyenda(maximo) || [];
  const textos = ["0 min"].concat(rangos);

  textos.forEach(function (texto, nivel) {
    const item = document.createElement("span");
    item.className = "leyenda-item";

    const muestra = document.createElement("span");
    muestra.className = "leyenda-muestra nivel-" + nivel;
    muestra.setAttribute("aria-hidden", "true");

    const etiqueta = document.createElement("span");
    etiqueta.textContent = texto;

    item.appendChild(muestra);
    item.appendChild(etiqueta);
    mapaLeyenda.appendChild(item);
  });
}

// =========================================================
// Objetivo semanal
// =========================================================
// Se recalcula siempre dentro de pintarTodo(), sin temporizadores (D15),
// y nunca escribe en el campo del formulario (D9).

function pintarObjetivo() {
  const hayObjetivo = objetivoSemanal !== null;

  objetivoVacio.hidden = hayObjetivo;
  objetivoTexto.hidden = !hayObjetivo;
  objetivoBarra.hidden = !hayObjetivo;
  mensajeCumplido.hidden = true;

  if (!hayObjetivo) {
    // Sin objetivo no se enseña ningún progreso (RF-1.2).
    return;
  }

  // Misma semana que la tarjeta: lunes…hoy en fecha local (D12).
  const minutos = minutosDeSemana(sesiones, fechaLocal(new Date()));
  const texto = textoDeProgreso(minutos, objetivoSemanal);

  objetivoTexto.textContent = texto;
  objetivoRelleno.style.width = porcentajeDeProgreso(minutos, objetivoSemanal) + "%";
  // La barra se lee también como texto: mismo contenido que visible (D10).
  objetivoBarra.setAttribute("aria-label", texto);
  // Alcanzar o superar el objetivo cuenta como cumplido (D-8).
  mensajeCumplido.hidden = !objetivoCumplido(minutos, objetivoSemanal);
}

function pintarTodo() {
  pintarRacha();
  pintarSemana();
  pintarMes();
  pintarCalor();
  pintarLista();
  pintarObjetivo();
  actualizarMaxFecha(); // que el límite no se quede anticuado (RF-11)
}

// =========================================================
// Registrar una sesión nueva
// =========================================================

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const fecha = inputFecha.value;
  const tema = formulario.tema.value.trim();
  const minutos = Number(formulario.minutos.value);

  // Comprobación extra por si acaso (además de los "required" del HTML).
  if (!fecha || tema === "" || !Number.isFinite(minutos) || minutos <= 0) {
    return;
  }

  // «Hoy» calculado en este instante: sin fecha futura aunque la app
  // haya cruzado la medianoche. El "max" nativo ya lo bloquea antes;
  // esta es la red de seguridad (RF-11, guarda silenciosa).
  if (fechaFutura(fecha, fechaLocal(new Date()))) {
    return;
  }

  sesiones.push({
    id: Date.now(),
    fecha: fecha,
    tema: tema,
    minutos: minutos
  });

  guardarSesiones();

  // Limpiamos el formulario y dejamos la fecha en hoy otra vez.
  formulario.reset();
  inputFecha.value = fechaLocal(new Date());

  pintarTodo();
});

// =========================================================
// Guardar el objetivo semanal
// =========================================================

formularioObjetivo.addEventListener("submit", function (evento) {
  // Con <form> y botón submit, Enter también envía; la página no se recarga.
  evento.preventDefault();

  // La validación nativa ya bloquea vacío, 0, negativos y decimales;
  // esta comprobación es la red de seguridad (mismo patrón que sesiones).
  // Si no es válido, no se guarda y el campo conserva lo tecleado.
  const valor = objetivoValido(Number(campoObjetivo.value));
  if (valor === null) {
    return;
  }

  objetivoSemanal = valor;
  guardarObjetivo(valor);

  // D9: el campo solo se escribe al abrir y tras guardar.
  campoObjetivo.value = String(valor);

  pintarTodo();
});

// Primer pintado al abrir la página.
pintarTodo();
