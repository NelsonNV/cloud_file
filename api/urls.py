from django.urls import path
from api import views

urlpatterns = [
    path("listar/", views.listar_archivos, name="listar_archivos"),
    path("crear-carpeta/", views.crear_carpeta, name="crear_carpeta"),
    path("renombrar/", views.renombrar, name="renombrar"),
    path("mover/", views.mover_archivo, name="mover_archivo"),
    path("agregar/", views.agregar_archivo, name="agregar_archivo"),
    path("eliminar/", views.eliminar_archivo, name="eliminar_archivo"),
]
