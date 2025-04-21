/**
 * caja.js - Módulo para gestión de caja
 * Contiene todas las funciones relacionadas con la gestión de movimientos de caja
 */

import { 
    saveDataToLocalStorage, 
    loadDataFromLocalStorage,
    generarCodigoUnico,
    formatCurrency
} from './utils.js';
import { renderTable } from './app.js';
import { setupModalFields, showDeleteConfirmationModal } from './modals.js';

// Caché de movimientos de caja para búsquedas
let cajaCache = [];

/**
 * Actualiza la caché de movimientos de caja desde localStorage
 */
export function actualizarCacheCaja() {
    cajaCache = loadDataFromLocalStorage('cajaData') || [];
}

/**
 * Valida los datos de un movimiento de caja antes de guardar
 * @param {object} movimiento - Objeto con los datos del movimiento
 * @returns {boolean} True si los datos son válidos
 */
function validarMovimientoCaja(movimiento) {
    // Validar descripción
    if (!movimiento.descripcion || movimiento.descripcion.trim().length < 3) {
        Swal.fire('Error', 'La descripción debe tener al menos 3 caracteres', 'error');
        document.getElementById('modalInputDescripcion').classList.add('is-invalid');
        return false;
    }

    // Validar monto de apertura
    const montoApertura = parseFloat(movimiento.montoApertura);
    if (isNaN(montoApertura) || montoApertura <= 0) {
        Swal.fire('Error', 'El monto de apertura debe ser un número positivo', 'error');
        document.getElementById('modalInputMontoApertura').classList.add('is-invalid');
        return false;
    }

    return true;
}

/**
 * Agrega un nuevo movimiento de caja al sistema
 */
export function agregarMovimientoCaja() {
    // Obtener valores del formulario (IDs actualizados)
    const movimiento = {
        codigo: '',
        fecha: new Date().toLocaleString('es-PE'),
        descripcion: document.getElementById('modalInputDescripcion').value.trim(),
        montoApertura: document.getElementById('modalInputMontoApertura').value.trim(),
        montoDisponible: document.getElementById('modalInputMontoApertura').value.trim(),
        montoCierre: '0.00',
        estado: 'Abierto',
        historial: []
    };

    // Validar datos
    if (!validarMovimientoCaja(movimiento)) {
        return false;
    }

    // Formatear montos
    movimiento.montoApertura = parseFloat(movimiento.montoApertura).toFixed(2);
    movimiento.montoDisponible = movimiento.montoApertura;

    // Generar código único
    const cajaData = loadDataFromLocalStorage('cajaData') || [];
    const existingCodes = cajaData.map(item => item.codigo);
    movimiento.codigo = generarCodigoUnico(existingCodes);

    // Agregar el movimiento
    cajaData.push(movimiento);
    const resultado = saveDataToLocalStorage('cajaData', cajaData);

    if (resultado) {
        Swal.fire({
            icon: 'success',
            title: 'Caja abierta',
            html: `
                <div class="text-start">
                    <p><strong>Código:</strong> ${movimiento.codigo}</p>
                    <p><strong>Monto inicial:</strong> ${formatCurrency(movimiento.montoApertura)}</p>
                </div>
            `,
            timer: 2000,
            showConfirmButton: true
        });

        const modal = bootstrap.Modal.getInstance(document.getElementById('addDataModal'));
        modal.hide();
        renderTable('cajaData', '#cajaBody');
        return true;
    }
    return false;
}
/**
 * Carga dinero a una caja abierta
 * @param {number} index - Índice del movimiento de caja
 */
