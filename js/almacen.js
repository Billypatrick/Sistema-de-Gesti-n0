/**
 * almacen.js - Módulo para gestión de almacén
 * Contiene todas las funciones relacionadas con la gestión de productos en el almacén
 */

import { 
    saveDataToLocalStorage, 
    loadDataFromLocalStorage,
    formatCurrency
} from './utils.js';
import { showExportOptions } from './utils.js';
import { renderTable } from './app.js';
import { setupModalFields, showDeleteConfirmationModal } from './modals.js';

// Caché de productos para búsquedas
let almacenCache = [];

/**
 * Actualiza la caché de productos desde localStorage
 */
export function actualizarCacheAlmacen() {
    almacenCache = loadDataFromLocalStorage('almacenData') || [];
}

/**
 * Valida los datos de un producto antes de guardar
 * @param {object} producto - Objeto con los datos del producto
 * @returns {boolean} True si los datos son válidos
 */
function validarProducto(producto) {
    // Validar nombre del producto
    if (!producto.producto || producto.producto.trim().length < 3) {
        Swal.fire('Error', 'El nombre del producto debe tener al menos 3 caracteres', 'error');
        document.getElementById('modalInputProducto').classList.add('is-invalid');
        return false;
    }

    // Validar stock
    const stock = parseInt(producto.stock);
    if (isNaN(stock)) {
        Swal.fire('Error', 'El stock debe ser un número válido', 'error');
        document.getElementById('modalInputStock').classList.add('is-invalid');
        return false;
    }

    // Validar precio
    const precio = parseFloat(producto.precio);
    if (isNaN(precio)) {
        Swal.fire('Error', 'El precio debe ser un número válido', 'error');
        document.getElementById('modalInputPrecio').classList.add('is-invalid');
        return false;
    }

    // Validar entrada
    const entrada = parseInt(producto.entrada);
    if (isNaN(entrada)) {
        Swal.fire('Error', 'La entrada debe ser un número válido', 'error');
        document.getElementById('modalInputEntrada').classList.add('is-invalid');
        return false;
    }

    // Validar salida
    const salida = parseInt(producto.salida);
    if (isNaN(salida)) {
        Swal.fire('Error', 'La salida debe ser un número válido', 'error');
        document.getElementById('modalInputSalida').classList.add('is-invalid');
        return false;
    }

    // Validar que salida no sea mayor que stock disponible
    if (salida > (stock + entrada)) {
        Swal.fire('Error', 'La salida no puede ser mayor al stock disponible', 'error');
        document.getElementById('modalInputSalida').classList.add('is-invalid');
        return false;
    }

    return true;
}

/**
 * Agrega un nuevo producto al almacén
 */
export function agregarProducto() {
    // Obtener valores del formulario
    const producto = {
        producto: document.getElementById('modalInputProducto').value.trim(),
        descripcion: document.getElementById('modalInputDescripcion').value.trim(),
        stock: document.getElementById('modalInputStock').value.trim(),
        peso: document.getElementById('modalInputPeso').value.trim(),
        precio: document.getElementById('modalInputPrecio').value.trim(),
        entrada: document.getElementById('modalInputEntrada').value.trim(),
        salida: document.getElementById('modalInputSalida').value.trim(),
        fechaActualizacion: new Date().toISOString()
    };

    // Validar datos
    if (!validarProducto(producto)) {
        return false;
    }

    // Calcular stock final
    producto.stock = (parseInt(producto.stock) + parseInt(producto.entrada) - parseInt(producto.salida)).toString();

    // Agregar el producto
    const productos = loadDataFromLocalStorage('almacenData');
    productos.push(producto);
    const resultado = saveDataToLocalStorage('almacenData', productos);

    if (resultado) {
        // Mostrar confirmación
        Swal.fire({
            icon: 'success',
            title: 'Producto agregado',
            text: `${producto.producto} ha sido registrado en el almacén`,
            timer: 1500,
            showConfirmButton: false
        });

        // Cerrar el modal y actualizar la tabla
        const modal = bootstrap.Modal.getInstance(document.getElementById('addDataModal'));
        modal.hide();
        renderTable('almacenData', '#almacenBody');
        
        return true;
    }

    return false;
}

/**
 * Edita un producto existente
 * @param {number} index - Índice del producto en el array
 */
export function editarProducto(index) {
    const productos = loadDataFromLocalStorage('almacenData');
    const producto = productos[index];

    
    if (!producto) {
        Swal.fire('Error', 'No se encontró el producto a editar', 'error');
        return false;
    }

    // Obtener valores del formulario
    const entrada = parseInt(document.getElementById('editInputEntrada').value) || 0;
    const salida = parseInt(document.getElementById('editInputSalida').value) || 0;
    const stockActual = parseInt(producto.stock) || 0;

    // Validar que salida no sea mayor que stock disponible
    if (salida > (stockActual + entrada)) {
        Swal.fire('Error', 'La salida no puede ser mayor al stock disponible', 'error');
        document.getElementById('editInputSalida').classList.add('is-invalid');
        return false;
    }

    // Actualizar el producto
    const productoActualizado = {
        ...producto,
        producto: document.getElementById('editInputProducto').value.trim(),
        descripcion: document.getElementById('editInputDescripcion').value.trim(),
        precio: parseFloat(document.getElementById('editInputPrecio').value || 0).toFixed(2),
        peso: document.getElementById('editInputPeso').value.trim(),
        entrada: entrada,
        salida: salida,
        stock: (stockActual + entrada - salida).toString(),
        fechaActualizacion: new Date().toISOString()
    };

    productos[index] = productoActualizado;
    const resultado = saveDataToLocalStorage('almacenData', productos);

    if (resultado) {
        // Mostrar confirmación
        Swal.fire({
            icon: 'success',
            title: 'Cambios guardados',
            text: `Los datos de ${productoActualizado.producto} han sido actualizados`,
            timer: 1500,
            showConfirmButton: false
        });

        // Cerrar el modal y actualizar la tabla
        const modal = bootstrap.Modal.getInstance(document.getElementById('editDataModal'));
        modal.hide();
        renderTable('almacenData', '#almacenBody');
        
        return true;
    }

    return false;
}

