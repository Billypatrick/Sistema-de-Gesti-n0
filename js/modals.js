/**
 * modals.js - Módulo para gestión de modales
 * Contiene todas las funciones relacionadas con la creación y manejo de modales
 */

import { saveDataToLocalStorage, loadDataFromLocalStorage } from './utils.js';

/**
 * Mapa de campos para los modales de cada sección
 * Define la estructura de los formularios en los modales de agregar/editar
 */
export const modalFieldMap = {
    'clientes': [
        { 
            id: 'modalInputDNI', 
            label: 'DNI', 
            type: 'text', 
            required: true,
            validation: (input) => {
                input.setAttribute('maxlength', '8');
                input.setAttribute('pattern', '\\d{8}');
                input.setAttribute('title', 'Debe contener 8 dígitos');
                input.setAttribute('oninput', "this.value = this.value.replace(/[^0-9]/g, '')");
            }
        },
        { 
            id: 'modalInputNombre', 
            label: 'Nombre y Apellidos', 
            type: 'text', 
            required: true,
            validation: (input) => {
                input.setAttribute('maxlength', '100');
                input.setAttribute('oninput', "this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]/g, '')");
            }
        },
        { 
            id: 'modalInputTelefono', 
            label: 'Teléfono', 
            type: 'text', 
            required: true,
            validation: (input) => {
                input.setAttribute('maxlength', '12');
                input.setAttribute('oninput', "this.value = this.value.replace(/[^0-9]/g, '')");
            }
        },
        { 
            id: 'modalInputRUC', 
            label: 'RUC', 
            type: 'text',
            validation: (input) => {
                input.setAttribute('maxlength', '11');
                input.setAttribute('oninput', "this.value = this.value.replace(/[^0-9]/g, '')");
            }
        },
        { 
            id: 'modalInputDireccion', 
            label: 'Dirección', 
            type: 'text', 
            required: true,
            validation: (input) => input.setAttribute('maxlength', '150')
        },
        { 
            id: 'modalInputReferencia', 
            label: 'Referencia', 
            type: 'text',
            validation: (input) => input.setAttribute('maxlength', '150')
        }
    ],
    'almacen': [
        { 
            id: 'modalInputProducto', 
            label: 'Producto', 
            type: 'text', 
            required: true,
            validation: (input) => input.setAttribute('maxlength', '100')
        },
        {
            id: 'modalInputDescripcion',
            label: 'Descripción',
            type: 'textarea',
            validation: (input) => {
                input.setAttribute('rows', '3');
                input.setAttribute('maxlength', '255');
            }
        },
        { 
            id: 'modalInputStock', 
            label: 'Stock Inicial', 
            type: 'number', 
            required: true,
            validation: (input) => {
                input.setAttribute('min', '0');
                input.setAttribute('step', '1');
                input.value = '0';
            }
        },
        { 
            id: 'modalInputPrecio', 
            label: 'Precio Unitario', 
            type: 'number', 
            required: true,
            validation: (input) => {
                input.setAttribute('min', '0');
                input.setAttribute('step', '0.01');
                input.value = '0.00';
            }
        },
        { 
            id: 'modalInputEntrada', 
            label: 'Entrada', 
            type: 'number', 
            required: true,
            validation: (input) => {
                input.setAttribute('min', '0');
                input.setAttribute('step', '1');
                input.value = '0';
            }
        },
        { 
            id: 'modalInputSalida', 
            label: 'Salida', 
            type: 'number', 
            required: true,
            validation: (input) => {
                input.setAttribute('min', '0');
                input.setAttribute('step', '1');
                input.value = '0';
            }
        }
    ],
    'trabajadores': [
        { 
            id: 'modalInputNombre', 
            label: 'Nombre y Apellidos', 
            type: 'text', 
            required: true,
            validation: (input) => {
                input.setAttribute('maxlength', '100');
                input.setAttribute('oninput', "this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]/g, '')");
            }
        },
        { 
            id: 'modalInputCargo', 
            label: 'Cargo', 
            type: 'text', 
            required: true,
            validation: (input) => input.setAttribute('maxlength', '50')
        },
        {
            id: 'modalInputArea',
            label: 'Área',
            type: 'select',
            options: ['Ventas', 'Logística', 'Administración', 'Recursos Humanos', 'Producción', 'Otro'],
            required: false
        },
        {
            id: 'modalInputSexo',
            label: 'Sexo',
            type: 'select',
            options: ['Masculino', 'Femenino', 'Otro'],
            required: false
        },
        { 
            id: 'modalInputEdad', 
            label: 'Edad', 
            type: 'number', 
            required: true,
            validation: (input) => {
                input.setAttribute('min', '18');
                input.setAttribute('max', '100');
                input.value = '18';
            }
        }
    ],
    'caja': [
        { 
            id: 'modalInputDescripcion', 
            label: 'Descripción', 
            type: 'text', 
            required: true,
            validation: (input) => input.setAttribute('maxlength', '100')
        },
        { 
            id: 'modalInputMontoApertura', 
            label: 'Monto Apertura', 
            type: 'number', 
            required: true,
            validation: (input) => {
                input.setAttribute('min', '0');
                input.setAttribute('step', '0.01');
                input.value = '0.00';
            }
        }
    ]
};

