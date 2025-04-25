/**
 * clientes.js - Módulo para gestión de clientes
 * Contiene todas las funciones relacionadas con la gestión de clientes
 */

import { 
    saveDataToLocalStorage, 
    loadDataFromLocalStorage, 
    validarDNI, 
    validarRUC, 
    validarTelefono,
    formatDate
} from './utils.js';
import { showExportOptions } from './utils.js';
import { renderTable } from './app.js';
import { setupModalFields, showDeleteConfirmationModal } from './modals.js';

// Caché de clientes para búsquedas
let clientesCache = [];

/**
 * Actualiza la caché de clientes desde localStorage
 */
export function actualizarCacheClientes() {
    clientesCache = loadDataFromLocalStorage('clientesData') || [];
}

/**
 * Valida los datos de un cliente antes de guardar
 * @param {object} cliente - Objeto con los datos del cliente
 * @returns {boolean} True si los datos son válidos
 */
function validarCliente(cliente) {
    // if (!validarDNI(cliente.dni)) {
    //     Swal.fire('Error', 'El DNI debe tener 8 dígitos numéricos', 'error');
    //     document.getElementById('modalInputDNI').classList.add('is-invalid');
    //     return false;
    // }

    if (!cliente.nombre || cliente.nombre.trim().length < 3) {
        //Swal.fire('Error', 'El nombre debe tener al menos 3 caracteres', 'error');
        //document.getElementById('modalInputNombre').classList.add('is-invalid');
        return false;
    }

    if (cliente.telefono && !validarTelefono(cliente.telefono)) {
        //Swal.fire('Error', 'El teléfono debe tener entre 7 y 12 dígitos', 'error');
        //document.getElementById('modalInputTelefono').classList.add('is-invalid');
        return false;
    }

    if (cliente.ruc && !validarRUC(cliente.ruc)) {
        //Swal.fire('Error', 'El RUC debe tener 11 dígitos numéricos', 'error');
        //document.getElementById('modalInputRUC').classList.add('is-invalid');
        return false;
    }

    if (!cliente.direccion || cliente.direccion.trim().length < 5) {
        //Swal.fire('Error', 'La dirección debe tener al menos 5 caracteres', 'error');
        //document.getElementById('modalInputDireccion').classList.add('is-invalid');
        return false;
    }

    return true;
}

/**
 * Agrega un nuevo cliente al sistema
 */
export function agregarCliente() {
    const dni = document.getElementById('modalInputDNI').value.trim().replace(/\s+/g, ''); // Limpia espacios
    const nombre = document.getElementById('modalInputNombre').value.trim();

    // Verificar primero si el DNI ya existe
    const clientes = loadDataFromLocalStorage('clientesData');
    const dniExistente = clientes.some(cliente => cliente.dni === dni);

    if (dniExistente) {
        const clienteExistente = clientes.find(cliente => cliente.dni === dni);
        Swal.fire({
            icon: 'error',
            title: 'DNI ya registrado',
            html: `Ya existe un cliente con este DNI:<br>
                   <strong>Nombre:</strong> ${clienteExistente.nombre}<br>
                   <strong>Teléfono:</strong> ${clienteExistente.telefono || 'No registrado'}`,
            confirmButtonText: 'Entendido'
        });
        document.getElementById('modalInputDNI').classList.add('is-invalid');
        return false;
    }

    const cliente = {
        dni: dni,
        nombre: nombre,
        telefono: document.getElementById('modalInputTelefono').value.trim(),
        ruc: document.getElementById('modalInputRUC').value.trim(),
        direccion: document.getElementById('modalInputDireccion').value.trim(),
        referencia: document.getElementById('modalInputReferencia').value.trim(),
        fechaRegistro: new Date().toISOString()
    };

    if (!validarCliente(cliente)) {
        return false;
    }

    clientes.push(cliente);
    const resultado = saveDataToLocalStorage('clientesData', clientes);

    if (resultado) {
        actualizarCacheClientes();

        Swal.fire({
            icon: 'success',
            title: 'Cliente agregado',
            text: `${cliente.nombre} ha sido registrado correctamente`,
            timer: 1500,
            showConfirmButton: false
        });

        const modal = bootstrap.Modal.getInstance(document.getElementById('addDataModal'));
        modal.hide();
        document.getElementById('modalForm').reset();

        renderTable('clientesData', '#clientesBody');
        return true;
    }
    return false;
}

/**
 * Edita un cliente existente
 * @param {number} index - Índice del cliente en el array
 */
