import { listarArchivos, eliminarElemento, renombrarElemento, moverElemento, subirArchivo, crearCarpeta } from './api.js';
import { mostrarArchivo } from './viewer.js';

let rutaActual = '';

export function inicializarUI() {
    const contenedor = document.getElementById('contenedor');
    const breadcrumb = document.getElementById('breadcrumb');
    const btnSubirArchivo = document.getElementById('btnSubirArchivo');
    const btnCrearCarpeta = document.getElementById('btnCrearCarpeta');

    contenedor.addEventListener('click', async (event) => {
        const target = event.target;

        if (target.classList.contains('boton-ver')) {
            const ruta = target.dataset.ruta;
            await mostrarArchivo(ruta);
        }

        if (target.classList.contains('boton-eliminar')) {
            const nombre = target.dataset.nombre;
            const ruta = target.dataset.ruta;
            const eliminado = await eliminarElemento(nombre, ruta);
            if (eliminado) renderContenido();
        }

        if (target.classList.contains('boton-renombrar')) {
            const ruta = target.dataset.ruta;
            const nombreActual = target.dataset.nombre;
            const nuevoNombre = prompt('Introduce el nuevo nombre:', nombreActual);
          if (nuevoNombre && nuevoNombre !== nombreActual) {
             if (await renombrarElemento(ruta, nuevoNombre)); renderContenido();
          }
        }

        if (target.classList.contains('boton-mover')) {
            const ruta = target.dataset.ruta;
            const nuevaRuta = prompt('Introduce la nueva ruta de destino:');
            if (nuevaRuta && await moverElemento(ruta, nuevaRuta)); renderContenido();
        }

        if (target.classList.contains('carpeta-expandible')) {
            const subLista = target.nextElementSibling;
            const isCollapsed = subLista.style.maxHeight === '0px';
            if (isCollapsed) {
                subLista.style.maxHeight = `${subLista.scrollHeight}px`;
                target.querySelector('.icono').classList.replace('fa-folder', 'fa-folder-open');
                ajustarAlturaPadre(target);
            } else {
                subLista.style.maxHeight = '0';
                target.querySelector('.icono').classList.replace('fa-folder-open', 'fa-folder');
            }
        }
    });

    breadcrumb.addEventListener('click', (event) => {
        if (event.target.tagName === 'A' && event.target.dataset.ruta) {
            rutaActual = event.target.dataset.ruta;
            renderContenido();
        }
    });

    btnCrearCarpeta.addEventListener('click', async () => {
        const nombreCarpeta = prompt('Introduce el nombre de la nueva carpeta:');
        if (!nombreCarpeta) {
            alert('El nombre de la carpeta no puede estar vacío.');
            return;
        }
        if (await crearCarpeta(nombreCarpeta, rutaActual)) renderContenido();
    });

    btnSubirArchivo.addEventListener('click', async () => {
        const archivoInput = document.createElement('input');
        archivoInput.type = 'file';
        archivoInput.style.display = 'none';

        archivoInput.addEventListener('change', async () => {
            const archivo = archivoInput.files[0];
            if (archivo) {
                if (await subirArchivo(archivo, rutaActual)) renderContenido();
            }
        });

        document.body.appendChild(archivoInput);
        archivoInput.click();
        document.body.removeChild(archivoInput);
    });
}

export async function renderContenido() {
    const contenedor = document.getElementById('contenedor');
    const breadcrumb = document.getElementById('breadcrumb');
    const datos = await listarArchivos(rutaActual);

    contenedor.innerHTML = '';
    breadcrumb.innerHTML = '';

    const rutas = rutaActual.split('/').filter((parte) => parte);
    let rutaParcial = '';
    breadcrumb.appendChild(crearBreadcrumbItem('Inicio', ''));
    rutas.forEach((parte) => {
        rutaParcial += `/${parte}`;
        breadcrumb.appendChild(crearBreadcrumbItem(parte, rutaParcial));
    });

    const arbol = construirJerarquia(datos);
    renderizarArbol(arbol, contenedor);
}

