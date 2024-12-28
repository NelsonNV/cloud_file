const tipoArchivoVista = {
    image: {
        extensiones: ['png', 'jpg', 'jpeg', 'gif', 'bmp'],
        render: (ruta) => `<img src="${ruta}" alt="Imagen" class="image is-fullwidth">`,
    },
    video: {
        extensiones: ['mp4', 'webm', 'ogg',"mkv"],
        render: (ruta) => `<video src="${ruta}" controls class="video is-fullwidth"></video>`,
    },
    audio: {
        extensiones: ['mp3', 'wav', 'ogg'],
        render: (ruta) => `<audio src="${ruta}" controls class="audio is-fullwidth"></audio>`,
    },
    pdf: {
        extensiones: ['pdf'],
        render: (ruta) => `
            <iframe src="${ruta}" class="iframe" style="width: 100%; height: 600px;" frameborder="0"></iframe>
        `,
    },
    text: {
        extensiones: ['txt', 'log', 'csv'],
        render: async (ruta) => {
            const rutaCompleta = new URL(ruta, window.location.href).href;
            try {
                const contenido = await fetch(rutaCompleta).then((res) => {
                    if (!res.ok) {
                        throw new Error('Archivo no encontrado');
                    }
                    return res.text();
                });
                return `<pre class="box" style="white-space: pre-wrap; word-wrap: break-word;">${contenido}</pre>`;
            } catch (error) {
                console.error('Error al cargar el archivo:', error);
                return `<p class="has-text-danger">Error al cargar el archivo: ${error.message}</p>`;
            }
        },
    },
    ppt: {
        extensiones: ['ppt', 'pptx'],
        render: (ruta) => `
            <iframe src="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(ruta)}"
                style="width: 100%; height: 600px;" frameborder="0"></iframe>
        `,
    },
    default: {
        extensiones: [],
        render: (ruta) => `
            <div class="notification is-warning">
                No se puede previsualizar este tipo de archivo.
                <a href="${ruta}" download class="button is-link is-small">Descargar</a>
            </div>
        `,
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

    if (config.render.constructor.name === 'AsyncFunction') {
        return await config.render(ruta);
    }

    return config.render(ruta);
}

export async function mostrarArchivo(ruta) {
    const modal = document.createElement('div');
    modal.className = 'custom-modal';

    const contenido = await obtenerVistaContenido(ruta);

    modal.innerHTML = `
        <div class="custom-modal-background"></div>
        <div class="custom-modal-card">
            <header class="custom-modal-header">
                <p class="custom-modal-title">Visor de archivo</p>
                <button class="custom-modal-close" aria-label="close">&times;</button>
            </header>
            <section class="custom-modal-body">
                <div class="custom-modal-content">
                    ${contenido}
                </div>
            </section>
            <footer class="custom-modal-footer">
                <button class="custom-modal-button" aria-label="close">Cerrar</button>
            </footer>
        </div>
    `;

    document.body.appendChild(modal);

    const cerrarBotones = modal.querySelectorAll('[aria-label="close"]');
    cerrarBotones.forEach((boton) =>
        boton.addEventListener('click', () => cerrarModal(modal))
    );
    modal.querySelector('.custom-modal-background').addEventListener('click', () => cerrarModal(modal));
}
function cerrarModal(modal) {
    document.body.removeChild(modal);
}
