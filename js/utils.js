/**
 * utils.js - Módulo de utilidades compartidas
 * Contiene funciones genéricas utilizadas por otros módulos del sistema
 */

/**
 * Guarda datos en el localStorage
 * @param {string} key - Clave bajo la que se guardarán los datos
 * @param {object} data - Datos a guardar (serán convertidos a JSON)
 */
export function saveDataToLocalStorage(key, data) {
    try {
        // Convertir a JSON y guardar
        const jsonData = JSON.stringify(data);
        localStorage.setItem(key, jsonData);
        
        console.log(`✅ Datos guardados en localStorage (${key})`);
        
        // Actualizar todas las cachés relevantes
        if (key === 'clientesData') window.clientesCache = data;
        if (key === 'trabajadoresData') window.trabajadoresCache = data;
        if (key === 'almacenData') window.almacenCache = data;
        if (key === 'cajaData') window.cajaCache = data;
        
        return true;
    } catch (error) {
        console.error("❌ Error al guardar en localStorage:", error);
        Swal.fire('Error', 'No se pudieron guardar los datos. El almacenamiento local puede estar lleno.', 'error');
        return false;
    }
}



/**
 * Carga datos desde el localStorage
 * @param {string} key - Clave de los datos a recuperar
 * @returns {array} Datos recuperados (o array vacío si no existen)
 */
export function loadDataFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        if (!data) return [];  // Devuelve array vacío si no existe
        return JSON.parse(data) || [];  // Devuelve array vacío si parseo falla
    } catch (error) {
        console.error("Error al cargar datos:", error);
        return [];  // Siempre devuelve array vacío en caso de error
    }
}
/**
 * Genera un código único para registros de caja
 * @param {array} existingCodes - Array de códigos existentes
 * @returns {string} Código único en formato CAJ-XXXX
 */
export function generarCodigoUnico(existingCodes = []) {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Eliminamos caracteres ambiguos
    let codigo;
    let intentos = 0;
    const maxIntentos = 100;
    
    do {
        codigo = 'CAJ-';
        for (let i = 0; i < 4; i++) {
            codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
        }
        intentos++;
        
        if (intentos >= maxIntentos) {
            // Fallback si por alguna razón no se genera un código único
            codigo += Date.now().toString().slice(-3);
            break;
        }
    } while (existingCodes.includes(codigo));
    
    return codigo;
}

/**
 * Genera un número único para trabajadores
 * @param {array} existingNumbers - Array de números existentes
 * @returns {string} Número único en formato TR-XXXX
 */
export function generarNumeroTrabajadorUnico(existingNumbers = []) {
    const prefix = 'TR-';
    let numero;
    let intentos = 0;
    const maxIntentos = 100;
    
    do {
        // Genera 4 dígitos aleatorios (1000-9999)
        numero = prefix + Math.floor(1000 + Math.random() * 9000);
        intentos++;
        
        if (intentos >= maxIntentos) {
            // Fallback con timestamp si no se encuentra único
            numero = prefix + Date.now().toString().slice(-4);
            break;
        }
    } while (existingNumbers.includes(numero));
    
    return numero;
}

/**
 * Formatea una fecha a formato legible
 * @param {Date} date - Objeto fecha a formatear
 * @returns {string} Fecha formateada como DD/MM/YYYY HH:MM
 */
export function formatDate(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Valida un DNI peruano
 * @param {string} dni - DNI a validar
 * @returns {boolean} True si el DNI es válido
 */
export function validarDNI(dni) {
    if (!dni) return false;
    const dniStr = dni.toString().trim();
    if (dniStr.length !== 8) return false;
    if (!/^\d+$/.test(dniStr)) return false;
    return true;
}

/**
 * Valida un RUC peruano
 * @param {string} ruc - RUC a validar
 * @returns {boolean} True si el RUC es válido
 */
export function validarRUC(ruc) {
    if (!ruc) return false;
    const rucStr = ruc.toString().trim();
    if (rucStr.length !== 11) return false;
    if (!/^\d+$/.test(rucStr)) return false;
    return true;
}

/**
 * Valida un número de teléfono
 * @param {string} telefono - Número a validar
 * @returns {boolean} True si el teléfono es válido
 */
export function validarTelefono(telefono) {
    if (!telefono) return false;
    const telStr = telefono.toString().trim();
    if (telStr.length !== 9) return false; // Cambiado a 9 dígitos
    if (!/^\d+$/.test(telStr)) return false;
    return true;
}

/**
 * Formatea un número como moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} symbol - Símbolo monetario (por defecto 'S/')
 * @param {number} decimals - Decimales a mostrar (por defecto 2)
 * @returns {string} Cantidad formateada como moneda
 */
export function formatCurrency(amount, symbol = 'S/', decimals = 2) {
    const numericAmount = parseFloat(amount) || 0;
    return `${symbol} ${numericAmount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

// Variables de caché
let clientesCache = [];
let trabajadoresCache = [];
let almacenCache = [];

/**
 * Actualiza la caché de clientes
 */
export function actualizarCacheClientes() {
    clientesCache = loadDataFromLocalStorage('clientesData') || [];
}

/**
 * Actualiza la caché de trabajadores
 */
export function actualizarCacheTrabajadores() {
    trabajadoresCache = loadDataFromLocalStorage('trabajadoresData') || [];
}

/**
 * Actualiza la caché de almacén
 */
export function actualizarCacheAlmacen() {
    almacenCache = loadDataFromLocalStorage('almacenData') || [];
}

/**
 * Ejecuta migraciones necesarias para la estructura de datos
 */
export function ejecutarMigraciones() {
    // Migración para códigos únicos (solo se ejecutará una vez)
    const hasMigratedCodes = localStorage.getItem('migration_codes_v1');
    if (!hasMigratedCodes) {
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
        console.log('✅ Migración de códigos completada');
    }

    // Migración para números de trabajador únicos
    const hasMigratedTrabajadores = localStorage.getItem('migration_trabajadores_v1');
    if (!hasMigratedTrabajadores) {
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
        console.log('✅ Migración de números de trabajador completada');
    }

    // Migración para montos en caja
    const hasMigratedCaja = localStorage.getItem('migration_caja_v1');
    if (!hasMigratedCaja) {
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
        localStorage.setItem('migration_caja_v1', 'true');
        console.log('✅ Migración de datos de caja completada');
    }
}

/**
 * Exporta datos a un archivo JSON
 * @param {string} key - Clave de los datos a exportar
 * @param {string} fileName - Nombre del archivo de salida
 */
export function exportToJSON(key, fileName = 'data') {
    const data = loadDataFromLocalStorage(key);
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${fileName}_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

/**
 * Importa datos desde un archivo JSON
 * @param {File} file - Archivo JSON a importar
 * @param {string} key - Clave bajo la que se guardarán los datos
 * @returns {Promise} Promesa que resuelve cuando se completa la importación
 */
export function importFromJSON(file, key) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (Array.isArray(data)) {
                    saveDataToLocalStorage(key, data);
                    resolve(data);
                } else {
                    reject(new Error('El archivo no contiene un array válido'));
                }
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error al leer el archivo'));
        };
        
        reader.readAsText(file);
    });
}

// Inicializar cachés al cargar el módulo
actualizarCacheClientes();
actualizarCacheTrabajadores();
actualizarCacheAlmacen();
ejecutarMigraciones();