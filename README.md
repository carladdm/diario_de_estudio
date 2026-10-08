# Diario de Estudio

## Descripción

Diario de Estudio es una aplicación web estática para registrar sesiones de estudio y visualizar el progreso a lo largo del tiempo. Su objetivo es fomentar la constancia mostrando la racha de días consecutivos con estudio, estadísticas semanales y mensuales, un mapa de calor y un objetivo semanal configurable.

Diseñado con un enfoque didáctico: el código está pensado para que pueda entenderlo alguien que está empezando a programar. Funciona completamente en el navegador, sin necesidad de servidor.

## Tecnologías

- **HTML5** - Estructura de la aplicación
- **CSS3** - Estilos y diseño responsive  
- **JavaScript (Vanilla)** - Lógica y manipulación del DOM
- Sin frameworks, librerías, dependencias, bundlers ni proceso de build

## Características

- **Registro de sesiones**: Añade sesiones con fecha, tema y minutos de estudio
- **Rachas**: Muestra racha actual y mejor racha de días consecutivos con al menos una sesión
- **Estadísticas semanales**: Total de minutos de la semana (lunes a domingo) con gráfico de barras
- **Objetivo semanal**: Fija un objetivo de minutos por semana y visualiza el progreso con barra y mensaje de cumplimiento
- **Estadísticas mensuales**: Días estudiados del mes calendario
- **Mapa de calor**: Visualización de actividad en las últimas 26 semanas
- **Persistencia local**: Los datos se guardan en `localStorage` del navegador
- **Responsive**: Diseño adaptado para móviles y ordenadores
- **Accesible**: Cumple con contraste mínimo 4,5:1 para texto

## Uso local

La aplicación funciona abriendo `index.html` directamente con doble clic (modo `file://`). No requiere servidor web ni instalación de dependencias.

1. Descarga o clona este repositorio
2. Abre `index.html` en tu navegador
3. ¡Empieza a registrar tus sesiones de estudio!

## Estructura del repositorio

```
.
├── .agents/           # Configuración y skills para agentes IA
├── .opencode/         # Configuración de OpenCode
├── docs/              # Documentación (constitución, guías)
├── specs/             # Especificaciones y planes (001-heat-map, 002-objetivo-semanal)
├── tests/             # Pruebas automatizadas con node:test
├── AGENTS.md          # Instrucciones para agentes IA
├── MEMORY.md          # Memoria del proyecto y decisiones
├── app.js             # Lógica de la aplicación y manejo del DOM
├── calor.js           # Funciones puras de cálculo (fechas, rachas, estadísticas)
├── index.html         # Estructura HTML
├── opencode.json      # Configuración de agente
├── skills-lock.json   # Lock de skills
├── styles.css         # Estilos CSS
└── README.md          # Este archivo
```

## Ejecutar tests

El proyecto utiliza el test runner nativo de Node.js (`node --test`), sin paquetes externos.

```bash
node --test
```

**Estado actual**: 36 tests en verde (24 tests existentes + 12 nuevos para el objetivo semanal O1–O12).

## Notas técnicas

### Fechas y zona horaria

- **Siempre en hora local**: Todos los cálculos usan `getFullYear()`, `getMonth()`, `getDate()` para evitar desplazamientos de día
- **Prohibido**: No se usa `toISOString()` ni `new Date("AAAA-MM-DD")` (se interpretan en UTC)
- **Racha**: Días consecutivos con al menos 1 sesión que terminan hoy. Si hoy no hay sesión pero ayer sí, la racha sigue viva
- **Mejor racha**: Tramo más largo de días consecutivos con ≥1 sesión, ignorando fechas futuras
- **Semana**: Va de lunes 00:00 a domingo en fecha local

### Datos

- **Sesiones**: `localStorage` clave `diario-estudio-sesiones` - Array de `{ id, fecha: "AAAA-MM-DD", tema, minutos }`
- **Objetivo semanal**: `localStorage` clave `diario-estudio-objetivo-semanal` - Número entero (≥1) que representa minutos por semana
- **Compatibilidad hacia atrás**: Se mantiene compatibilidad con datos ya guardados. No se eliminan sesiones existentes al añadir nuevas funcionalidades
- **Varias sesiones el mismo día**: Cuentan como un solo día para las rachas

### Arquitectura

- **Lógica pura separada de interfaz**: Las funciones de cálculo (fechas, rachas, estadísticas, objetivo semanal) viven en `calor.js` y son puras (sin DOM ni `localStorage`), reciben la fecha "hoy" como parámetro
- **Integración en DOM**: `app.js` maneja la interfaz, eventos y persistencia
- **Testable**: Toda la lógica pura está cubierta por tests con `node --test`

### Desarrollo con agentes IA

Este proyecto utiliza **agentes IA** para asistir en el desarrollo. Las instrucciones para agentes están en `AGENTS.md`, incluyendo convenciones, reglas sobre fechas, formato de memoria y proceso de trabajo. Se han implementado funcionalidades siguiendo un enfoque de especificación primero (spec-driven development) con specs detalladas en `specs/`.

## Licencia

Este proyecto es de uso educativo/didáctico.

## Seguridad

- **Sin datos sensibles**: No se guardan claves, tokens ni información personal
- **Todo local**: Los datos nunca salen del navegador del usuario (solo `localStorage` local)
- **Sin dependencias externas**: Reduce la superficie de ataque al no incluir librerías de terceros