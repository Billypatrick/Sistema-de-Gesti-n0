/**
 * app.js - Módulo principal de la aplicación
 * Contiene la lógica central y funciones compartidas por todos los módulos
 */


import { 
    saveDataToLocalStorage, 
    loadDataFromLocalStorage,
    generarCodigoUnico,
    generarNumeroTrabajadorUnico,
    formatCurrency,
    formatDate
} from './utils.js';
import { showExportOptions } from './utils.js';
import { setupModalFields, showDeleteConfirmationModal } from './modals.js';


const PAGE_SIZE = 20;
const paginationMap = {
    'clientesData': 'clientesPagination',
    'almacenData': 'almacenPagination',
    'trabajadoresData': 'trabajadoresPagination',
    'cajaData': 'cajaPagination'
};
let currentPageMap = {
    'clientesData': 1,
    'almacenData': 1,
    'trabajadoresData': 1,
    'cajaData': 1
};

// Cambia de página
window.goToPage = function(key, page) {
    currentPageMap[key] = page;
    renderTable(key, getTableBodyId(key));
};

function getTableBodyId(key) {
    return {
        'clientesData': '#clientesBody',
        'almacenData': '#almacenBody',
        'trabajadoresData': '#trabajadoresBody',
        'cajaData': '#cajaBody'
    }[key];
}

// Variables globales para caché
let clientesCache = [];
let trabajadoresCache = [];
let almacenCache = [];
let cajaCache = [];

/**
 * Renderiza una tabla con datos desde localStorage
 * @param {string} key - Clave de los datos en localStorage
 * @param {string} tableBodyId - Selector del tbody a actualizar
 */
export function renderTable(key, tableBodyId) {
    const data = loadDataFromLocalStorage(key);
    const tableBody = document.querySelector(tableBodyId);
    const paginationDiv = document.getElementById(paginationMap[key]);
    if (!tableBody) return;

    // Paginación
    const page = currentPageMap[key] || 1;
    const totalPages = Math.ceil(data.length / PAGE_SIZE);
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageData = data.slice(start, end);

    tableBody.innerHTML = '';

    // Renderiza según la tabla
    if (key === 'clientesData') renderClientesTable(pageData, tableBody, start);
    else if (key === 'almacenData') renderAlmacenTable(pageData, tableBody, start);
    else if (key === 'trabajadoresData') renderTrabajadoresTable(pageData, tableBody, start);
    else if (key === 'cajaData') renderCajaTable(pageData, tableBody, start);

    // Renderiza la paginación
    if (paginationDiv) {
        paginationDiv.innerHTML = '';
        if (totalPages > 1) {
            let html = `<nav><ul class="pagination pagination-sm mb-0">`;
            html += `<li class="page-item${page === 1 ? ' disabled' : ''}">
                        <button class="page-link" onclick="goToPage('${key}',${page - 1})">&laquo;</button>
                    </li>`;
            for (let i = 1; i <= totalPages; i++) {
                html += `<li class="page-item${i === page ? ' active' : ''}">
                            <button class="page-link" onclick="goToPage('${key}',${i})">${i}</button>
                        </li>`;
            }
            html += `<li class="page-item${page === totalPages ? ' disabled' : ''}">
                        <button class="page-link" onclick="goToPage('${key}',${page + 1})">&raquo;</button>
                    </li>`;
            html += `</ul></nav>`;
            paginationDiv.innerHTML = html;
        }
    }
}




/**
 * Renderiza la tabla de clientes
 */
function renderClientesTable(data, tableBody, startIndex = 0) {
    tableBody.innerHTML = ''; // Limpia la tabla antes de renderizar

    data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${startIndex + index + 1}</td>
            <td>${item.dni || ''}</td>
            <td>${item.nombre || ''}</td>
            <td>${item.telefono || ''}</td>
            <td class="d-none-tablet d-none-mobile">${item.ruc || ''}</td>
            <td>${item.direccion || ''}</td>
            <td class="d-none-tablet d-none-mobile">${item.referencia || ''}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editRow('clientesData', ${index}, '#clientesBody')">
                    <i class="fas fa-pen-to-square"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteRow('clientesData', ${index}, '#clientesBody')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
}

