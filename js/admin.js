// js/admin.js

// 1. Referencia al contenedor principal de la vista de administración
const adminContent = document.getElementById('admin-content');

// 2. Plantilla HTML: Formulario (Izquierda) y Tabla de registros (Derecha)
const adminHTML = `
    <div class="row">
        <div class="col-md-4">
            <div class="card card-iot mb-4 border-success">
                <div class="card-header bg-success text-white">
                    <h5 class="card-title mb-0" id="form-title">Agregar Nuevo Silo</h5>
                </div>
                <div class="card-body">
                    <form id="dispensador-form">
                        <input type="hidden" id="disp_id">
                        
                        <div class="mb-3">
                            <label class="form-label fw-bold">Nombre del Silo / Zona</label>
                            <input type="text" class="form-control" id="disp_name" placeholder="Ej. Silo Engorda 1" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">Descripción / Horarios</label>
                            <input type="text" class="form-control" id="disp_desc" placeholder="Ej. Mezcla Proteína - 08:00 y 16:00" required>
                        </div>
                        <div class="row">
                            <div class="col-6 mb-3">
                                <label class="form-label fw-bold">Capacidad Máx (kg)</label>
                                <input type="number" class="form-control" id="disp_max" min="1" required>
                            </div>
                            <div class="col-6 mb-3">
                                <label class="form-label fw-bold">Peso Inicial (kg)</label>
                                <input type="number" class="form-control" id="disp_current" min="0" required>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-success w-100">Guardar Dispensador</button>
                        <button type="button" class="btn btn-outline-secondary w-100 mt-2 d-none" id="btn-cancelar" onclick="resetForm()">Cancelar Edición</button>
                    </form>
                </div>
            </div>
        </div>

        <div class="col-md-8">
            <div class="card card-iot">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle text-center">
                            <thead class="table-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Capacidad</th>
                                    <th>Peso Actual</th>
                                    <th>Estado Físico</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="admin-table-body">
                                <tr><td colspan="6">Cargando dispensadores...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

// 3. Inicializar la vista inyectando el HTML
adminContent.innerHTML = adminHTML;

// 4. Lógica de renderizado y CRUD

// Cargar y mostrar los datos en la tabla
async function loadTable() {
    const tbody = document.getElementById('admin-table-body');
    const dispensadores = await getDispensadores(); // Viene de api.js

    tbody.innerHTML = ''; // Limpiar tabla

    if (dispensadores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No hay dispensadores registrados. Agrega uno.</td></tr>';
        return;
    }

    dispensadores.forEach(disp => {
        // Determinamos el badge de estado
        let statusBadge = disp.status 
            ? '<span class="badge bg-success">Encendido</span>' 
            : '<span class="badge bg-secondary">Apagado</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${disp.id}</td>
            <td class="fw-bold">${disp.deviceName}</td>
            <td>${disp.maxWeight} kg</td>
            <td>${disp.weight} kg</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editBtn('${disp.id}')">✏️ Editar</button>
                <button class="btn btn-sm btn-danger" onclick="deleteBtn('${disp.id}')">🗑️ Borrar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Guardar o Actualizar un Dispensador
document.getElementById('dispensador-form').addEventListener('submit', async (e) => {
    e.preventDefault(); // Evitar que la página se recargue

    // Recopilar datos del formulario
    const id = document.getElementById('disp_id').value;
    const data = {
        deviceName: document.getElementById('disp_name').value,
        description: document.getElementById('disp_desc').value,
        maxWeight: parseFloat(document.getElementById('disp_max').value),
        weight: parseFloat(document.getElementById('disp_current').value),
        // Si es nuevo, lo creamos encendido y en estado 1 (Listo). Si ya existe, no tocamos esos campos por ahora.
        status: true, 
        statusCode: 1 
    };

    if (id) {
        // Si hay ID, estamos editando (Update)
        await updateDispensador(id, data);
        alert('Dispensador actualizado con éxito.');
    } else {
        // Si no hay ID, estamos creando (Create)
        await createDispensador(data);
        alert('Nuevo dispensador registrado.');
    }

    resetForm();
    loadTable(); // Recargar la tabla
});

// Botón Editar: Cargar datos en el formulario
async function editBtn(id) {
    // Para no hacer otra petición, buscamos en la tabla, pero lo ideal es buscar en la base de datos
    const dispensadores = await getDispensadores();
    const disp = dispensadores.find(d => d.id == id);

    if(disp) {
        document.getElementById('disp_id').value = disp.id;
        document.getElementById('disp_name').value = disp.deviceName;
        document.getElementById('disp_desc').value = disp.description;
        document.getElementById('disp_max').value = disp.maxWeight;
        document.getElementById('disp_current').value = disp.weight;

        document.getElementById('form-title').innerText = `Editando Silo #${disp.id}`;
        document.getElementById('btn-cancelar').classList.remove('d-none');
    }
}

// Botón Borrar: Eliminar registro
async function deleteBtn(id) {
    if (confirm(`¿Estás seguro de que deseas eliminar el dispensador #${id}? Esta acción no se puede deshacer.`)) {
        await deleteDispensador(id);
        alert('Dispensador eliminado.');
        loadTable();
    }
}

// Limpiar formulario y resetear estado
function resetForm() {
    document.getElementById('dispensador-form').reset();
    document.getElementById('disp_id').value = '';
    document.getElementById('form-title').innerText = 'Agregar Nuevo Silo';
    document.getElementById('btn-cancelar').classList.add('d-none');
}

// Ejecutar la carga de la tabla al iniciar
loadTable();