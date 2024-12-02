import { listarArchivos, eliminarElemento, renombrarElemento, moverElemento, subirArchivo, crearCarpeta } from './api.js';
import { mostrarArchivo } from './viewer.js';

let rutaActual = '';

// Inicializar la UI
export function inicializarUI() {
    const contenedor = document.getElementById('contenedor');
    const breadcrumb = document.getElementById('breadcrumb');
    const btnSubirArchivo = document.getElementById('btnSubirArchivo');
    const formSubirArchivo = document.getElementById('formSubirArchivo');
    const archivoInput = document.getElementById('archivoInput');
    const btnSubir = document.getElementById('btnSubir');
    const btnCrearCarpeta = document.getElementById('btnCrearCarpeta');

    // Delegar eventos dentro del contenedor principal
    contenedor.addEventListener('click', async (event) => {
        const target = event.target;

        if (target.classList.contains('boton-ver')) {
            const ruta = target.dataset.ruta;
            mostrarArchivo(ruta);
        }

        if (target.classList.contains('boton-eliminar')) {
            const nombre = target.dataset.nombre;
            const ruta = target.dataset.ruta;
            const eliminado = await eliminarElemento(nombre, ruta);
            if (eliminado) renderContenido();
        }

        if (target.classList.contains('boton-renombrar')) {
            const ruta = target.dataset.ruta;
            const renombrado = await renombrarElemento(ruta);
            if (renombrado) renderContenido();
        }

        if (target.classList.contains('boton-mover')) {
            const ruta = target.dataset.ruta;
            const destino = prompt('Introduce la ruta destino:', '');
            if (destino) {
                const movido = await moverElemento(ruta, destino);
                if (movido) renderContenido();
            }
        }

        if (target.classList.contains('carpeta')) {
            rutaActual = target.dataset.ruta;
            renderContenido();
        }
    });

    // Delegar eventos en el breadcrumb
    breadcrumb.addEventListener('click', (event) => {
        if (event.target.tagName === 'A' && event.target.dataset.ruta) {
            rutaActual = event.target.dataset.ruta;
            renderContenido();
        }
    });

    // Mostrar/ocultar formulario de subir archivo
    btnSubirArchivo.addEventListener('click', () => {
        formSubirArchivo.style.display =
            formSubirArchivo.style.display === 'none' ? 'block' : 'none';
    });

    // Subir archivo
    btnSubir.addEventListener('click', async () => {
        const archivo = archivoInput.files[0];
        if (!archivo) {
            alert('Por favor, selecciona un archivo.');
            return;
        }
        const resultado = await subirArchivo(archivo, rutaActual);
        if (resultado && resultado.mensaje) {
            alert(resultado.mensaje);
            renderContenido();
        } else {
            alert('Error al subir el archivo.');
        }
    });

    // Crear carpeta
    btnCrearCarpeta.addEventListener('click', async () => {
        const nombreCarpeta = prompt('Introduce el nombre de la nueva carpeta:');
        if (!nombreCarpeta) {
            alert('El nombre de la carpeta no puede estar vacío.');
            return;
        }

        const resultado = await crearCarpeta(nombreCarpeta, rutaActual);
        if (resultado && resultado.mensaje) {
            alert(resultado.mensaje);
            renderContenido();
        } else {
            alert('Error al crear la carpeta.');
        }
    });
}

export async function renderContenido() {
    const contenedor = document.getElementById('contenedor');
    const breadcrumb = document.getElementById('breadcrumb');
    const archivos = await listarArchivos(rutaActual);

    // Limpiar contenido previo
    contenedor.innerHTML = '';
    breadcrumb.innerHTML = '';

    // Actualizar Breadcrumb
    const rutas = rutaActual.split('/').filter((parte) => parte);
    let rutaParcial = '';
    breadcrumb.appendChild(crearBreadcrumbItem('Inicio', ''));
    rutas.forEach((parte) => {
        rutaParcial += `/${parte}`;
        breadcrumb.appendChild(crearBreadcrumbItem(parte, rutaParcial));
    });

    // Mostrar carpetas primero
    archivos
        .filter((item) => item.type === 'folder')
        .forEach((carpeta) => {
            contenedor.appendChild(crearElementoCarpeta(carpeta));
        });

    // Mostrar archivos
    archivos
        .filter((item) => item.type === 'file')
        .forEach((archivo) => {
            contenedor.appendChild(crearElementoArchivo(archivo));
        });
}

// Crear elemento de Breadcrumb
function crearBreadcrumbItem(nombre, ruta) {
    const li = document.createElement('li');
    li.className = 'breadcrumb-item';

    const link = document.createElement('a');
    link.textContent = nombre;
    link.dataset.ruta = ruta;
    link.href = '#';
    li.appendChild(link);

    return li;
}

// Crear elemento de Carpeta
function crearElementoCarpeta(carpeta) {
    const div = document.createElement('div');
    div.className = 'column is-one-quarter has-text-centered carpeta';
    div.dataset.ruta = carpeta.path;

    div.innerHTML = `
        <i class="fas fa-folder fa-3x has-text-warning mb-2"></i>
        <div>${carpeta.name}</div>
    `;

    return div;
}

// Crear elemento de Archivo
function crearElementoArchivo(archivo) {
    const div = document.createElement('div');
    div.className = 'column is-one-quarter has-text-centered archivo';

    div.innerHTML = `
        <i class="fas fa-file fa-3x has-text-secondary mb-2"></i>
        <div>${archivo.name}</div>
        <button class="button is-small is-info boton-ver" data-ruta="${archivo.path}" data-tipo="${archivo.type}">Ver</button>
        <button class="button is-small is-danger boton-eliminar" data-nombre="${archivo.name}" data-ruta="${archivo.path}">Eliminar</button>
        <button class="button is-small is-warning boton-renombrar" data-ruta="${archivo.path}">Renombrar</button>
        <button class="button is-small is-primary boton-mover" data-ruta="${archivo.path}">Mover</button>
    `;

    return div;
}
