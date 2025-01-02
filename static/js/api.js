// URLs de la API
const urls = {
    listar: '/api/listar/',
    eliminar: '/api/eliminar/',
    renombrar: '/api/renombrar/',
    mover: '/api/mover/',
};

// Función para listar archivos y carpetas
export async function listarArchivos(ruta = '') {
    try {
        const response = await fetch(`${urls.listar}?ruta=${encodeURIComponent(ruta)}`);
        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error('Error al listar archivos:', error);
        return [];
    }
}

// Función para eliminar un elemento
export async function eliminarElemento(nombre, ruta) {
    const confirmacion = confirm(`¿Seguro que quieres eliminar "${nombre}"?`);
    if (!confirmacion) return false;

    try {
        const response = await fetch(urls.eliminar, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `ruta=${encodeURIComponent(ruta)}`,
        });
        const data = await response.json();
        return response.ok;
    } catch (error) {
        console.error('Error al eliminar elemento:', error);
        return false;
    }
}


// Función para renombrar un elemento
export async function renombrarElemento(ruta, nuevoNombre) {
    if (!nuevoNombre) return false;

    try {
        const response = await fetch(urls.renombrar, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `ruta=${encodeURIComponent(ruta)}&nuevo_nombre=${encodeURIComponent(nuevoNombre)}`,
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.mensaje);
            return true;
        } else {
            alert(data.error);
            return false;
        }
    } catch (error) {
        console.error('Error al renombrar elemento:', error);
        return false;
    }
}

// Función para mover un elemento
export async function moverElemento(ruta, destino) {
    try {
        const response = await fetch(urls.mover, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `ruta=${encodeURIComponent(ruta)}&destino=${encodeURIComponent(destino)}`,
        });
        const data = await response.json();

        if (response.ok) {
            alert(data.mensaje);
            return true;
        } else {
            alert(data.error);
            return false;
        }
    } catch (error) {
        console.error('Error al mover elemento:', error);
        return false;
    }
}
// Función para crear una carpeta
export async function crearCarpeta(nombre, ruta) {
    const rutaCompleta = ruta ? `${ruta}/${nombre}` : nombre;
    try {
        const response = await fetch('/api/crear-carpeta/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `nombre=${encodeURIComponent(rutaCompleta)}`,
        });
        return await response.json();
    } catch (error) {
        console.error('Error al crear carpeta:', error);
        return null;
    }
}

// Función para subir archivos
export async function subirArchivo(archivo, carpetaSeleccionada) {
    const formData = new FormData();
    formData.append('archivo', archivo);
    if (carpetaSeleccionada) {
        formData.append('carpeta', carpetaSeleccionada);
    }
    try {
        const response = await fetch('/api/agregar/', { method: 'POST', body: formData });
        return await response.json();
    } catch (error) {
        console.error('Error al subir archivo:', error);
        return null;
    }
}