/**
 * Elimina un producto del almacén
 * @param {number} index - Índice del producto a eliminar
 */
export function eliminarProducto(index) {
    showDeleteConfirmationModal(() => {
        const productos = loadDataFromLocalStorage('almacenData');
        const productoEliminado = productos[index];

        if (!productoEliminado) {
            Swal.fire('Error', 'No se encontró el producto a eliminar', 'error');
            return;
        }

        // Eliminar el producto
        productos.splice(index, 1);
        saveDataToLocalStorage('almacenData', productos);

        // Mostrar confirmación
        Swal.fire({
            icon: 'success',
            title: 'Producto eliminado',
            text: `${productoEliminado.producto} ha sido removido del almacén`,
            timer: 1500,
            showConfirmButton: false
        });

        // Actualizar la tabla
        renderTable('almacenData', '#almacenBody');
    });
}

/**
 * Busca productos según un término de búsqueda
 * @param {string} termino - Término de búsqueda
 */
export function buscarProductos(termino) {
    const tablaBody = document.querySelector('#almacenBody');
    
    if (!termino) {
        renderTable('almacenData', '#almacenBody');
        return;
    }

    // Actualizar caché si está vacía
    if (almacenCache.length === 0) {
        actualizarCacheAlmacen();
    }

    const terminoLower = termino.toLowerCase();
    const resultados = almacenCache.filter(producto => {
        return (
            (producto.producto && producto.producto.toLowerCase().includes(terminoLower)) ||
            (producto.descripcion && producto.descripcion.toLowerCase().includes(terminoLower))
        );
    });

    // Mostrar resultados
    tablaBody.innerHTML = '';
    
    resultados.forEach((producto, index) => {
        const importeInventario = (producto.stock * parseFloat(producto.precio || 0)).toFixed(2);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${producto.producto || ''}</td>
            <td>${producto.descripcion || ''}</td>
            <td>${producto.stock || '0'}</td>
            <td>${formatCurrency(producto.precio || 0)}</td>
            <td>${producto.entrada || '0'}</td>
            <td>${producto.salida || '0'}</td>
            <td>${formatCurrency(importeInventario)}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editarProducto(${almacenCache.findIndex(p => p.producto === producto.producto)})">
                    <i class="fas fa-pen-to-square"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="eliminarProducto(${almacenCache.findIndex(p => p.producto === producto.producto)})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tablaBody.appendChild(row);
    });
}

/**
 * Exporta los productos en diferentes formatos
 */
export function exportarProductos() {
    showExportOptions('almacenData', 'almacen', 'Reporte de Almacén');
}



/**
 * Muestra un reporte de stock crítico (productos con bajo stock)
 * @param {number} threshold - Umbral para considerar stock crítico (por defecto 5)
 */
export function mostrarStockCritico(threshold = 5) {
    const productos = loadDataFromLocalStorage('almacenData');
    const productosCriticos = productos.filter(p => parseInt(p.stock) <= threshold);

    if (productosCriticos.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Stock en buen estado',
            text: `No hay productos con stock menor o igual a ${threshold} unidades`,
            timer: 2000,
            showConfirmButton: false
        });
        return;
    }

    let htmlContent = `
        <div class="table-responsive">
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Stock</th>
                        <th>Precio</th>
                    </tr>
                </thead>
                <tbody>
    `;

    productosCriticos.forEach(producto => {
        htmlContent += `
            <tr>
                <td>${producto.producto}</td>
                <td class="text-danger fw-bold">${producto.stock}</td>
                <td>${formatCurrency(producto.precio)}</td>
            </tr>
        `;
    });

    htmlContent += `
                </tbody>
            </table>
        </div>
        <p class="mt-2 text-muted">Total de productos críticos: ${productosCriticos.length}</p>
    `;

    Swal.fire({
        title: `Stock Crítico (≤ ${threshold} unidades)`,
        html: htmlContent,
        width: '600px',
        confirmButtonText: 'Cerrar'
    });
}

/**
 * Inicializa los event listeners para la sección de almacén
 */
function initAlmacenEventListeners() {
    // Guardar nuevo producto
    document.getElementById('saveModalData')?.addEventListener('click', function() {
        const activeSection = document.querySelector('.content-section:not(.d-none)');
        if (activeSection && activeSection.id === 'almacen') {
            agregarProducto();
        }
    });

    // Buscar productos
    document.getElementById('searchAlmacen')?.addEventListener('input', function() {
        buscarProductos(this.value);
    });

    // Exportar productos
    document.getElementById('exportData')?.addEventListener('click', function() {
        const activeSection = document.querySelector('.content-section:not(.d-none)');
        if (activeSection && activeSection.id === 'almacen') {
            exportarProductos();
        }
    });

    // Botón para mostrar stock crítico
    document.getElementById('btnStockCritico')?.addEventListener('click', function() {
        mostrarStockCritico(5);
    });
}

export function initAlmacenModule() {
    actualizarCacheAlmacen();
    initAlmacenEventListeners();
}

// Hacer funciones disponibles globalmente para eventos en HTML
window.agregarProducto = agregarProducto;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.buscarProductos = buscarProductos;
window.exportarProductos = exportarProductos;
window.mostrarStockCritico = mostrarStockCritico;