export function editarCliente(index) {
    const clientes = loadDataFromLocalStorage('clientesData');
    const cliente = clientes[index];

    if (!cliente) {
        Swal.fire('Error', 'No se encontró el cliente a editar', 'error');
        return false;
    }

    // Obtener valores del formulario
    const datosActualizados = {
        ...cliente,
        dni: document.getElementById('editInputDNI').value.trim(),
        nombre: document.getElementById('editInputNombre').value.trim(),
        telefono: document.getElementById('editInputTelefono').value.trim(),
        ruc: document.getElementById('editInputRUC').value.trim(),
        direccion: document.getElementById('editInputDireccion').value.trim(),
        referencia: document.getElementById('editInputReferencia').value.trim()
    };

    // Validar datos
    if (!validarCliente(datosActualizados)) {
        return false;
    }

    // Verificar si el DNI ya existe (excepto para este cliente)
    if (clientes.some((c, i) => c.dni === datosActualizados.dni && i !== index)) {
        Swal.fire('Error', 'Ya existe otro cliente con este DNI', 'error');
        document.getElementById('editInputDNI').classList.add('is-invalid');
        return false;
    }

    // Actualizar el cliente
    clientes[index] = datosActualizados;
    const resultado = saveDataToLocalStorage('clientesData', clientes);

    if (resultado) {
        // Mostrar confirmación
        Swal.fire({
            icon: 'success',
            title: 'Cambios guardados',
            text: `Los datos de ${datosActualizados.nombre} han sido actualizados`,
            timer: 1500,
            showConfirmButton: false
        });

        // Cerrar el modal y actualizar la tabla
        const modal = bootstrap.Modal.getInstance(document.getElementById('editDataModal'));
        modal.hide();
        renderTable('clientesData', '#clientesBody');
        
        return true;
    }

    return false;
}

/**
 * Elimina un cliente del sistema
 * @param {number} index - Índice del cliente a eliminar
 */
export function eliminarCliente(index) {
    showDeleteConfirmationModal(() => {
        const clientes = loadDataFromLocalStorage('clientesData');
        const clienteEliminado = clientes[index];

        if (!clienteEliminado) {
            Swal.fire('Error', 'No se encontró el cliente a eliminar', 'error');
            return;
        }

        // Eliminar el cliente
        clientes.splice(index, 1);
        saveDataToLocalStorage('clientesData', clientes);

        // Mostrar confirmación
        Swal.fire({
            icon: 'success',
            title: 'Cliente eliminado',
            text: `${clienteEliminado.nombre} ha sido removido del sistema`,
            timer: 1500,
            showConfirmButton: false
        });

        // Actualizar la tabla
        renderTable('clientesData', '#clientesBody');
    });
}

/**
 * Busca clientes según un término de búsqueda
 * @param {string} termino - Término de búsqueda
 */
export function buscarClientes(termino) {
    const tablaBody = document.querySelector('#clientesBody');
    
    if (!termino) {
        renderTable('clientesData', '#clientesBody');
        return;
    }

    // Actualizar caché si está vacía
    if (clientesCache.length === 0) {
        actualizarCacheClientes();
    }

    const terminoLower = termino.toLowerCase();
    const resultados = clientesCache.filter(cliente => {
        return (
            (cliente.dni && cliente.dni.toLowerCase().includes(terminoLower)) ||
            (cliente.nombre && cliente.nombre.toLowerCase().includes(terminoLower)) ||
            (cliente.ruc && cliente.ruc.toLowerCase().includes(terminoLower)) ||
            (cliente.direccion && cliente.direccion.toLowerCase().includes(terminoLower))
        );
    });

    // Mostrar resultados
    tablaBody.innerHTML = '';
    
    resultados.forEach((cliente, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${cliente.dni || ''}</td>
            <td>${cliente.nombre || ''}</td>
            <td>${cliente.telefono || ''}</td>
            <td>${cliente.ruc || ''}</td>
            <td>${cliente.direccion || ''}</td>
            <td>${cliente.referencia || ''}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editarCliente(${clientesCache.findIndex(c => c.dni === cliente.dni)})">
                    <i class="fas fa-pen-to-square"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="eliminarCliente(${clientesCache.findIndex(c => c.dni === cliente.dni)})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tablaBody.appendChild(row);
    });
}

/**
 * Exporta los clientes a un archivo JSON
 */
export function exportarClientes() {
    showExportOptions('clientesData', 'clientes', 'Reporte de Clientes');
}

/**
 * Inicializa los event listeners para la sección de clientes
 */
function initClientesEventListeners() {
    // Guardar nuevo cliente
    document.getElementById('saveModalData')?.addEventListener('click', function() {
        const activeSection = document.querySelector('.content-section:not(.d-none)');
        if (activeSection && activeSection.id === 'clientes') {
            agregarCliente();
        }
    });

    // Buscar clientes
    document.getElementById('searchClientes')?.addEventListener('input', function() {
        buscarClientes(this.value);
    });

    // Exportar clientes
    document.getElementById('exportData')?.addEventListener('click', function() {
        const activeSection = document.querySelector('.content-section:not(.d-none)');
        if (activeSection && activeSection.id === 'clientes') {
            exportarClientes();
        }
    });
}

export function initClientesModule() {
    actualizarCacheClientes();
    initClientesEventListeners();
}

// Hacer funciones disponibles globalmente para eventos en HTML
window.agregarCliente = agregarCliente;
window.editarCliente = editarCliente;
window.eliminarCliente = eliminarCliente;
window.buscarClientes = buscarClientes;
window.exportarClientes = exportarClientes;