/**
 * Renderiza la tabla de almacén
 */
function renderAlmacenTable(data, tableBody, startIndex = 0) {
    data.forEach((item, index) => {
        const importeInventario = (item.stock * parseFloat(item.precio || 0)).toFixed(2);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${startIndex + index + 1}</td>
            <td>${item.producto || ''}</td>
            <td class="d-none-tablet d-none-mobile">${item.descripcion || ''}</td>
            <td>${item.stock || '0'}</td>
            <td>${item.peso || '0'} kg</td>
            <td>${formatCurrency(item.precio || 0)}</td>
            <td class="d-none-tablet d-none-mobile">${item.entrada || '0'}</td>
            <td class="d-none-tablet d-none-mobile">${item.salida || '0'}</td>
            <td>${formatCurrency(importeInventario)}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editRow('almacenData', ${index}, '#almacenBody')">
                    <i class="fas fa-pen-to-square"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteRow('almacenData', ${index}, '#almacenBody')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Renderiza la tabla de trabajadores
 */
function renderTrabajadoresTable(data, tableBody, startIndex = 0) {
    data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${startIndex + index + 1}</td>
            <td>${item.numeroTrabajador || ''}</td>
            <td>${item.nombre || ''}</td>
            <td class="d-none-tablet d-none-mobile">${item.cargo || ''}</td>
            <td class="d-none-tablet d-none-mobile">${item.area || ''}</td>
            <td class="d-none-tablet d-none-mobile">${item.sexo || ''}</td>
            <td>${item.edad || ''}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editRow('trabajadoresData', ${index}, '#trabajadoresBody')">
                    <i class="fas fa-pen-to-square"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteRow('trabajadoresData', ${index}, '#trabajadoresBody')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Renderiza la tabla de caja
 */
function renderCajaTable(data, tableBody, startIndex = 0) {
    data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${startIndex + index + 1}</td>
            <td>${item.codigo || ''}</td>
            <td>${item.fecha || ''}</td>
            <td class="d-none-tablet d-none-mobile">${item.descripcion || ''}</td>
            <td>${formatCurrency(item.montoApertura || 0)}</td>
            <td>${formatCurrency(item.montoDisponible || item.montoApertura || 0)}</td>
            <td class="d-none-tablet d-none-mobile">${formatCurrency(item.montoCierre || 0)}</td>
            <td>
            <span class="${item.estado === 'Cerrado' ? 'badge-cerrado' : 'badge-abierto'}">
                ${item.estado || 'Abierto'}
            </span>
            </td>
            <td class="caja-options">
                <div class="d-flex flex-wrap gap-1 justify-content-center">
                    <button class="btn btn-success btn-sm" onclick="verDetalleCaja(${index})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="cargarCaja(${index})" ${item.estado === 'Cerrado' ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRow('cajaData', ${index}, '#cajaBody')">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-sm ${item.estado === 'Cerrado' ? 'btn-secondary opacity-50' : 'btn-dark'}" 
                        onclick="${item.estado === 'Cerrado' ? '' : 'cerrarCaja(' + index + ')'}" 
                        ${item.estado === 'Cerrado' ? 'disabled' : ''}>
                        <i class="fas fa-lock"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Edita una fila de cualquier tabla
 * @param {string} key - Clave de los datos en localStorage
 * @param {number} index - Índice del elemento a editar
 * @param {string} tableBodyId - Selector del tbody
 */
window.editRow = function(key, index, tableBodyId) {
    const data = loadDataFromLocalStorage(key);
    const item = data[index];
    
    if (!item) {
        Swal.fire('Error', 'No se encontró el registro a editar', 'error');
        return;
    }

    // Mostrar el modal de edición
    showEditModal(key, index, tableBodyId);
    
};



/**
 * Obtiene los campos de edición para una sección específica
 */
function getEditFieldsForSection(key, item) {
    const section = key.replace('Data', '').toLowerCase();
    
    const fieldMap = {
        'clientes': [
            { id: 'editInputDNI', value: item.dni },
            { id: 'editInputNombre', value: item.nombre },
            { id: 'editInputTelefono', value: item.telefono },
            { id: 'editInputRUC', value: item.ruc },
            { id: 'editInputDireccion', value: item.direccion },
            { id: 'editInputReferencia', value: item.referencia }
        ],
        'almacen': [
            { id: 'editInputProducto', value: item.producto },
            { id: 'editInputDescripcion', value: item.descripcion, type: 'textarea' },
            { 
                id: 'editInputPrecio', 
                value: item.precio,
                validation: (input) => {
                    input.type = 'number';
                    input.step = '0.01';
                    input.min = '0';
                }
            },
            { 
                id: 'editInputEntrada', 
                value: '0',
                validation: (input) => {
                    input.type = 'number';
                    input.min = '0';
                    input.step = '1';
                }
            },
            { 
                id: 'editInputSalida', 
                value: '0',
                validation: (input) => {
                    input.type = 'number';
                    input.min = '0';
                    input.step = '1';
                }
            }
        ],
        'trabajadores': [
            { id: 'editInputNombre', value: item.nombre },
            { id: 'editInputCargo', value: item.cargo },
            {
                id: 'editInputArea',
                value: item.area,
                type: 'select',
                options: ['Ventas', 'Logística', 'Administración', 'Recursos Humanos', 'Producción', 'Otro']
            },
            {
                id: 'editInputSexo',
                value: item.sexo,
                type: 'select',
                options: ['Masculino', 'Femenino', 'Otro']
            },
            { 
                id: 'editInputEdad', 
                value: item.edad,
                validation: (input) => {
                    input.type = 'number';
                    input.min = '18';
                    input.max = '100';
                }
            }
        ],
        'caja': [
            { id: 'editInputDescripcion', value: item.descripcion },
            { 
                id: 'editInputMontoApertura', 
                value: item.montoApertura,
                validation: (input) => {
                    input.type = 'number';
                    input.step = '0.01';
                    input.min = '0';
                    input.readOnly = item.estado === 'Cerrado';
                }
            },
            {
                id: 'editInputMontoDisponible',
                value: item.montoDisponible || item.montoApertura,
                validation: (input) => {
                    input.type = 'number';
                    input.step = '0.01';
                    input.min = '0';
                    input.readOnly = true;
                    input.style.backgroundColor = '#f8f9fa';
                }
            },
            {
                id: 'editInputMontoCierre',
                value: item.montoCierre || '0.00',
                validation: (input) => {
                    input.type = 'number';
                    input.step = '0.01';
                    input.min = '0';
                    input.readOnly = item.estado !== 'Cerrado';
                }
            }
        ]
    };

    return fieldMap[section] || [];
}

/**
 * Elimina una fila de cualquier tabla
 * @param {string} key - Clave de los datos en localStorage
 * @param {number} index - Índice del elemento a eliminar
 * @param {string} tableBodyId - Selector del tbody
 */
window.deleteRow = function(key, index, tableBodyId) {
    showDeleteConfirmationModal(() => {
        const data = loadDataFromLocalStorage(key);
        const itemEliminado = data[index];
        
        if (!itemEliminado) {
            Swal.fire('Error', 'No se encontró el registro a eliminar', 'error');
            return;
        }

        // Eliminar el elemento
        data.splice(index, 1);
        saveDataToLocalStorage(key, data);

        // Mostrar confirmación
        let mensaje = 'El registro ha sido eliminado';
        if (itemEliminado.nombre || itemEliminado.producto) {
            mensaje = `${itemEliminado.nombre || itemEliminado.producto} ha sido eliminado`;
        }
        
        Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: mensaje,
            timer: 1500,
            showConfirmButton: false
        });

        // Actualizar la tabla
        renderTable(key, tableBodyId);
    });
};

/**
 * Navega entre las diferentes secciones de la aplicación
 * @param {string} sectionId - ID de la sección a mostrar
 */
window.navigateTo = function (sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('d-none');
    });

    // Mostrar la sección seleccionada
    const sectionToShow = document.getElementById(sectionId);
    if (sectionToShow) {
        sectionToShow.classList.remove('d-none');
    }

    // Actualizar el título
    const sectionTitle = document.getElementById('sectionTitle');
    if (sectionTitle) {
        const titles = {
            'clientes': 'Clientes',
            'almacen': 'Almacén',
            'trabajadores': 'Trabajadores',
            'caja': 'Caja'
        };
        sectionTitle.textContent = titles[sectionId] || sectionId;
    }

    // Resaltar el botón activo en el sidebar y deshabilitarlo
    document.querySelectorAll('.btn-navegacion').forEach(btn => {
        btn.classList.remove('btn-active'); // Elimina la clase activa de todos los botones
        btn.disabled = false; // Habilita todos los botones
    });
    const activeButton = document.querySelector(`button[onclick="navigateTo('${sectionId}')"]`);
    if (activeButton) {
        activeButton.classList.add('btn-active'); // Añade la clase activa al botón correspondiente
        activeButton.disabled = true; // Deshabilita el botón activo
    }

    // Renderizar la tabla correspondiente
    const tableMap = {
        'clientes': ['clientesData', '#clientesBody'],
        'almacen': ['almacenData', '#almacenBody'],
        'trabajadores': ['trabajadoresData', '#trabajadoresBody'],
        'caja': ['cajaData', '#cajaBody']
    };

    if (tableMap[sectionId]) {
        renderTable(tableMap[sectionId][0], tableMap[sectionId][1]);
    }
};




/**
 * Inicializa los event listeners principales
 */
function initEventListeners() {
document.getElementById('toggleSidebar')?.addEventListener('click', function() {
    document.querySelector('.sidebar').classList.toggle('sidebar-show');
});

    // Configurar campos del modal al mostrar
    document.querySelectorAll('[data-bs-target="#addDataModal"]').forEach(button => {
        button.addEventListener('click', function() {
            const section = this.getAttribute('data-section') || 
                           document.querySelector('.content-section:not(.d-none)').id;
            setupModalFields(section, 'add');
        });
    });

    // Guardar datos del modal
    document.getElementById('saveModalData')?.addEventListener('click', function() {
        const activeSection = document.querySelector('.content-section:not(.d-none)');
        if (!activeSection) return;

        const sectionHandlers = {
            'clientes': () => window.agregarCliente?.(),
            'almacen': () => window.agregarProducto?.(),
            'trabajadores': () => window.agregarTrabajador?.(),
            'caja': () => window.agregarMovimientoCaja?.()
        };

        sectionHandlers[activeSection.id]?.();
    });

    // Guardar datos editados
    document.getElementById('saveEditData')?.addEventListener('click', function() {
        const key = document.getElementById('editTableKey').value;
        const sectionHandlers = {
            'clientesData': () => window.editarCliente?.(parseInt(document.getElementById('editRowIndex').value)),
            'almacenData': () => window.editarProducto?.(parseInt(document.getElementById('editRowIndex').value)),
            'trabajadoresData': () => window.editarTrabajador?.(parseInt(document.getElementById('editRowIndex').value)),
            'cajaData': () => window.cerrarCaja?.(parseInt(document.getElementById('editRowIndex').value))
        };

        sectionHandlers[key]?.();
    });

    // Exportar datos
    document.getElementById('exportData')?.addEventListener('click', function() {
        const activeSection = document.querySelector('.content-section:not(.d-none)');
        if (!activeSection) return;

        const exportHandlers = {
            'clientes': () => showExportOptions('clientesData', 'clientes', 'Reporte de Clientes'),
            'almacen': () => showExportOptions('almacenData', 'almacen', 'Reporte de Almacén'),
            'trabajadores': () => showExportOptions('trabajadoresData', 'trabajadores', 'Reporte de Trabajadores'),
            'caja': () => showExportOptions('cajaData', 'caja', 'Reporte de Caja')
        };

        exportHandlers[activeSection.id]?.();
    });

     // Buscar en las tablas
     document.getElementById('searchClientes')?.addEventListener('input', function () {
        buscarEnTabla('clientesData', this.value, '#clientesBody');
    });

    document.getElementById('searchAlmacen')?.addEventListener('input', function () {
        buscarEnTabla('almacenData', this.value, '#almacenBody');
    });

    document.getElementById('searchTrabajadores')?.addEventListener('input', function () {
        buscarEnTabla('trabajadoresData', this.value, '#trabajadoresBody');
    });

    document.getElementById('searchCaja')?.addEventListener('input', function () {
        buscarEnTabla('cajaData', this.value, '#cajaBody');
    });

}

function buscarEnTabla(key, termino, tableBodyId) {
    const data = loadDataFromLocalStorage(key);
    const tableBody = document.querySelector(tableBodyId);

    if (!tableBody) {
        console.error(`❌ No se encontró el elemento: ${tableBodyId}`);
        return;
    }

    // Si no hay término de búsqueda, renderiza toda la tabla
    if (!termino) {
        renderTable(key, tableBodyId);
        return;
    }

    // Filtrar los datos según el término de búsqueda
    const terminoLower = termino.toLowerCase();
    const resultados = data.filter((item) => {
        return Object.values(item).some((value) =>
            value?.toString().toLowerCase().includes(terminoLower)
        );
    });

    // Renderizar los resultados
    tableBody.innerHTML = '';
    resultados.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = getRowHTML(key, item, index);
        tableBody.appendChild(row);
    });
}

