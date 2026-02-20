// js/api.js
const BASE_URL = 'https://699520f4b081bc23e9c212ce.mockapi.io/api/v1';

// --- FUNCIONES PARA DISPENSADORES ---

// Obtener todos los dispensadores
async function getDispensadores() {
    try {
        const response = await fetch(`${BASE_URL}/dispensador_IoT`);
        if (!response.ok) throw new Error('Error al obtener dispensadores');
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

// Crear un nuevo dispensador
async function createDispensador(data) {
    try {
        const response = await fetch(`${BASE_URL}/dispensador_IoT`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error('Error creando dispensador:', error);
    }
}

// Actualizar un dispensador (Ej. cambiar estado, peso, o apagar)
async function updateDispensador(id, data) {
    try {
        const response = await fetch(`${BASE_URL}/dispensador_IoT/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error(`Error actualizando dispensador ${id}:`, error);
    }
}

// Borrar un dispensador
async function deleteDispensador(id) {
    try {
        await fetch(`${BASE_URL}/dispensador_IoT/${id}`, { method: 'DELETE' });
    } catch (error) {
        console.error(`Error borrando dispensador ${id}:`, error);
    }
}

// --- FUNCIONES PARA EL HISTORIAL ---

// Obtener historial de un dispensador específico (Nota cómo usamos el ID dinámico)
async function getHistorial(dispensadorId) {
    try {
        const response = await fetch(`${BASE_URL}/dispensador_IoT/${dispensadorId}/dispensed_IoT`);
        if (!response.ok) throw new Error('Error al obtener historial');
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

// Registrar un nuevo evento en el historial
async function createHistorial(dispensadorId, data) {
    try {
        const response = await fetch(`${BASE_URL}/dispensador_IoT/${dispensadorId}/dispensed_IoT`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error('Error creando registro histórico:', error);
    }
}