/**
 * Crea un elemento de input para el modal
 * @param {object} field - Configuración del campo
 * @returns {HTMLElement} Elemento de input creado
 */
export function createModalInput(field) {
    let input;

    // Limpiar validación previa si existe
    if (field.id) {
        const existingInput = document.getElementById(field.id);
        if (existingInput) {
            existingInput.classList.remove('is-invalid');
        }
    }
    
    // Crear el elemento adecuado según el tipo
    if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.className = 'form-control';
        input.id = field.id;
        input.value = field.value || '';
        input.rows = 3;
    } 
    else if (field.type === 'select') {
        input = document.createElement('select');
        input.className = 'form-select';
        input.id = field.id;
        
        // Agregar opción vacía si no es requerido
        if (!field.required) {
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = '-- Seleccione --';
            input.appendChild(emptyOption);
        }
        
        // Agregar opciones proporcionadas
        field.options.forEach(option => {
            const optElement = document.createElement('option');
            optElement.value = option;
            optElement.textContent = option;
            input.appendChild(optElement);
        });
        
        // Establecer valor si existe
        if (field.value) input.value = field.value;
    }
    else {
        input = document.createElement('input');
        input.type = field.type || 'text';
        input.className = 'form-control';
        input.id = field.id;
        input.value = field.value || '';
    }
    
    // Configurar atributos requeridos
    if (field.required) {
        input.required = true;
    }
    
    // Aplicar validación personalizada si existe
    if (field.validation) {
        field.validation(input);
    }
    
    return input;
}

/**
 * Configura los campos del modal para una sección específica
 * @param {string} sectionId - ID de la sección (clientes, almacen, etc.)
 * @param {string} modalType - Tipo de modal ('add' o 'edit')
 */
