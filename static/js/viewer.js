const tipoArchivoVista = {
    image: {
        extensiones: ['png', 'jpg', 'jpeg', 'gif', 'bmp'],
        render: (ruta) => `<img src="${ruta}" alt="Imagen" class="image">`,
    },
    video: {
        extensiones: ['mp4', 'webm', 'ogg'],
        render: (ruta) => `<video src="${ruta}" controls class="video"></video>`,
    },
    pdf: {
        extensiones: ['pdf'],
        render: (ruta) => `<a href="${ruta}" class="btn btn-primary">ir al pdf</a>`,
    },
    text: {
        extensiones: ['txt', 'log', 'csv'],
        render: async (ruta) => {
            // Comprobar si la ruta necesita un ajuste (por ejemplo, prefijar la ruta base)
            const rutaCompleta = new URL(ruta, window.location.href).href;
            try {
                const contenido = await fetch(rutaCompleta)
                    .then((res) => {
                        if (!res.ok) {
                            throw new Error('Archivo no encontrado');
                        }
                        return res.text();
                    });
                return `<pre style="white-space: pre-wrap; word-wrap: break-word;">${contenido}</pre>`;
            } catch (error) {
                console.error('Error al cargar el archivo:', error);
                return `<p>Error al cargar el archivo: ${error.message}</p>`;
            }
        },
    },
    ppt: {
        extensiones: ['ppt', 'pptx'],
        render: (ruta) => `<iframe src="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(ruta)}" width="100%" height="600px"></iframe>`,
    },
    default: {
        extensiones: [],
        render: (ruta) => `<p>No se puede previsualizar este tipo de archivo. <a href="${ruta}" download>Descargar</a></p>`,
    },
};

function obtenerTipoArchivo(ruta) {
    const extension = ruta.split('.').pop().toLowerCase();
    for (const [tipo, config] of Object.entries(tipoArchivoVista)) {
        if (config.extensiones.includes(extension)) {
            return tipo;
        }
    }
    return 'default';
}

export async function obtenerVistaContenido(ruta) {
    const tipo = obtenerTipoArchivo(ruta);
    const config = tipoArchivoVista[tipo];

    // Si el render es una función asíncrona (por ejemplo, para archivos de texto)
    if (config.render.constructor.name === 'AsyncFunction') {
        return await config.render(ruta);
    }

    return config.render(ruta);
}

export async function mostrarArchivo(ruta) {

    const tipo = obtenerTipoArchivo(ruta);

    // Crear el modal
    const modal = document.createElement('div');
    modal.className = 'modal is-active ';

    const contenido = await obtenerVistaContenido(ruta);

    modal.innerHTML = `
        <div class="modal-background"></div>
        <div class="modal-content">
            ${contenido}
        </div>
        <button class="modal-close is-large" aria-label="close"></button>
    `;


    // Añadir el modal al body
    document.body.appendChild(modal);

    // Añadir eventos para cerrar el modal
    modal.querySelector('.modal-background').addEventListener('click', () => cerrarModal(modal));
    modal.querySelector('.modal-close').addEventListener('click', () => cerrarModal(modal));
}
function cerrarModal(modal) {
    document.body.removeChild(modal);
}
