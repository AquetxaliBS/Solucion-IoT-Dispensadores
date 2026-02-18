# Sistema IoT de Dispensadores de Alimento para Ganado

## Descripción del proyecto

Este proyecto implementa una aplicación web orientada a la simulación, control y monitoreo de dispositivos IoT aplicados al sector agropecuario. La solución representa un sistema de dispensadores automáticos de alimento para ganado, específicamente para zacate, alfalfa y grano.

La aplicación permite simular el funcionamiento de los dispositivos, registrar eventos en una API REST y visualizar información histórica y en tiempo casi real mediante gráficas y tablas, siguiendo principios básicos de una arquitectura IoT.

---

## Características principales

- Simulación de tres dispositivos IoT:
  - Dispensador de zacate
  - Dispensador de alfalfa
  - Dispensador de grano
- Pestaña de **Control** con:
  - Estado del dispensador (apagado, dispensando, error)
  - Nivel de alimento simulado
  - Ingreso de peso a dispensar
  - Simulación de errores por falta de alimento
  - Registro de eventos en la API
- Pestaña de **Monitoreo** con:
  - Selección de dispensador
  - Gráficas de estado y peso a lo largo del tiempo
  - Tabla con los últimos 10 eventos registrados
  - Refresco automático cada 2 segundos
- Comunicación asíncrona usando Fetch y Async/Await
- Interfaz moderna desarrollada con Bootstrap

---

## Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript (Vanilla)
- Bootstrap 5
- Fetch API con Async/Await
- MockAPI (API REST simulada)
- Git y GitHub para control de versiones

---

## Estructura del proyecto

/
├── index.html
├── css/
│ └── styles.css
├── js/
│ ├── api.js
│ ├── control.js
│ └── monitor.js
└── README.md


---

## Funcionamiento general

### Control

La pestaña de control simula que los dispositivos IoT están conectados físicamente. Cada dispensador cuenta con un peso disponible generado de forma aleatoria (entre 0 y 40,000 gramos). Al activar un dispensador:

- El estado cambia a “Dispensando” durante 4 segundos.
- Se valida si el peso solicitado es menor o igual al peso disponible.
- Si la validación falla, el dispositivo entra en estado de error.
- Se registra un evento en la API con la información correspondiente.

### Monitoreo

La pestaña de monitoreo consume datos reales desde la API REST y permite:

- Visualizar gráficas basadas en el estado y el peso del dispensador.
- Consultar el historial reciente de eventos.
- Actualizar la información automáticamente cada 2 segundos.

---

## Reglas lógicas del sistema

- Estados del dispensador:
  - 1: Apagado
  - 2: Dispensando
  - 3: Error
- Niveles de alimento:
  - Lleno: 40,000 g
  - Medio: 20,000 g
  - Vacío: menos de 5,000 g
- No se permite dispensar un peso mayor al disponible.
- Cada activación genera un registro con fecha y hora local.

---

## Alcances y limitaciones

Este proyecto es una simulación académica. No se integra hardware real, sensores físicos ni protocolos IoT específicos como MQTT. Sin embargo, la arquitectura y la lógica implementadas permiten una futura escalabilidad hacia un entorno productivo.

---

## Autor

Proyecto desarrollado como práctica académica para la asignatura de Introducción al Internet de las Cosas.

Ing. Sistemas Computacionales
Aquetxali Barrera Sansabas 22550039

---

## Licencia

Este proyecto se distribuye con fines educativos.