export function setupModalFields(sectionId, modalType = 'add') {
    const formId = modalType === 'add' ? 'modalForm' : 'editDataForm';
    const form = document.getElementById(formId);
    
    if (!form) {
        console.error(`❌ No se encontró el formulario: ${formId}`);
        return;
    }

    // Limpiar formulario existente
    form.innerHTML = '';

    // Crear contenedor principal con dos columnas
    const container = document.createElement('div');
    container.className = 'row g-3'; // row con gutter vertical de 3

    // Crear columnas
    const leftCol = document.createElement('div');
    leftCol.className = 'col-md-6';
    const rightCol = document.createElement('div');
    rightCol.className = 'col-md-6';

    // Obtener campos para esta sección
    const fields = modalFieldMap[sectionId];
    if (!fields) {
        console.error(`❌ No se encontraron campos para la sección: ${sectionId}`);
        return;
    }

    // Dividir campos en dos grupos
    const half = Math.ceil(fields.length / 2);
    const leftFields = fields.slice(0, half);
    const rightFields = fields.slice(half);

    // Función para agregar campos a una columna
    const addFieldsToColumn = (fields, column) => {
        fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'mb-3';

            const label = document.createElement('label');
            label.setAttribute('for', field.id);
            label.className = 'form-label';
            label.textContent = field.label;

            const input = createModalInput(field);

            // Estilo especial para campos monetarios
            if (field.id.includes('Monto') || field.id.includes('Precio')) {
                const inputGroup = document.createElement('div');
                inputGroup.className = 'input-group';
                
                const currencySpan = document.createElement('span');
                currencySpan.className = 'input-group-text';
                currencySpan.textContent = 'S/';
                
                inputGroup.appendChild(currencySpan);
                inputGroup.appendChild(input);
                
                fieldDiv.appendChild(label);
                fieldDiv.appendChild(inputGroup);
            } else {
                fieldDiv.appendChild(label);
                fieldDiv.appendChild(input);
            }
            
            column.appendChild(fieldDiv);
        });
    };

    // Agregar campos a las columnas
    addFieldsToColumn(leftFields, leftCol);
    addFieldsToColumn(rightFields, rightCol);

    // Agregar columnas al contenedor
    container.appendChild(leftCol);
    container.appendChild(rightCol);
    form.appendChild(container);

    // Agregar campos ocultos para el modal de edición
    if (modalType === 'edit') {
        const hiddenDiv = document.createElement('div');
        hiddenDiv.className = 'd-none';
        
        const rowIndexInput = document.createElement('input');
        rowIndexInput.type = 'hidden';
        rowIndexInput.id = 'editRowIndex';
        
        const tableKeyInput = document.createElement('input');
        tableKeyInput.type = 'hidden';
        tableKeyInput.id = 'editTableKey';
        
        hiddenDiv.appendChild(rowIndexInput);
        hiddenDiv.appendChild(tableKeyInput);
        form.appendChild(hiddenDiv);
    }
}

/**
 * Muestra el modal de confirmación para eliminar un registro
 * @param {function} callback - Función a ejecutar si se confirma la eliminación
 */
export function showDeleteConfirmationModal(callback) {
    Swal.fire({
        title: "¿Estás seguro?",
        text: "¡No podrás revertir esta acción!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, eliminarlo",
        cancelButtonText: "Cancelar",
        backdrop: true,
        allowOutsideClick: false,
        allowEscapeKey: true
    }).then((result) => {
        if (result.isConfirmed && typeof callback === 'function') {
            callback();
        }
    });
}

/**
 * Muestra el modal de edición con los datos de un registro
 * @param {string} key - Clave de los datos (ej. 'clientesData')
 * @param {number} index - Índice del registro a editar
 */
export function showEditModal(key, index) {
    const data = loadDataFromLocalStorage(key);
    const item = data[index];
    
    if (!item) {
        console.error(`❌ No se encontró el registro ${index} en ${key}`);
        Swal.fire('Error', 'No se pudo cargar el registro para editar', 'error');
        return;
    }

    // Configurar campos según el tipo de datos
    const fields = getEditFieldsForSection(key, item);
    setupModalFields(key.split('Data')[0].toLowerCase(), 'edit');
    
    // Llenar los campos con los datos existentes
    fields.forEach(field => {
        const input = document.getElementById(field.id);
        if (input) {
            input.value = field.value || '';
            
            // Configuraciones especiales para campos de solo lectura
            if (field.readOnly) {
                input.readOnly = true;
                input.style.backgroundColor = '#f8f9fa';
            }
        }
    });

    // Establecer los valores ocultos
    document.getElementById('editRowIndex').value = index;
    document.getElementById('editTableKey').value = key;

    // Mostrar el modal
    const editModal = new bootstrap.Modal(document.getElementById('editDataModal'));
    editModal.show();
}

/**
 * Obtiene los campos de edición para una sección específica
 * @param {string} key - Clave de los datos (ej. 'clientesData')
 * @param {object} item - Datos del registro a editar
 * @returns {array} Array de campos configurados
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
 * Maneja el evento de guardar datos del modal de edición
 */
