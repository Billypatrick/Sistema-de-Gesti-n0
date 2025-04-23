/**
 * trabajadores.js - Módulo para gestión de trabajadores
 * Contiene todas las funciones relacionadas con la gestión de trabajadores
 */

import { 
    saveDataToLocalStorage, 
    loadDataFromLocalStorage,
    generarNumeroTrabajadorUnico,
    formatDate
} from './utils.js';
import { showExportOptions } from './utils.js';
import { renderTable } from './app.js';
import { setupModalFields, showDeleteConfirmationModal } from './modals.js';

// Caché de trabajadores para búsquedas
let trabajadoresCache = [];

/**
 * Actualiza la caché de trabajadores desde localStorage
 */
export function actualizarCacheTrabajadores() {
    trabajadoresCache = loadDataFromLocalStorage('trabajadoresData') || [];
}

/**
 * Valida los datos de un trabajador antes de guardar
 * @param {object} trabajador - Objeto con los datos del trabajador
 * @returns {boolean} True si los datos son válidos
 */
function validarTrabajador(trabajador) {
    // Validar nombre
    if (!trabajador.nombre || trabajador.nombre.trim().length < 3) {
        Swal.fire('Error', 'El nombre debe tener al menos 3 caracteres', 'error');
        document.getElementById('modalInputNombre').classList.add('is-invalid');
        return false;
    }

    // Validar cargo
    if (!trabajador.cargo || trabajador.cargo.trim().length < 3) {
        Swal.fire('Error', 'El cargo debe tener al menos 3 caracteres', 'error');
        document.getElementById('modalInputCargo').classList.add('is-invalid');
        return false;
    }

    // Validar edad
    const edad = parseInt(trabajador.edad);
    if (isNaN(edad)) {
        Swal.fire('Error', 'La edad debe ser un número válido', 'error');
        document.getElementById('modalInputEdad').classList.add('is-invalid');
        return false;
    }

    if (edad < 18 || edad > 100) {
        Swal.fire('Error', 'La edad debe estar entre 18 y 100 años', 'error');
        document.getElementById('modalInputEdad').classList.add('is-invalid');
        return false;
    }

    return true;
}

/**
 * Agrega un nuevo trabajador al sistema
 */
export function agregarTrabajador() {
    // Obtener valores del formulario
    const trabajador = {
        nombre: document.getElementById('modalInputNombre').value.trim(),
        cargo: document.getElementById('modalInputCargo').value.trim(),
        area: document.getElementById('modalInputArea').value,
        sexo: document.getElementById('modalInputSexo').value,
        edad: document.getElementById('modalInputEdad').value,
        fechaContratacion: new Date().toISOString()
    };

    // Validar datos
    if (!validarTrabajador(trabajador)) {
        return false;
    }

    // Generar número de trabajador único
    const trabajadores = loadDataFromLocalStorage('trabajadoresData');
    const existingNumbers = trabajadores.map(t => t.numeroTrabajador);
    trabajador.numeroTrabajador = generarNumeroTrabajadorUnico(existingNumbers);

    // Agregar el trabajador
    trabajadores.push(trabajador);
    const resultado = saveDataToLocalStorage('trabajadoresData', trabajadores);

    if (resultado) {
        // Mostrar confirmación
        Swal.fire({
            icon: 'success',
            title: 'Trabajador agregado',
            text: `${trabajador.nombre} ha sido registrado correctamente`,
            html: `
                <div class="text-start mt-2">
                    <p><strong>N° Trabajador:</strong> ${trabajador.numeroTrabajador}</p>
                    <p><strong>Cargo:</strong> ${trabajador.cargo}</p>
                </div>
            `,
            timer: 2000,
            showConfirmButton: true
        });

        // Cerrar el modal y actualizar la tabla
        const modal = bootstrap.Modal.getInstance(document.getElementById('addDataModal'));
        modal.hide();
        renderTable('trabajadoresData', '#trabajadoresBody');
        
        return true;
    }

    return false;
}

/**
 * Edita un trabajador existente
 * @param {number} index - Índice del trabajador en el array
 */
export function editarTrabajador(index) {
    const trabajadores = loadDataFromLocalStorage('trabajadoresData');
    const trabajador = trabajadores[index];

    if (!trabajador) {
        Swal.fire('Error', 'No se encontró el trabajador a editar', 'error');
        return false;
    }

    // Obtener valores del formulario
    const edad = parseInt(document.getElementById('editInputEdad').value);
    if (edad < 18 || edad > 100) {
        Swal.fire('Error', 'La edad debe estar entre 18 y 100 años', 'error');
        document.getElementById('editInputEdad').classList.add('is-invalid');
        return false;
    }

    const trabajadorActualizado = {
        ...trabajador,
        nombre: document.getElementById('editInputNombre').value.trim(),
        cargo: document.getElementById('editInputCargo').value.trim(),
        area: document.getElementById('editInputArea').value,
        sexo: document.getElementById('editInputSexo').value,
        edad: edad
    };

    // Actualizar el trabajador
    trabajadores[index] = trabajadorActualizado;
    const resultado = saveDataToLocalStorage('trabajadoresData', trabajadores);

    if (resultado) {
        // Mostrar confirmación
        Swal.fire({
            icon: 'success',
            title: 'Cambios guardados',
            text: `Los datos de ${trabajadorActualizado.nombre} han sido actualizados`,
            timer: 1500,
            showConfirmButton: false
        });

        // Cerrar el modal y actualizar la tabla
        const modal = bootstrap.Modal.getInstance(document.getElementById('editDataModal'));
        modal.hide();
        renderTable('trabajadoresData', '#trabajadoresBody');
        
        return true;
    }

    return false;
}