export function cargarCaja(index) {
    const cajaData = loadDataFromLocalStorage('cajaData');
    const movimiento = cajaData[index];

    if (!movimiento) {
        Swal.fire('Error', 'No se encontró el registro de caja', 'error');
        return;
    }

    if (movimiento.estado === 'Cerrado') {
        Swal.fire('Error', 'No se puede cargar dinero a una caja cerrada', 'error');
        return;
    }

    Swal.fire({
        title: 'Cargar dinero a caja',
        html: `
            <p>Código: <strong>${movimiento.codigo}</strong></p>
            <p>Saldo actual: <strong>${formatCurrency(movimiento.montoDisponible)}</strong></p>
            <input id="swalMontoCarga" type="number" class="swal2-input" 
                   placeholder="Monto a cargar" step="0.01" min="0.01" required>
            <input id="swalDescripcionCarga" type="text" class="swal2-input" 
                   placeholder="Descripción (opcional)">
        `,
        showCancelButton: true,
        confirmButtonText: 'Cargar',
        cancelButtonText: 'Cancelar',
        focusConfirm: false,
        preConfirm: () => {
            const montoInput = document.getElementById('swalMontoCarga');
            const monto = parseFloat(montoInput.value);
            
            if (isNaN(monto)) {
                Swal.showValidationMessage('Ingrese un monto válido');
                return false;
            }
            if (monto <= 0) {
                Swal.showValidationMessage('El monto debe ser mayor a cero');
                return false;
            }
            
            return {
                monto: monto.toFixed(2),
                descripcion: document.getElementById('swalDescripcionCarga').value.trim()
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Actualizar montos
            const montoActual = parseFloat(movimiento.montoDisponible);
            movimiento.montoDisponible = (montoActual + parseFloat(result.value.monto)).toFixed(2);
            
            // Registrar en historial
            movimiento.historial.push({
                tipo: 'Carga',
                monto: result.value.monto,
                descripcion: result.value.descripcion || 'Carga de efectivo',
                fecha: new Date().toLocaleString('es-PE')
            });
            
            // Guardar cambios
            saveDataToLocalStorage('cajaData', cajaData);
            
            // Mostrar confirmación
            Swal.fire({
                icon: 'success',
                title: 'Carga exitosa',
                html: `
                    <p>Nuevo saldo: <strong>${formatCurrency(movimiento.montoDisponible)}</strong></p>
                `,
                timer: 1500,
                showConfirmButton: false
            });
            
            // Actualizar la tabla
            renderTable('cajaData', '#cajaBody');
        }
    });
}

/**
 * Cierra un movimiento de caja
 * @param {number} index - Índice del movimiento de caja
 */
export function cerrarCaja(index) {
    const cajaData = loadDataFromLocalStorage('cajaData');
    const movimiento = cajaData[index];
    
    if (!movimiento) {
        Swal.fire('Error', 'No se encontró el registro de caja', 'error');
        return;
    }

    if (movimiento.estado === 'Cerrado') {
        Swal.fire('Error', 'Esta caja ya está cerrada', 'error');
        return;
    }

    Swal.fire({
        title: 'Cerrar caja',
        html: `
            <p>Código: <strong>${movimiento.codigo}</strong></p>
            <p>Saldo disponible: <strong>${formatCurrency(movimiento.montoDisponible)}</strong></p>
            <input id="swalMontoCierre" type="number" class="swal2-input" 
                   placeholder="Monto de cierre" value="${movimiento.montoDisponible}" 
                   step="0.01" min="0" required>
            <textarea id="swalObservaciones" class="swal2-textarea" 
                      placeholder="Observaciones (opcional)"></textarea>
        `,
        showCancelButton: true,
        confirmButtonText: 'Confirmar cierre',
        cancelButtonText: 'Cancelar',
        focusConfirm: false,
        preConfirm: () => {
            const montoCierre = parseFloat(document.getElementById('swalMontoCierre').value);
            
            if (isNaN(montoCierre)) {
                Swal.showValidationMessage('Ingrese un monto válido');
                return false;
            }
            if (montoCierre < 0) {
                Swal.showValidationMessage('El monto no puede ser negativo');
                return false;
            }
            if (montoCierre > parseFloat(movimiento.montoDisponible)) {
                Swal.showValidationMessage('El monto de cierre no puede ser mayor al disponible');
                return false;
            }
            
            return {
                montoCierre: montoCierre.toFixed(2),
                observaciones: document.getElementById('swalObservaciones').value.trim()
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Actualizar el movimiento
            movimiento.montoCierre = result.value.montoCierre;
            movimiento.estado = 'Cerrado';
            movimiento.fechaCierre = new Date().toLocaleString('es-PE');
            movimiento.observaciones = result.value.observaciones;
            
            // Registrar en historial
            movimiento.historial.push({
                tipo: 'Cierre',
                monto: result.value.montoCierre,
                descripcion: 'Cierre de caja',
                observaciones: result.value.observaciones,
                fecha: new Date().toLocaleString('es-PE')
            });
            
            // Guardar cambios
            saveDataToLocalStorage('cajaData', cajaData);
            
            // Mostrar confirmación
            Swal.fire({
                icon: 'success',
                title: 'Caja cerrada',
                html: `
                    <div class="text-start">
                        <p><strong>Código:</strong> ${movimiento.codigo}</p>
                        <p><strong>Monto cierre:</strong> ${formatCurrency(movimiento.montoCierre)}</p>
                        <p><strong>Diferencia:</strong> ${formatCurrency(parseFloat(movimiento.montoDisponible) - parseFloat(movimiento.montoCierre))}</p>
                    </div>
                `,
                timer: 2500,
                showConfirmButton: true
            });
            
            // Actualizar la tabla
            renderTable('cajaData', '#cajaBody');
        }
    });
}

/**
 * Muestra el detalle de un movimiento de caja
 * @param {number} index - Índice del movimiento de caja
 */
export function verDetalleCaja(index) {
    const cajaData = loadDataFromLocalStorage('cajaData');
    const movimiento = cajaData[index];
    
    if (!movimiento) {
        Swal.fire('Error', 'No se encontró el registro de caja', 'error');
        return;
    }

    // Construir contenido HTML para el historial
    let historialHTML = '';
    if (movimiento.historial && movimiento.historial.length > 0) {
        historialHTML = `
            <div class="mt-3">
                <h6 class="border-bottom pb-2">Historial de movimientos</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Monto</th>
                                <th>Descripción</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        movimiento.historial.forEach(item => {
            historialHTML += `
                <tr>
                    <td>${item.fecha}</td>
                    <td>${item.tipo}</td>
                    <td>${formatCurrency(item.monto)}</td>
                    <td>${item.descripcion || ''}</td>
                </tr>
            `;
        });

        historialHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else {
        historialHTML = '<p class="text-muted">No hay movimientos registrados</p>';
    }

    Swal.fire({
        title: `Detalle de caja: ${movimiento.codigo}`,
        html: `
            <div class="text-start">
                <p><strong>Estado:</strong> 
                    <span class="badge ${movimiento.estado === 'Cerrado' ? 'bg-danger' : 'bg-success'}">
                        ${movimiento.estado}
                    </span>
                </p>
                <p><strong>Fecha apertura:</strong> ${movimiento.fecha}</p>
                ${movimiento.fechaCierre ? `<p><strong>Fecha cierre:</strong> ${movimiento.fechaCierre}</p>` : ''}
                <p><strong>Descripción:</strong> ${movimiento.descripcion}</p>
                
                <div class="row mt-3">
                    <div class="col-md-4">
                        <div class="card border-primary">
                            <div class="card-body">
                                <h6 class="card-title">Apertura</h6>
                                <p class="card-text">${formatCurrency(movimiento.montoApertura)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card ${movimiento.estado === 'Cerrado' ? 'border-danger' : 'border-success'}">
                            <div class="card-body">
                                <h6 class="card-title">${movimiento.estado === 'Cerrado' ? 'Cierre' : 'Disponible'}</h6>
                                <p class="card-text">${formatCurrency(movimiento.estado === 'Cerrado' ? movimiento.montoCierre : movimiento.montoDisponible)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card border-info">
                            <div class="card-body">
                                <h6 class="card-title">Diferencia</h6>
                                <p class="card-text">${formatCurrency(parseFloat(movimiento.montoDisponible) - parseFloat(movimiento.estado === 'Cerrado' ? movimiento.montoCierre : movimiento.montoApertura))}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${movimiento.observaciones ? `
                    <div class="mt-3">
                        <h6 class="border-bottom pb-2">Observaciones</h6>
                        <p>${movimiento.observaciones}</p>
                    </div>
                ` : ''}
                
                ${historialHTML}
            </div>
        `,
        width: '800px',
        confirmButtonText: 'Cerrar'
    });
}

/**
 * Exporta los movimientos de caja a un archivo JSON
 */
export function exportarCaja() {
    const cajaData = loadDataFromLocalStorage('cajaData');
    const dataStr = JSON.stringify(cajaData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `caja_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

/**
 * Genera un reporte de cierres de caja
 */
export function generarReporteCierres() {
    const cajaData = loadDataFromLocalStorage('cajaData');
    const cierres = cajaData.filter(item => item.estado === 'Cerrado');

    if (cierres.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'No hay cierres registrados',
            text: 'No se encontraron cajas cerradas para generar el reporte',
            timer: 2000,
            showConfirmButton: false
        });
        return;
    }

    // Calcular totales
    const totalApertura = cierres.reduce((sum, item) => sum + parseFloat(item.montoApertura), 0);
    const totalCierre = cierres.reduce((sum, item) => sum + parseFloat(item.montoCierre), 0);
    const diferenciaTotal = totalCierre - totalApertura;

    // Construir contenido HTML del reporte
    let htmlContent = `
        <div class="table-responsive">
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Fecha</th>
                        <th>Apertura</th>
                        <th>Cierre</th>
                        <th>Diferencia</th>
                    </tr>
                </thead>
                <tbody>
    `;

    cierres.forEach(item => {
        const diferencia = parseFloat(item.montoCierre) - parseFloat(item.montoApertura);
        htmlContent += `
            <tr>
                <td>${item.codigo}</td>
                <td>${item.fechaCierre || item.fecha}</td>
                <td>${formatCurrency(item.montoApertura)}</td>
                <td>${formatCurrency(item.montoCierre)}</td>
                <td class="${diferencia >= 0 ? 'text-success' : 'text-danger'}">
                    ${formatCurrency(diferencia)}
                </td>
            </tr>
        `;
    });

    htmlContent += `
                </tbody>
                <tfoot class="table-group-divider">
                    <tr>
                        <th colspan="2">Total</th>
                        <th>${formatCurrency(totalApertura)}</th>
                        <th>${formatCurrency(totalCierre)}</th>
                        <th class="${diferenciaTotal >= 0 ? 'text-success' : 'text-danger'}">
                            ${formatCurrency(diferenciaTotal)}
                        </th>
                    </tr>
                </tfoot>
            </table>
        </div>
        <p class="mt-2 text-muted">Total de cierres: ${cierres.length}</p>
    `;

    Swal.fire({
        title: 'Reporte de Cierres de Caja',
        html: htmlContent,
        width: '800px',
        confirmButtonText: 'Cerrar'
    });
}

/**
 * Inicializa los event listeners para la sección de caja
 */
function initCajaEventListeners() {
    // Guardar nuevo movimiento
    document.getElementById('saveModalData')?.addEventListener('click', function() {
        const activeSection = document.querySelector('.content-section:not(.d-none)');
        if (activeSection && activeSection.id === 'caja') {
            agregarMovimientoCaja();
        }
    });

    // Exportar movimientos
    document.getElementById('exportData')?.addEventListener('click', function() {
        const activeSection = document.querySelector('.content-section:not(.d-none)');
        if (activeSection && activeSection.id === 'caja') {
            exportarCaja();
        }
    });

    // Generar reporte de cierres
    document.getElementById('btnReporteCierres')?.addEventListener('click', generarReporteCierres);
}

// Inicialización del módulo
actualizarCacheCaja();
initCajaEventListeners();

// Hacer funciones disponibles globalmente para eventos en HTML
window.agregarMovimientoCaja = agregarMovimientoCaja;
window.cargarCaja = cargarCaja;
window.cerrarCaja = cerrarCaja;
window.verDetalleCaja = verDetalleCaja;
window.exportarCaja = exportarCaja;
window.generarReporteCierres = generarReporteCierres;