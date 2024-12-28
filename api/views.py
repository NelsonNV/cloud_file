import os
import shutil
import logging
from django.conf import settings
from django.http import JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render

# Configuración del logger
logging.basicConfig(
    filename=os.path.join(settings.BASE_DIR, "cambios.log"),
    level=logging.INFO,
    format="%(asctime)s - %(message)s",
)


# Función para registrar cambios
def registrar_cambio(accion, detalle):
    logging.info(f"{accion}: {detalle}")


# Listar archivos y carpetas
def listar_archivos(request):
    media_path = settings.MEDIA_ROOT
    contenido = []
    media_url = settings.MEDIA_URL.strip("/")

    for root, dirs, files in os.walk(media_path, followlinks=True):
        for d in dirs:
            full_path = os.path.join(root, d)
            relative_path = os.path.relpath(full_path, media_path).replace("\\", "/")
            contenido.append(
                {
                    "type": "folder",
                    "name": d,
                    "path": f"{media_url}/{relative_path}",
                }
            )

        for f in files:
            full_path = os.path.join(root, f)
            relative_path = os.path.relpath(full_path, media_path).replace("\\", "/")
            contenido.append(
                {
                    "type": "file",
                    "name": f,
                    "path": f"{media_url}/{relative_path}",
                }
            )

    contenido.sort(key=lambda x: (x["type"] != "folder", x["name"].lower()))
    return JsonResponse({"contenido": contenido})


# Crear una nueva carpeta
@csrf_exempt
def crear_carpeta(request):
    nombre_carpeta = request.POST.get("nombre", "nueva_carpeta")
    ruta_carpeta = os.path.join(settings.MEDIA_ROOT, nombre_carpeta)

    # Verificar si ya existe la carpeta
    if not os.path.exists(ruta_carpeta):
        try:
            os.makedirs(ruta_carpeta)
            registrar_cambio("CREAR_CARPETA", f"Nombre: {nombre_carpeta}")
            return JsonResponse(
                {"mensaje": f"Carpeta '{nombre_carpeta}' creada exitosamente."}
            )
        except Exception as e:
            return JsonResponse(
                {"error": f"Error al crear la carpeta: {str(e)}"}, status=500
            )
    return JsonResponse({"error": "La carpeta ya existe."}, status=400)


# Renombrar archivo o carpeta
@csrf_exempt
def renombrar(request):
    ruta = request.POST.get("ruta")
    nuevo_nombre = request.POST.get("nuevo_nombre")

    # Validar parámetros
    if not ruta or not nuevo_nombre:
        return JsonResponse(
            {"error": "Faltan parámetros (ruta o nuevo_nombre)."}, status=400
        )

    # Limpiar prefijo 'media/' si existe
    if ruta.startswith(settings.MEDIA_URL.strip("/")):
        ruta = ruta[len(settings.MEDIA_URL.strip("/")) :].lstrip("/")

    # Rutas absolutas
    antiguo_path = os.path.join(settings.MEDIA_ROOT, ruta)
    nuevo_path = os.path.join(settings.MEDIA_ROOT, os.path.dirname(ruta), nuevo_nombre)

    # Verificar si el elemento actual existe
    if os.path.exists(antiguo_path):
        try:
            os.rename(antiguo_path, nuevo_path)
            registrar_cambio(
                "RENOMBRAR",
                f"De '{os.path.relpath(antiguo_path, settings.MEDIA_ROOT)}' a '{os.path.relpath(nuevo_path, settings.MEDIA_ROOT)}'",
            )
            return JsonResponse({"mensaje": "Renombrado exitosamente."})
        except Exception as e:
            return JsonResponse(
                {
                    "error": f"Error al renombrar: {str(e)}",
                    "ruta_procesada": antiguo_path,
                },
                status=500,
            )

    # Si el archivo/carpeta no existe
    return JsonResponse(
        {"error": "El archivo o carpeta no existe.", "ruta_procesada": antiguo_path},
        status=404,
    )