/**
 * Elimina un trabajador del sistema
 * @param {number} index - Índice del trabajador a eliminar
 */
export function eliminarTrabajador(index) {
    showDeleteConfirmationModal(() => {
        const trabajadores = loadDataFromLocalStorage('trabajadoresData');
        const trabajadorEliminado = trabajadores[index];

        if (!trabajadorEliminado) {
            Swal.fire('Error', 'No se encontró el trabajador a eliminar', 'error');
            return;
        }

        // Eliminar el trabajador
        trabajadores.splice(index, 1);
        saveDataToLocalStorage('trabajadoresData', trabajadores);

        // Mostrar confirmación
        Swal.fire({
            icon: 'success',
            title: 'Trabajador eliminado',
            text: `${trabajadorEliminado.nombre} ha sido removido del sistema`,
            timer: 1500,
            showConfirmButton: false
        });

        // Actualizar la tabla
        renderTable('trabajadoresData', '#trabajadoresBody');
    });
}

/**
 * Busca trabajadores según un término de búsqueda
 * @param {string} termino - Término de búsqueda
 */
export function buscarTrabajadores(termino) {
    const tablaBody = document.querySelector('#trabajadoresBody');
    
    if (!termino) {
        renderTable('trabajadoresData', '#trabajadoresBody');
        return;
    }

    // Actualizar caché si está vacía
    if (trabajadoresCache.length === 0) {
        actualizarCacheTrabajadores();
    }

    const terminoLower = termino.toLowerCase();
    const resultados = trabajadoresCache.filter(trabajador => {
        return (
            (trabajador.numeroTrabajador && trabajador.numeroTrabajador.toLowerCase().includes(terminoLower)) ||
            (trabajador.nombre && trabajador.nombre.toLowerCase().includes(terminoLower)) ||
            (trabajador.cargo && trabajador.cargo.toLowerCase().includes(terminoLower)) ||
            (trabajador.area && trabajador.area.toLowerCase().includes(terminoLower))
        );
    });

    // Mostrar resultados
    tablaBody.innerHTML = '';
    
    resultados.forEach((trabajador, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${trabajador.numeroTrabajador || ''}</td>
            <td>${trabajador.nombre || ''}</td>
            <td>${trabajador.cargo || ''}</td>
            <td>${trabajador.area || ''}</td>
            <td>${trabajador.sexo || ''}</td>
            <td>${trabajador.edad || ''}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editarTrabajador(${trabajadoresCache.findIndex(t => t.numeroTrabajador === trabajador.numeroTrabajador)})">
                    <i class="fas fa-pen-to-square"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="eliminarTrabajador(${trabajadoresCache.findIndex(t => t.numeroTrabajador === trabajador.numeroTrabajador)})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tablaBody.appendChild(row);
    });
}

/**
 * Exporta los trabajadores en diferentes formatos
 */
export function exportarTrabajadores() {
    showExportOptions('trabajadoresData', 'trabajadores', 'Reporte de Trabajadores');
}

/**
 * Genera un reporte de trabajadores por área
 */
export function generarReporteAreas() {
    const trabajadores = loadDataFromLocalStorage('trabajadoresData');
    
    // Agrupar trabajadores por área
    const reporte = trabajadores.reduce((acc, trabajador) => {
        const area = trabajador.area || 'Sin área asignada';
        if (!acc[area]) {
            acc[area] = [];
        }
        acc[area].push(trabajador);
        return acc;
    }, {});

    // Ordenar áreas alfabéticamente
    const areasOrdenadas = Object.keys(reporte).sort();

    // Construir contenido HTML del reporte
    let htmlContent = `
        <div class="table-responsive">
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Área</th>
                        <th>Cantidad</th>
                    </tr>
                </thead>
                <tbody>
    `;

    areasOrdenadas.forEach(area => {
        htmlContent += `
            <tr>
                <td>${area}</td>
                <td>${reporte[area].length}</td>
            </tr>
        `;
    });

    htmlContent += `
                </tbody>
            </table>
        </div>
        <p class="mt-2 text-muted">Total de trabajadores: ${trabajadores.length}</p>
    `;

    Swal.fire({
        title: 'Distribución de Trabajadores por Área',
        html: htmlContent,
        width: '600px',
        confirmButtonText: 'Cerrar'
    });
}

/**
 * Inicializa los event listeners para la sección de trabajadores
 */
function initTrabajadoresEventListeners() {
    // Guardar nuevo trabajador
    document.getElementById('saveModalData')?.addEventListener('click', function() {
        const activeSection = document.querySelector('.content-section:not(.d-none)');
        if (activeSection && activeSection.id === 'trabajadores') {
            agregarTrabajador();
        }
    });

    // Buscar trabajadores
    document.getElementById('searchTrabajadores')?.addEventListener('input', function() {
        buscarTrabajadores(this.value);
    });

    // Exportar trabajadores
    document.getElementById('exportData')?.addEventListener('click', function() {
        const activeSection = document.querySelector('.content-section:not(.d-none)');
        if (activeSection && activeSection.id === 'trabajadores') {
            exportarTrabajadores();
        }
    });

    // Generar reporte por áreas
    document.getElementById('btnReporteAreas')?.addEventListener('click', generarReporteAreas);
}

// Inicialización del módulo
actualizarCacheTrabajadores();
initTrabajadoresEventListeners();

// Hacer funciones disponibles globalmente para eventos en HTML
window.agregarTrabajador = agregarTrabajador;
window.editarTrabajador = editarTrabajador;
window.eliminarTrabajador = eliminarTrabajador;
window.buscarTrabajadores = buscarTrabajadores;
window.exportarTrabajadores = exportarTrabajadores;
window.generarReporteAreas = generarReporteAreas;