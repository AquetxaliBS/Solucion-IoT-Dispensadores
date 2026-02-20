// js/monitoreo.js

const monitoreoContent = document.getElementById('monitoreo-content');

// Plantilla HTML del panel de Monitoreo
monitoreoContent.innerHTML = `
    <div class="row mb-4">
        <div class="col-md-6 offset-md-3">
            <label class="form-label fw-bold">Selecciona un dispensador:</label>
            <select id="select-dispensador" class="form-select form-select-lg shadow-sm" onchange="iniciarMonitoreo()">
                <option value="">-- Elige un silo para monitorear --</option>
            </select>
        </div>
    </div>

    <div id="dashboard-panel" class="d-none">
        <div class="row mb-4">
            <div class="col-md-6 mb-3">
                <div class="card card-iot h-100 shadow-sm">
                    <div class="card-body">
                        <h6 class="text-center fw-bold text-secondary">Nivel histórico del contenido del silo (kg)</h6>
                        <canvas id="chart-contenido"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="card card-iot h-100 shadow-sm">
                    <div class="card-body d-flex flex-column align-items-center">
                        <h6 class="text-center fw-bold text-secondary mb-3 w-100">Distribución histórica de flujo (kg)</h6>
                        
                        <div style="position: relative; height: 250px; width: 100%; display: flex; justify-content: center;">
                            <canvas id="chart-eventos"></canvas>
                        </div>

                    </div>
                </div>
            </div>
        </div>

        <div class="card card-iot shadow-sm">
            <div class="card-body">
                <h6 class="fw-bold mb-3">Últimos 10 Registros de Operación</h6>
                <div class="table-responsive">
                    <table class="table table-striped table-hover table-sm text-center align-middle">
                        <thead class="table-dark">
                            <tr>
                                <th>Fecha y Hora</th>
                                <th>Tipo de Evento</th>
                                <th>Nivel Anterior (kg)</th> <th>Cantidad (kg)</th>
                                <th>Nivel Resultante (kg)</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-historial-body">
                            </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
`;

// Variables globales para almacenar las instancias de las gráficas y el temporizador
let chartContenido = null;
let chartEventos = null;
let intervaloRefresco = null;

// 1. Cargar los silos en la combobox al iniciar
async function cargarCombobox() {
    const select = document.getElementById('select-dispensador');
    const dispensadores = await getDispensadores();
    
    // Limpiar opciones previas (dejando la opción por defecto)
    select.innerHTML = '<option value="">-- Elige un silo para monitorear --</option>';

    dispensadores.forEach(disp => {
        const option = document.createElement('option');
        option.value = disp.id;
        option.textContent = `Silo #${disp.id} - ${disp.deviceName}`;
        select.appendChild(option);
    });
}

// 2. Función que se dispara al elegir un silo en la combobox
function iniciarMonitoreo() {
    const dispensadorId = document.getElementById('select-dispensador').value;
    const dashboard = document.getElementById('dashboard-panel');

    // Limpiar el temporizador anterior si existía
    if (intervaloRefresco) clearInterval(intervaloRefresco);

    if (!dispensadorId) {
        dashboard.classList.add('d-none'); // Ocultar si no hay nada seleccionado
        return;
    }

    // Mostrar panel y hacer la primera carga inmediatamente
    dashboard.classList.remove('d-none');
    actualizarDashboard(dispensadorId);

    // Iniciar el ciclo de refresco cada 2 segundos (2000 ms) - Regla 5c
    intervaloRefresco = setInterval(() => {
        // Solo actualizar si estamos en la pestaña de monitoreo
        if (!document.getElementById('section-monitoreo').classList.contains('d-none')) {
            actualizarDashboard(dispensadorId);
        }
    }, 2000);
}