// Función auxiliar para obtener el HTML de una fila según la tabla
function getRowHTML(key, item, index) {
    if (key === 'clientesData') {
        return `
            <td>${index + 1}</td>
            <td>${item.dni || ''}</td>
            <td>${item.nombre || ''}</td>
            <td>${item.telefono || ''}</td>
            <td>${item.ruc || ''}</td>
            <td>${item.direccion || ''}</td>
            <td>${item.referencia || ''}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editRow('${key}', ${index}, '#clientesBody')">
                    <i class="fas fa-pen-to-square"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteRow('${key}', ${index}, '#clientesBody')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    } else if (key === 'almacenData') {
        const importeInventario = (item.stock * parseFloat(item.precio || 0)).toFixed(2);
        return `
            <td>${index + 1}</td>
            <td>${item.producto || ''}</td>
            <td>${item.descripcion || ''}</td>
            <td>${item.stock || '0'}</td>
            <td>${item.peso || '0'} kg</td>
            <td>${formatCurrency(item.precio || 0)}</td>
            <td>${item.entrada || '0'}</td>
            <td>${item.salida || '0'}</td>
            <td>${formatCurrency(importeInventario)}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editRow('${key}', ${index}, '#almacenBody')">
                    <i class="fas fa-pen-to-square"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteRow('${key}', ${index}, '#almacenBody')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    } else if (key === 'trabajadoresData') {
        return `
            <td>${index + 1}</td>
            <td>${item.numeroTrabajador || ''}</td>
            <td>${item.nombre || ''}</td>
            <td>${item.cargo || ''}</td>
            <td>${item.area || ''}</td>
            <td>${item.sexo || ''}</td>
            <td>${item.edad || ''}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editRow('${key}', ${index}, '#trabajadoresBody')">
                    <i class="fas fa-pen-to-square"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteRow('${key}', ${index}, '#trabajadoresBody')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    } else if (key === 'cajaData') {
        return `
            <td>${index + 1}</td>
            <td>${item.codigo || ''}</td>
            <td>${item.fecha || ''}</td>
            <td class="d-none-tablet d-none-mobile">${item.descripcion || ''}</td>
            <td>${formatCurrency(item.montoApertura || 0)}</td>
            <td>${formatCurrency(item.montoDisponible || item.montoApertura || 0)}</td>
            <td class="d-none-tablet d-none-mobile">${formatCurrency(item.montoCierre || 0)}</td>
            <td class="text-white fw-bold ${item.estado === 'Cerrado' ? 'bg-danger' : 'bg-success'}">
                ${item.estado || 'Abierto'}
            </td>
            <td>
                <button class="btn btn-success btn-sm" onclick="verDetalleCaja(${index})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-primary btn-sm" onclick="cargarCaja(${index})" ${item.estado === 'Cerrado' ? 'disabled' : ''}>
                    <i class="fas fa-plus"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteRow('${key}', ${index}, '#cajaBody')">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="btn btn-sm ${item.estado === 'Cerrado' ? 'btn-secondary opacity-50' : 'btn-dark'}" 
                    onclick="${item.estado === 'Cerrado' ? '' : 'cerrarCaja(' + index + ')'}" 
                    ${item.estado === 'Cerrado' ? 'disabled' : ''}>
                    <i class="fas fa-lock"></i>
                </button>
            </td>
        `;
    }
    return '';
}

function initAllModules() {
    // Inicializar cada módulo si existe
    if (window.initAlmacenModule) initAlmacenModule();
    if (window.initClientesModule) initClientesModule();
    if (window.initTrabajadoresModule) initTrabajadoresModule();
    if (window.initCajaModule) initCajaModule();
}


/**
 * Inicializa la aplicación
 */
function initApp() {
    console.log('🚀 Inicializando aplicación');
    
    // Ejecutar migraciones si es necesario
    ejecutarMigraciones();
    
    // Cargar datos iniciales (solo una vez)
    clientesCache = loadDataFromLocalStorage('clientesData') || [];
    trabajadoresCache = loadDataFromLocalStorage('trabajadoresData') || [];
    almacenCache = loadDataFromLocalStorage('almacenData') || [];
    cajaCache = loadDataFromLocalStorage('cajaData') || [];
    
    // Configurar event listeners
    initEventListeners();

    initAllModules();

    // Renderizar todas las tablas con datos existentes
    renderTable('clientesData', '#clientesBody');
    renderTable('almacenData', '#almacenBody');
    renderTable('trabajadoresData', '#trabajadoresBody');
    renderTable('cajaData', '#cajaBody');
    
    // Mostrar la sección de clientes por defecto
    navigateTo('clientes');
}



/**
 * Actualiza todas las cachés
 */
function actualizarCaches() {
    clientesCache = loadDataFromLocalStorage('clientesData') || [];
    trabajadoresCache = loadDataFromLocalStorage('trabajadoresData') || [];
    almacenCache = loadDataFromLocalStorage('almacenData') || [];
    cajaCache = loadDataFromLocalStorage('cajaData') || [];
}

/**
 * Ejecuta migraciones necesarias para la estructura de datos
 */
function ejecutarMigraciones() {
    // Inicializar clientesData si no existe
    if (!localStorage.getItem('clientesData')) {
        saveDataToLocalStorage('clientesData', []);
        console.log('✅ Inicializado clientesData en localStorage');
    }

    // Migración para códigos únicos en caja
    if (!localStorage.getItem('migration_codes_v1')) {
        const cajaData = loadDataFromLocalStorage('cajaData') || [];
        const existingCodes = [];
        
        const migratedData = cajaData.map(item => {
            if (!item.codigo || item.codigo.startsWith('CO')) {
                return {
                    ...item,
                    codigo: generarCodigoUnico(existingCodes)
                };
            }
            existingCodes.push(item.codigo);
            return item;
        });
        
        saveDataToLocalStorage('cajaData', migratedData);
        localStorage.setItem('migration_codes_v1', 'true');
    }

    // Migración para números de trabajador únicos
    if (!localStorage.getItem('migration_trabajadores_v1')) {
        const trabajadoresData = loadDataFromLocalStorage('trabajadoresData') || [];
        const existingNumbers = [];
        
        const migratedData = trabajadoresData.map(item => {
            if (!item.numeroTrabajador || !item.numeroTrabajador.startsWith('TR')) {
                return {
                    ...item,
                    numeroTrabajador: generarNumeroTrabajadorUnico(existingNumbers)
                };
            }
            existingNumbers.push(item.numeroTrabajador);
            return item;
        });
        
        saveDataToLocalStorage('trabajadoresData', migratedData);
        localStorage.setItem('migration_trabajadores_v1', 'true');
    }

    // Migración para estructura de caja
    if (!localStorage.getItem('migration_caja_v2')) {
        const cajaData = loadDataFromLocalStorage('cajaData') || [];
        
        const migratedData = cajaData.map(item => {
            if ('monto' in item && !('montoApertura' in item)) {
                return {
                    ...item,
                    montoApertura: item.monto,
                    montoDisponible: item.monto,
                    montoCierre: item.estado === 'Cerrado' ? item.monto : '0.00',
                    monto: undefined
                };
            }
            return item;
        });
        
        saveDataToLocalStorage('cajaData', migratedData);
        localStorage.setItem('migration_caja_v2', 'true');
    }
}


// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);