export function handleSaveEditData() {
    const key = document.getElementById('editTableKey').value;
    const index = parseInt(document.getElementById('editRowIndex').value, 10);
    const data = loadDataFromLocalStorage(key);
    
    // Validar que los datos existen
    if (!data || !data[index]) {
        Swal.fire('Error', 'No se encontraron los datos para editar', 'error');
        return;
    }

    // Actualizar los datos según la sección
    const updatedItem = updateItemData(key, data[index]);
    if (!updatedItem) return;

    // Guardar los cambios
    data[index] = updatedItem;
    saveDataToLocalStorage(key, data);

    // Cerrar el modal y mostrar confirmación
    const editModal = bootstrap.Modal.getInstance(document.getElementById('editDataModal'));
    editModal.hide();
    
    Swal.fire({
        icon: 'success',
        title: 'Actualizado',
        text: 'Los cambios se guardaron correctamente',
        timer: 1500,
        showConfirmButton: false
    });

    return true;
}

/**
 * Actualiza los datos de un ítem según su tipo
 * @param {string} key - Clave de los datos (ej. 'clientesData')
 * @param {object} item - Ítem a actualizar
 * @returns {object|false} Ítem actualizado o false si hay error
 */
function updateItemData(key, item) {
    const section = key.replace('Data', '').toLowerCase();
    
    try {
        if (section === 'clientes') {
            return {
                ...item,
                dni: document.getElementById('editInputDNI').value.trim(),
                nombre: document.getElementById('editInputNombre').value.trim(),
                telefono: document.getElementById('editInputTelefono').value.trim(),
                ruc: document.getElementById('editInputRUC').value.trim(),
                direccion: document.getElementById('editInputDireccion').value.trim(),
                referencia: document.getElementById('editInputReferencia').value.trim()
            };
        }
        
        if (section === 'almacen') {
            const entrada = parseInt(document.getElementById('editInputEntrada').value) || 0;
            const salida = parseInt(document.getElementById('editInputSalida').value) || 0;
            const stockActual = parseInt(item.stock) || 0;
            
            if (salida > stockActual + entrada) {
                Swal.fire('Error', 'La salida no puede ser mayor al stock disponible', 'error');
                return false;
            }
            
            return {
                ...item,
                producto: document.getElementById('editInputProducto').value.trim(),
                descripcion: document.getElementById('editInputDescripcion').value.trim(),
                precio: parseFloat(document.getElementById('editInputPrecio').value || 0).toFixed(2),
                entrada: entrada,
                salida: salida,
                stock: (stockActual + entrada - salida).toString()
            };
        }
        
        if (section === 'trabajadores') {
            const edad = parseInt(document.getElementById('editInputEdad').value);
            if (edad < 18 || edad > 100) {
                Swal.fire('Error', 'La edad debe estar entre 18 y 100 años', 'error');
                return false;
            }
            
            return {
                ...item,
                nombre: document.getElementById('editInputNombre').value.trim(),
                cargo: document.getElementById('editInputCargo').value.trim(),
                area: document.getElementById('editInputArea').value,
                sexo: document.getElementById('editInputSexo').value,
                edad: edad
            };
        }
        
        if (section === 'caja') {
            return {
                ...item,
                descripcion: document.getElementById('editInputDescripcion').value.trim(),
                montoApertura: parseFloat(document.getElementById('editInputMontoApertura').value || 0).toFixed(2),
                montoDisponible: parseFloat(document.getElementById('editInputMontoDisponible').value || 0).toFixed(2),
                montoCierre: parseFloat(document.getElementById('editInputMontoCierre').value || 0).toFixed(2)
            };
        }
    } catch (error) {
        console.error('Error al actualizar datos:', error);
        Swal.fire('Error', 'Ocurrió un error al actualizar los datos', 'error');
        return false;
    }
}

/**
 * Inicializa los event listeners para los modales
 */
export function initModalEventListeners() {
    // Configurar campos del modal al mostrar
    document.querySelectorAll('[data-bs-target="#addDataModal"]').forEach(button => {
        button.addEventListener('click', function() {
            const section = this.getAttribute('data-section') || 
                           document.querySelector('.content-section:not(.d-none)').id;
            setupModalFields(section, 'add');
        });
    });

    // Manejar guardado de datos en el modal de edición
    document.getElementById('saveEditData')?.addEventListener('click', handleSaveEditData);
}

// Inicializar los event listeners al cargar el módulo
initModalEventListeners();