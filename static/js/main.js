import { listarArchivos, crearCarpeta, subirArchivo } from './api.js';
import { inicializarUI, renderContenido } from './ui.js';

// Inicializar aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', async () => {
    inicializarUI(); // Configurar eventos de UI
    renderContenido(); // Render inicial de la lista
});