@csrf_exempt
def mover_archivo(request):
    ruta = request.POST.get("ruta")
    destino = request.POST.get("destino")

    # Validar parámetros
    if not ruta or not destino:
        return JsonResponse(
            {"error": "Faltan parámetros (ruta o destino)."}, status=400
        )

    # Limpiar prefijo 'media/' si existe
    if ruta.startswith(settings.MEDIA_URL.strip("/")):
        ruta = ruta[len(settings.MEDIA_URL.strip("/")) :].lstrip("/")
    if destino.startswith(settings.MEDIA_URL.strip("/")):
        destino = destino[len(settings.MEDIA_URL.strip("/")) :].lstrip("/")

    # Rutas absolutas
    origen_path = os.path.join(settings.MEDIA_ROOT, ruta)
    destino_path = os.path.join(settings.MEDIA_ROOT, destino)

    # Validar si el archivo/carpeta de origen existe
    if not os.path.exists(origen_path):
        return JsonResponse(
            {
                "error": "El archivo o carpeta de origen no existe.",
                "ruta_procesada": origen_path,
            },
            status=404,
        )

    # Validar si el destino es una carpeta existente
    if not os.path.exists(destino_path):
        return JsonResponse(
            {
                "error": "El destino no existe o no es válido.",
                "ruta_procesada": destino_path,
            },
            status=404,
        )

    try:
        if os.path.isdir(destino_path):
            destino_path = os.path.join(destino_path, os.path.basename(ruta))

        # Mover archivo o carpeta
        shutil.move(origen_path, destino_path)
        registrar_cambio("MOVER", f"De '{ruta}' a '{destino}'")
        return JsonResponse({"mensaje": "Archivo o carpeta movida exitosamente."})
    except Exception as e:
        return JsonResponse(
            {
                "error": f"Error al mover el archivo o carpeta:{str(e)}",
                "ruta_procesada": origen_path,
            },
            status=500,
        )


@csrf_exempt
def agregar_archivo(request):
    if request.method == "POST" and request.FILES.get("archivo"):
        archivo = request.FILES["archivo"]
        carpeta = request.POST.get("carpeta", "").strip("/")

        # Construir ruta destino
        destino_path = (
            os.path.join(settings.MEDIA_ROOT, carpeta)
            if carpeta
            else settings.MEDIA_ROOT
        )
        if not os.path.exists(destino_path):
            os.makedirs(destino_path)

        archivo_path = os.path.join(destino_path, archivo.name)

        # Guardar archivo
        try:
            with open(archivo_path, "wb+") as destination:
                for chunk in archivo.chunks():
                    destination.write(chunk)
            registrar_cambio("SUBIR", archivo.name)
            return JsonResponse({"mensaje": "Archivo subido exitosamente."})
        except Exception as e:
            return JsonResponse(
                {"error": f"Error al subir el archivo: {str(e)}"}, status=500
            )

    return JsonResponse({"error": "No se recibió un archivo válido."}, status=400)


@csrf_exempt
def eliminar_archivo(request):
    if request.method == "POST":
        ruta = request.POST.get("ruta")
        if not ruta:
            return JsonResponse({"error": "Ruta no proporcionada."}, status=400)

        # Limpiar prefijos redundantes como "media/"
        if ruta.startswith(settings.MEDIA_URL.strip("/")):
            ruta = ruta[len(settings.MEDIA_URL.strip("/")) :].lstrip("/")

        # Obtener la ruta completa dentro del sistema de archivos
        elemento_path = os.path.join(settings.MEDIA_ROOT, ruta)

        # Verificar si existe y eliminar
        if os.path.exists(elemento_path):
            try:
                # Verificar si es archivo o carpeta
                if os.path.isfile(elemento_path):
                    os.remove(elemento_path)
                    registrar_cambio("ELIMINAR_ARCHIVO", f"Archivo: {ruta}")
                elif os.path.isdir(elemento_path):
                    shutil.rmtree(elemento_path)
                    registrar_cambio("ELIMINAR_CARPETA", f"Carpeta: {ruta}")
                return JsonResponse(
                    {
                        "mensaje": f"Elemento '{ruta}' eliminado exitosamente.",
                        "ruta_eliminada": elemento_path,
                    }
                )
            except Exception as e:
                return JsonResponse(
                    {
                        "error": f"Error al eliminar: {str(e)}",
                        "ruta_procesada": elemento_path,
                    },
                    status=500,
                )

        # Respuesta si no existe
        return JsonResponse(
            {
                "error": "El archivo o carpeta no existe.",
                "datosenviados": ruta,
                "ruta_procesada": elemento_path,
            },
            status=404,
        )

    return JsonResponse({"error": "Método no permitido."}, status=405)


# Vista de la página principal
def index(request):
    return render(request, "index.html")