function construirJerarquia(contenido) {
    const arbol = {};

    contenido.forEach((item) => {
        const rutaRelativa = item.path.replace(/^media\//, '');
        const partes = rutaRelativa.split('/');

        let nodoActual = arbol;

        partes.forEach((parte, index) => {
            const esUltimo = index === partes.length - 1;

            if (!nodoActual[parte]) {
                nodoActual[parte] = esUltimo ? { ...item } : {};
            }

            nodoActual = nodoActual[parte];
        });
    });

    return arbol;
}

function getIconoSegunExtension(nombreArchivo) {
    const extension = nombreArchivo.split('.').pop().toLowerCase();
    const iconos = {
        'fa-file-image': ['png', 'jpg', 'jpeg', 'gif', 'bmp'],
        'fa-file-archive': ['zip', 'rar', '7z', 'tar', 'gz'],
        'fa-file-video': ['mp4', 'webm', 'ogg', 'mkv'],
        'fa-file-audio': ['mp3', 'wav', 'ogg'],
        'fa-file-pdf': ['pdf'],
        'fa-file-alt': ['txt', 'log', 'csv'],
        'fa-file-word': ['doc', 'docx'],
        'fa-file-excel': ['xls', 'xlsx'],
        'fa-file-powerpoint': ['ppt', 'pptx'],
        'fa-file-code': ['html', 'css', 'js', 'json', 'xml'],
        'fa-key': ['pem', 'ppk', 'key', 'keyx'],
    };

    for (const [icono, extensiones] of Object.entries(iconos)) {
        if (extensiones.includes(extension)) {
            return icono;
        }
    }

    return 'fa-file';
}


function renderizarArbol(arbol, contenedor) {
    const ul = document.createElement('ul');
    ul.classList.add('tree');

    Object.keys(arbol).forEach((clave) => {
        const item = arbol[clave];
        const li = document.createElement('li');
        li.classList.add('mb-3'); // Añadir margen entre elementos

        if (item.type === 'folder') {
            const carpetaDiv = document.createElement('div');
            carpetaDiv.className = 'carpeta-expandible';
            carpetaDiv.innerHTML = `
                <div class="carpeta-header">
                    <i class="fas fa-folder icono"></i>
                    <span class="truncate-text">${item.name}</span>
                </div>
            `;

            const subLista = document.createElement('ul');
            subLista.style.maxHeight = '0'; // Inicia colapsada
            subLista.style.overflow = 'hidden';
            subLista.style.transition = 'max-height 0.3s ease, opacity 0.3s ease';

            renderizarArbol(item, subLista);

            carpetaDiv.addEventListener('click', (event) => {
                event.stopPropagation();
                const isCollapsed = subLista.style.maxHeight === '0px';

                if (isCollapsed) {
                    subLista.style.maxHeight = 'fit-content';
                    subLista.style.opacity = '1';
                    carpetaDiv.querySelector('.icono').classList.replace('fa-folder', 'fa-folder-open');
                } else {
                    subLista.style.maxHeight = '0';
                    subLista.style.opacity = '0';
                    carpetaDiv.querySelector('.icono').classList.replace('fa-folder-open', 'fa-folder');
                }

                actualizarAlturasPadres(carpetaDiv);
            });

            li.appendChild(carpetaDiv);
            li.appendChild(subLista);
        } else if (item.type === 'file') {
            const icono = getIconoSegunExtension(item.name);
            li.innerHTML = `
                <div class="archivo">
                    <div class="archivo-header">
                        <i class="fas ${icono} icono"></i>
                        <span class="truncate-text">${item.name}</span>
                    </div>
                    <div class="botones">
                        <button class="button is-link is-small boton-ver" data-ruta="${item.path}">Ver</button>
                        <button class="button is-danger is-small boton-eliminar" data-nombre="${item.name}" data-ruta="${item.path}">Eliminar</button>
                        <button class="button is-warning is-small boton-renombrar" data-ruta="${item.path}" data-nombre="${item.name}">Renombrar</button>
                        <button class="button is-primary is-small boton-mover" data-ruta="${item.path}">Mover</button>
                    </div>
                </div>
            `;
        }

        ul.appendChild(li);
    });

    contenedor.appendChild(ul);
}

/**
 * Ajustar dinámicamente las alturas de los padres para evitar solapamientos.
 * @param {HTMLElement} elemento El contenedor que contiene la sublista.
 */
function actualizarAlturasPadres(elemento) {
    let nodoPadre = elemento.parentElement;
    while (nodoPadre && nodoPadre.tagName === 'li') {
        const subLista = nodoPadre.querySelector('ul');
        if (subLista) {
            subLista.style.maxHeight = 'fit-content';
        }
        nodoPadre = nodoPadre.parentElement.closest('li');
    }
}

function crearBreadcrumbItem(nombre, ruta) {
    const li = document.createElement('li');
    li.classList.add('breadcrumb-item');
    const link = document.createElement('a');
    link.textContent = nombre;
    link.dataset.ruta = ruta;
    link.href = '#';
    li.appendChild(link);
    return li;
}