// 3. Función principal: Obtiene datos, dibuja gráficas y llena la tabla
async function actualizarDashboard(dispensadorId) {
    const historialCompleto = await getHistorial(dispensadorId);

    // Obtener SOLO los últimos 10 registros para la tabla y la gráfica de líneas
    const ultimos10 = historialCompleto.slice(-10);

    // Arreglos para la gráfica de líneas (Nivel Histórico)
    const etiquetas = []; 
    const datosContenido = []; 

    // Variables para la gráfica de Dona (Acumulado Histórico de TODO el silo)
    let totalDispensado = 0;
    let totalRellenado = 0;
    let totalSustraccion = 0;

    // --- 1. Analizar TODO el historial para sacar estadísticas reales (Dona) ---
    historialCompleto.forEach(registro => {
        // Parseo seguro: Si el registro es viejo, busca los campos antiguos o usa 0
        let cantidad = parseFloat(registro.weightEvent) || parseFloat(registro.dispensedWeight) || parseFloat(registro.addWeight) || 0;
        
        if (registro.StatusCode === 2) {
            totalDispensado += cantidad;
        } else if (registro.StatusCode === 4) {
            totalRellenado += cantidad;
        } else if (registro.StatusCode === 5) {
            totalSustraccion += cantidad;
        }
    });

    // Redondear a 2 decimales para evitar números gigantes
    totalDispensado = parseFloat(totalDispensado.toFixed(2));
    totalRellenado = parseFloat(totalRellenado.toFixed(2));
    totalSustraccion = parseFloat(totalSustraccion.toFixed(2));

    const datosDona = [totalDispensado, totalSustraccion, totalRellenado];

    // --- 2. Preparar datos para la Gráfica de Líneas ---
    ultimos10.forEach(registro => {
        const fecha = new Date(registro.dateTime);
        etiquetas.push(fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        datosContenido.push(registro.currentWeight);
    });

    // --- 3. Llenar la Tabla con los últimos 10 registros ---
    const tbody = document.getElementById('tabla-historial-body');
    tbody.innerHTML = ''; // Limpiar tabla

    if (ultimos10.length === 0) {
        // Cambiamos a colspan="5" porque ahora tenemos 5 columnas
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay registros para este silo aún.</td></tr>';
        // Dibujamos las gráficas vacías para que no marquen error
        dibujarGraficas([], [], [0,0,0]);
        return;
    }

    // Llenar tabla (invertimos el arreglo visualmente para ver el más nuevo arriba)
    [...ultimos10].reverse().forEach(registro => {
        const fecha = new Date(registro.dateTime);
        const horaFormateada = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Parseo seguro también para la tabla
        let cantidad = parseFloat(registro.weightEvent) || parseFloat(registro.dispensedWeight) || parseFloat(registro.addWeight) || 0;
        let pesoActual = parseFloat(registro.currentWeight) || 0;

        // Identificar el tipo de evento
        let nombreEvento = 'Desconocido';
        let badgeColor = 'bg-secondary';

        switch(registro.StatusCode) {
            case 2: nombreEvento = 'Dispensado Automático'; badgeColor = 'bg-primary'; break;
            case 3: nombreEvento = 'Error (Falta de Peso)'; badgeColor = 'bg-danger'; break;
            case 4: nombreEvento = 'Rellenado de Silo'; badgeColor = 'bg-success'; break;
            case 5: nombreEvento = 'Sustracción / Consumo'; badgeColor = 'bg-warning text-dark'; break;
        }

        // Calcular el peso anterior
        let pesoAnterior = pesoActual; 
        
        if (registro.StatusCode === 2 || registro.StatusCode === 5) {
            pesoAnterior = pesoActual + cantidad;
        } else if (registro.StatusCode === 4) {
            pesoAnterior = pesoActual - cantidad;
        }
        
        // Redondeamos todo antes de imprimir
        pesoAnterior = parseFloat(pesoAnterior.toFixed(2));
        cantidad = parseFloat(cantidad.toFixed(2));
        pesoActual = parseFloat(pesoActual.toFixed(2));

        // Fila de la tabla con las 5 columnas
        tbody.innerHTML += `
            <tr>
                <td>${fecha.toLocaleDateString()} <br> <small class="text-muted">${horaFormateada}</small></td>
                <td><span class="badge ${badgeColor}">${nombreEvento}</span></td>
                <td class="text-muted fw-bold">${pesoAnterior} kg</td>
                <td class="fw-bold">${cantidad} kg</td>
                <td class="text-success fw-bold">${pesoActual} kg</td>
            </tr>
        `;
    });

    // --- 4. Dibujar o actualizar gráficas ---
    dibujarGraficas(etiquetas, datosContenido, datosDona);
}

// 4. Lógica de Chart.js
function dibujarGraficas(etiquetas, datosContenido, datosDona) {
    // Si la gráfica de líneas ya existe, actualizamos
    if (chartContenido) {
        chartContenido.data.labels = etiquetas;
        chartContenido.data.datasets[0].data = datosContenido;
        chartContenido.update('none'); 
        
        // Actualizamos la dona
        chartEventos.data.datasets[0].data = datosDona;
        chartEventos.update('none');
        return;
    }

    // --- GRÁFICA 1: LÍNEAS (Nivel Histórico) ---
    const ctxContenido = document.getElementById('chart-contenido').getContext('2d');
    chartContenido = new Chart(ctxContenido, {
        type: 'line',
        data: {
            labels: etiquetas,
            datasets: [{
                label: 'Nivel del Silo (kg)',
                data: datosContenido,
                borderColor: '#198754',
                backgroundColor: 'rgba(25, 135, 84, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: { animation: false } 
    });

    // --- GRÁFICA 2: DONA (Distribución Histórica de Movimientos) ---
    const ctxEventos = document.getElementById('chart-eventos').getContext('2d');
    chartEventos = new Chart(ctxEventos, {
        type: 'doughnut',
        data: {
            labels: ['Dispensado por LeGrange', 'Sustracción manual', 'Rellenado (Ingreso)'],
            datasets: [{
                data: datosDona,
                backgroundColor: [
                    'rgba(13, 110, 253, 0.8)', // Azul
                    'rgba(255, 193, 7, 0.8)',  // Amarillo
                    'rgba(25, 135, 84, 0.8)'   // Verde
                ],
                borderWidth: 1
            }]
        },
        options: { 
            maintainAspectRatio: false, 
            animation: false,
            plugins: {
                legend: { position: 'right' } // <-- Leyenda a la derecha
            }
        }
    });
}

// Cargar la lista desplegable al iniciar la app
cargarCombobox();